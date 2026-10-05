import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import type { Difficulty } from "../difficulty";
import { istDateKey } from "../dateIst";

export type ScheduledCell = {
  movieId: string;
  title: string;
  year: number;
  status: "scheduled" | "live" | "archived";
};

export type DayRow = {
  dateKey: string;
  dayLabel: string;
  dowLabel: string;
  cells: Record<Difficulty, ScheduledCell | null>;
};

function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86_400_000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function labelsFor(dateKey: string): { dayLabel: string; dowLabel: string } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    dayLabel: dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
    dowLabel: dt.toLocaleDateString("en-IN", {
      weekday: "short",
      timeZone: "UTC",
    }),
  };
}

export function nextNDays(n: number, startKey = istDateKey()): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(addDays(startKey, i));
  return out;
}

function dateRangeKeys(pastDays: number, futureDays: number): string[] {
  const today = istDateKey();
  const out: string[] = [];
  for (let i = pastDays; i >= 1; i--) out.push(addDays(today, -i));
  for (let i = 0; i < futureDays; i++) out.push(addDays(today, i));
  return out;
}

export async function loadSchedule(
  daysOrOpts: number | { pastDays?: number; futureDays?: number } = 30
): Promise<DayRow[]> {
  const dateKeys =
    typeof daysOrOpts === "number"
      ? nextNDays(daysOrOpts)
      : dateRangeKeys(daysOrOpts.pastDays ?? 0, daysOrOpts.futureDays ?? 30);
  const first = dateKeys[0];
  const last = dateKeys[dateKeys.length - 1];

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("daily_puzzles")
    .select("puzzle_date, difficulty, status, movies!inner(id, title, year)")
    .gte("puzzle_date", first)
    .lte("puzzle_date", last);

  if (error) {
    console.error("loadSchedule failed", error.message);
    return dateKeys.map((k) => {
      const l = labelsFor(k);
      return { dateKey: k, ...l, cells: { easy: null, medium: null, hard: null } };
    });
  }

  type Join = {
    puzzle_date: string;
    difficulty: Difficulty;
    status: ScheduledCell["status"];
    movies: { id: string; title: string; year: number } | { id: string; title: string; year: number }[] | null;
  };

  const byDay = new Map<string, Record<Difficulty, ScheduledCell | null>>();
  for (const k of dateKeys) byDay.set(k, { easy: null, medium: null, hard: null });

  for (const row of (data ?? []) as unknown as Join[]) {
    const m = Array.isArray(row.movies) ? row.movies[0] : row.movies;
    if (!m) continue;
    const cells = byDay.get(row.puzzle_date);
    if (!cells) continue;
    cells[row.difficulty] = {
      movieId: m.id,
      title: m.title,
      year: m.year,
      status: row.status,
    };
  }

  return dateKeys.map((k) => {
    const l = labelsFor(k);
    return { dateKey: k, ...l, cells: byDay.get(k)! };
  });
}

export type PoolFilm = {
  id: string;
  title: string;
  year: number;
  director: string[];
  castTop3: string[];
  dataQuality: "verified" | "tmdb_only" | "partial";
};

export async function loadPool(difficulty: Difficulty): Promise<PoolFilm[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("movie_pools")
    .select("movies!inner(id, title, year, director, cast_top3, data_quality)")
    .eq("difficulty", difficulty);
  if (error || !data) return [];
  type Row = {
    movies:
      | { id: string; title: string; year: number; director: string[]; cast_top3: string[]; data_quality: PoolFilm["dataQuality"] }
      | { id: string; title: string; year: number; director: string[]; cast_top3: string[]; data_quality: PoolFilm["dataQuality"] }[]
      | null;
  };
  return (data as unknown as Row[])
    .map((r) => (Array.isArray(r.movies) ? r.movies[0] : r.movies))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      year: m.year,
      director: m.director,
      castTop3: m.cast_top3,
      dataQuality: m.data_quality,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export type SoftWarning = { kind: "director" | "lead"; name: string; onDate: string; title: string };

export async function recentOverlapWarnings(
  dateKey: string,
  difficulty: Difficulty,
  candidate: PoolFilm
): Promise<SoftWarning[]> {
  const prevKeys: string[] = [];
  for (let i = 1; i <= 7; i++) prevKeys.push(addDays(dateKey, -i));

  const db = supabaseAdmin();
  const { data } = await db
    .from("daily_puzzles")
    .select("puzzle_date, movies!inner(title, director, cast_top3)")
    .eq("difficulty", difficulty)
    .in("puzzle_date", prevKeys);

  type Row = {
    puzzle_date: string;
    movies:
      | { title: string; director: string[]; cast_top3: string[] }
      | { title: string; director: string[]; cast_top3: string[] }[]
      | null;
  };

  const warnings: SoftWarning[] = [];
  for (const row of (data ?? []) as unknown as Row[]) {
    const m = Array.isArray(row.movies) ? row.movies[0] : row.movies;
    if (!m) continue;
    for (const d of candidate.director) {
      if (m.director.includes(d)) {
        warnings.push({ kind: "director", name: d, onDate: row.puzzle_date, title: m.title });
      }
    }
    if (candidate.castTop3[0] && m.cast_top3[0] === candidate.castTop3[0]) {
      warnings.push({
        kind: "lead",
        name: candidate.castTop3[0],
        onDate: row.puzzle_date,
        title: m.title,
      });
    }
  }
  return warnings;
}

export function isTodayOrFuture(dateKey: string): boolean {
  return dateKey >= istDateKey();
}
