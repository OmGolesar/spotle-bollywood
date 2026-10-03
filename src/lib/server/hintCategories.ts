import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import type { HintCategory } from "../hintCategories";
import type { MovieRow } from "../supabase/types";

export type HintReveal = {
  category: HintCategory;
  text: string;
};

export type HintAvailability = {
  category: HintCategory;
  available: boolean;
};

export async function availabilityFor(mystery: MovieRow): Promise<HintAvailability[]> {
  const [tagline, filmography, cast] = await Promise.all([
    Promise.resolve(hasTagline(mystery)),
    hasFilmography(mystery),
    Promise.resolve(hasCast(mystery)),
  ]);
  return [
    { category: "tagline", available: tagline },
    { category: "filmography", available: filmography },
    { category: "cast", available: cast },
  ];
}

export async function revealFor(
  mystery: MovieRow,
  category: HintCategory
): Promise<HintReveal | null> {
  switch (category) {
    case "tagline": {
      const t = mystery.tagline?.trim();
      if (!t) return null;
      return { category, text: `"${t}"` };
    }
    case "cast": {
      const text = castRevealText(mystery);
      return text ? { category, text } : null;
    }
    case "filmography": {
      const text = await filmographyRevealText(mystery);
      return text ? { category, text } : null;
    }
  }
}

function hasTagline(m: MovieRow): boolean {
  return !!m.tagline && m.tagline.trim().length > 0;
}

function hasCast(m: MovieRow): boolean {
  return (m.cast_top3?.length ?? 0) >= 2;
}

function castRevealText(m: MovieRow): string | null {
  // Prefer a non-lead cast member for a more interesting hint — fall back
  // to the lead if there's only one listed.
  const cast = m.cast_top3 ?? [];
  const pick = cast[1] ?? cast[2] ?? cast[0];
  if (!pick) return null;
  return `One of the leads: ${pick}.`;
}

async function hasFilmography(m: MovieRow): Promise<boolean> {
  const other = await findOtherFilmByDirector(m);
  return other != null;
}

async function filmographyRevealText(m: MovieRow): Promise<string | null> {
  const other = await findOtherFilmByDirector(m);
  if (!other) return null;
  const director = m.director?.[0] ?? "The director";
  return `${director} also directed “${other.title}” (${other.year}).`;
}

async function findOtherFilmByDirector(
  m: MovieRow
): Promise<{ title: string; year: number } | null> {
  const directors = m.director ?? [];
  if (directors.length === 0) return null;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("movies")
    .select("id, title, year, director")
    .overlaps("director", directors)
    .neq("id", m.id)
    .order("year", { ascending: false })
    .limit(10);
  if (error || !data || data.length === 0) return null;

  // Deterministic pick: hash by mystery id so the hint stays stable across
  // reveals for the same play; but prefer a different year if available.
  const sameDirector = (data as { id: string; title: string; year: number; director: string[] }[]).filter(
    (r) => (r.director ?? []).some((d) => directors.includes(d))
  );
  if (sameDirector.length === 0) return null;

  const idx = Math.abs(hashString(m.id)) % sameDirector.length;
  const pick = sameDirector[idx];
  return { title: pick.title, year: pick.year };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
