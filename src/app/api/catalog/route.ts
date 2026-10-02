import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { badRequest, parseDifficulty, requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;

type MovieJoin = { id: string; title: string; year: number; poster_url: string };

export async function GET(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;
  const url = new URL(req.url);
  const difficulty = parseDifficulty(url.searchParams.get("difficulty"));
  if (!difficulty) return badRequest("difficulty required");
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json({ results: [] });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("movie_pools")
    .select("movies!inner(id, title, year, poster_url)")
    .eq("difficulty", difficulty)
    .ilike("movies.title", `%${q}%`)
    .limit(MAX_RESULTS);

  if (error) {
    console.error("catalog query failed", error.message);
    return NextResponse.json({ results: [] });
  }

  const results = (data ?? [])
    .map((r) => {
      const m = r.movies as unknown as MovieJoin | MovieJoin[] | null;
      const movie = Array.isArray(m) ? m[0] : m;
      if (!movie) return null;
      return {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        posterThumb: movie.poster_url,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  return NextResponse.json({ results });
}
