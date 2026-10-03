/**
 * Dev-only helper: ensures today's three difficulty puzzles are
 * scheduled against the top-ranked films already in the catalog.
 *
 * As of Chunk 6b the catalog itself is sourced from TMDB:
 *   npm run tmdb:import
 *   npm run movies:load
 *   npm run edges:compute
 *
 * This script no longer inserts movies. It only touches daily_puzzles,
 * picking the top film from each pool by vote-count-equivalent rank.
 * Safe to run anytime; existing scheduled puzzles are left alone.
 *
 * Usage:
 *   npm run seed             # fills missing slots for today only
 *   npm run seed -- --force  # overwrites today's slots even if scheduled
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DIFFICULTIES, type Difficulty } from "../src/lib/difficulty.js";
import { istDateKey } from "../src/lib/dateIst.js";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — populate .env.local`);
  return v;
}

type PoolJoin = {
  movie_id: string;
  movies: { title: string; year: number; tmdb_id: number | null; imdb_score: number | null };
};

async function pickTopForPool(
  db: SupabaseClient,
  difficulty: Difficulty,
  skip: Set<string>
): Promise<PoolJoin | null> {
  const { data, error } = await db
    .from("movie_pools")
    .select("movie_id, movies!inner(title, year, tmdb_id, imdb_score)")
    .eq("difficulty", difficulty)
    .limit(500);
  if (error) throw new Error(`pool ${difficulty}: ${error.message}`);
  const rows = (data ?? []) as unknown as PoolJoin[];
  if (rows.length === 0) return null;

  // Rank preference, highest first:
  //   1. films sourced from TMDB (have a real poster + metadata)
  //   2. then by imdb_score desc (null-rated films sink)
  //   3. then by year desc (newer wins ties)
  const ranked = rows
    .filter((r) => !skip.has(r.movie_id))
    .sort((a, b) => {
      const aTmdb = a.movies.tmdb_id != null ? 1 : 0;
      const bTmdb = b.movies.tmdb_id != null ? 1 : 0;
      if (aTmdb !== bTmdb) return bTmdb - aTmdb;
      const aScore = a.movies.imdb_score ?? -1;
      const bScore = b.movies.imdb_score ?? -1;
      if (aScore !== bScore) return bScore - aScore;
      return b.movies.year - a.movies.year;
    });
  return ranked[0] ?? null;
}

async function main() {
  const force = process.argv.includes("--force");
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const today = istDateKey();
  console.log(`Scheduling today (${today}) across ${DIFFICULTIES.length} difficulties… (force=${force})\n`);

  const used = new Set<string>();
  for (const d of DIFFICULTIES) {
    const existing = await db
      .from("daily_puzzles")
      .select("movie_id, movies!inner(title, year)")
      .eq("puzzle_date", today)
      .eq("difficulty", d)
      .maybeSingle();

    if (existing.data && !force) {
      const m = existing.data.movies as unknown as { title: string; year: number };
      console.log(`  ${d}: already scheduled → ${m.title} (${m.year})`);
      used.add(existing.data.movie_id as string);
      continue;
    }

    const top = await pickTopForPool(db, d, used);
    if (!top) {
      console.log(`  ${d}: pool is empty — skipping (run tmdb:import + movies:load first)`);
      continue;
    }
    used.add(top.movie_id);

    const up = await db
      .from("daily_puzzles")
      .upsert(
        { puzzle_date: today, difficulty: d, movie_id: top.movie_id, status: "live" },
        { onConflict: "puzzle_date,difficulty" }
      );
    if (up.error) throw new Error(`upsert ${d}: ${up.error.message}`);
    console.log(`  ${d}: scheduled ${top.movies.title} (${top.movies.year})`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
