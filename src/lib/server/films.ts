import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import type { DataQuality } from "../supabase/types";

export type FilmListItem = {
  id: string;
  title: string;
  year: number;
  director: string[];
  cast_top3: string[];
  banner: string;
  data_quality: DataQuality;
  trivia_set: boolean;
  hints_set: number;
};

export type FilmFilter = "all" | "needs_data" | "verified";

export type FilmListResult = {
  items: FilmListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

const PER_PAGE = 25;

export async function loadFilmList(opts: {
  filter: FilmFilter;
  q: string;
  page: number;
}): Promise<FilmListResult> {
  const page = Math.max(1, opts.page || 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const db = supabaseAdmin();
  let query = db
    .from("movies")
    .select(
      "id, title, year, director, cast_top3, banner, data_quality, trivia, hint_easy, hint_medium, hint_hard",
      { count: "exact" }
    )
    .order("title", { ascending: true })
    .range(from, to);

  if (opts.filter === "needs_data") {
    query = query.in("data_quality", ["tmdb_only", "partial"]);
  } else if (opts.filter === "verified") {
    query = query.eq("data_quality", "verified");
  }

  const q = opts.q.trim();
  if (q.length > 0) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("loadFilmList failed", error.message);
    return { items: [], total: 0, page, perPage: PER_PAGE, pageCount: 0 };
  }

  type Row = {
    id: string;
    title: string;
    year: number;
    director: string[];
    cast_top3: string[];
    banner: string;
    data_quality: DataQuality;
    trivia: string;
    hint_easy: string;
    hint_medium: string;
    hint_hard: string;
  };

  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    year: r.year,
    director: r.director,
    cast_top3: r.cast_top3,
    banner: r.banner,
    data_quality: r.data_quality,
    trivia_set: r.trivia.trim().length > 0,
    hints_set: [r.hint_easy, r.hint_medium, r.hint_hard].filter((h) => h.trim().length > 0).length,
  }));

  const total = count ?? items.length;
  return {
    items,
    total,
    page,
    perPage: PER_PAGE,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

export type EditableFilm = {
  id: string;
  title: string;
  year: number;
  director: string[];
  cast_top3: string[];
  music_directors: string[];
  banner: string;
  banner_parent: string | null;
  genres: string[];
  poster_url: string;
  box_office_cr: number | null;
  imdb_score: number | null;
  trivia: string;
  where_to_watch_url: string | null;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
  data_quality: DataQuality;
  tmdb_id: number | null;
};

export async function loadEditableFilm(id: string): Promise<EditableFilm | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("movies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditableFilm;
}

export async function loadFilmStats(): Promise<{ total: number; needs_data: number; verified: number }> {
  const db = supabaseAdmin();
  const [all, needs, verified] = await Promise.all([
    db.from("movies").select("id", { count: "exact", head: true }),
    db
      .from("movies")
      .select("id", { count: "exact", head: true })
      .in("data_quality", ["tmdb_only", "partial"]),
    db.from("movies").select("id", { count: "exact", head: true }).eq("data_quality", "verified"),
  ]);
  return {
    total: all.count ?? 0,
    needs_data: needs.count ?? 0,
    verified: verified.count ?? 0,
  };
}
