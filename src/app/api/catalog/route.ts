import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { badRequest, parseDifficulty, requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 8;

export async function GET(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;
  const url = new URL(req.url);
  const difficulty = parseDifficulty(url.searchParams.get("difficulty"));
  if (!difficulty) return badRequest("difficulty required");
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json({ results: [] });

  // The search pool is the FULL catalogue regardless of difficulty — a
  // player on Easy can still type an obscure film they half-remember.
  // Difficulty only controls which films are chosen as the mystery.
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("movies")
    .select("id, title, year, poster_url")
    .ilike("title", `%${q}%`)
    .order("year", { ascending: false })
    .limit(MAX_RESULTS);

  if (error) {
    console.error("catalog query failed", error.message);
    return NextResponse.json({ results: [] });
  }

  const results = (data ?? []).map((movie) => ({
    id: movie.id as string,
    title: movie.title as string,
    year: movie.year as number,
    posterThumb: movie.poster_url as string,
  }));

  return NextResponse.json({ results });
}
