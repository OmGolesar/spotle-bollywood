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

type PoolJoin = { movie_id: string; movies: { title: string; year: number } };

async function pickTopForPool(
  db: SupabaseClient,
  difficulty: Difficulty
): Promise<PoolJoin | null> {
  const { data, error } = await db
    .from("movie_pools")
    .select("movie_id, movies!inner(title, year, tmdb_id)")
    .eq("difficulty", difficulty)
    .order("added_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`pool ${difficulty}: ${error.message}`);
  const rows = (data ?? []) as unknown as PoolJoin[];
  // We don't have a vote_count view here; the loader inserted in rank order,
  // so first-added is top-ranked. Fall back gracefully if the pool is empty.
  return rows[0] ?? null;
}

async function main() {
  const force = process.argv.includes("--force");
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const today = istDateKey();
  console.log(`Scheduling today (${today}) across ${DIFFICULTIES.length} difficulties… (force=${force})\n`);

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
      continue;
    }

    const top = await pickTopForPool(db, d);
    if (!top) {
      console.log(`  ${d}: pool is empty — skipping (run tmdb:import + movies:load first)`);
      continue;
    }

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
