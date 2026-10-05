import "server-only";
import { istDateKey } from "../dateIst";
import type { Difficulty } from "../difficulty";
import { supabaseAdmin } from "./../supabase/admin";

export type ArchiveCard = {
  date: string; // YYYY-MM-DD
  // Sequential number assigned by scheduled order per difficulty — #1 is the
  // oldest live/archived puzzle for this difficulty, higher numbers are newer.
  // Mirrors spotle.movie's `#NNN`.
  number: number;
  title: string;
  posterUrl: string;
  isToday: boolean;
  // The current player (via the browser cookie) has completed the daily
  // puzzle for this date/difficulty. Drives the poster-reveal in the grid.
  played: boolean;
};

export type ArchiveGrid = {
  difficulty: Difficulty;
  total: number;
  playedCount: number;
  cards: ArchiveCard[]; // newest first
};

// Loads every scheduled puzzle (today included) for a difficulty, numbers
// them in chronological order, and flags the ones the current player has
// completed in the daily flow. Everything the archive index needs.
export async function loadArchiveGrid(
  playerId: string | null,
  difficulty: Difficulty
): Promise<ArchiveGrid> {
  const db = supabaseAdmin();
  const today = istDateKey();

  const { data, error } = await db
    .from("daily_puzzles")
    .select("puzzle_date, status, movies!inner(title, poster_url)")
    .eq("difficulty", difficulty)
    .in("status", ["live", "archived"])
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: true });

  if (error || !data) {
    return { difficulty, total: 0, playedCount: 0, cards: [] };
  }

  type Row = {
    puzzle_date: string;
    status: "live" | "archived";
    movies:
      | { title: string; poster_url: string }
      | { title: string; poster_url: string }[]
      | null;
  };

  const asc = (data as unknown as Row[])
    .map((row) => {
      const m = Array.isArray(row.movies) ? row.movies[0] : row.movies;
      if (!m) return null;
      return { date: row.puzzle_date, title: m.title, posterUrl: m.poster_url };
    })
    .filter((x): x is { date: string; title: string; posterUrl: string } => x != null);

  // Fetch which dates this player has completed, in a single query. If no
  // cookie, every card renders as unplayed.
  const playedSet = new Set<string>();
  if (playerId) {
    const { data: played } = await db
      .from("plays")
      .select("puzzle_date")
      .eq("player_id", playerId)
      .eq("difficulty", difficulty)
      .in("outcome", ["won", "lost"]);
    for (const row of played ?? []) playedSet.add(row.puzzle_date as string);
  }

  const cards: ArchiveCard[] = asc.map((row, i) => ({
    date: row.date,
    number: i + 1,
    title: row.title,
    posterUrl: row.posterUrl,
    isToday: row.date === today,
    played: playedSet.has(row.date),
  }));

  cards.reverse(); // newest first
  return {
    difficulty,
    total: cards.length,
    playedCount: cards.filter((c) => c.played).length,
    cards,
  };
}
