/**
 * Idempotent seed for the Spotle Bollywood dev/preview DB.
 *
 *   Reads the Chunk-2 mock catalog, upserts movies + pools, schedules
 *   today's puzzle for all three difficulties, and warms the edge tables.
 *
 * Usage:
 *   npm run seed           # requires .env.local with SUPABASE_* keys
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  MOCK_MOVIES,
  MOCK_POOLS,
  MOCK_MYSTERY_PER_DIFFICULTY,
} from "../src/lib/mock.js";
import { DIFFICULTIES, type Difficulty } from "../src/lib/difficulty.js";
import { istDateKey } from "../src/lib/dateIst.js";
import type { Movie } from "../src/lib/types.js";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — populate .env.local`);
  return v;
}

/** Deterministic UUID (v5-style) from a slug so re-seeding is idempotent. */
function uuidFromSlug(slug: string): string {
  const h = createHash("sha1").update(`spotle:${slug}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

async function main() {
  const db = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  const movieRows = MOCK_MOVIES.map((m) => toMovieRow(m));

  console.log(`Upserting ${movieRows.length} movies…`);
  const movieUpsert = await db
    .from("movies")
    .upsert(movieRows, { onConflict: "id" });
  if (movieUpsert.error) throw new Error(movieUpsert.error.message);

  console.log("Upserting movie_pools…");
  const poolRows: { movie_id: string; difficulty: Difficulty }[] = [];
  for (const diff of DIFFICULTIES) {
    for (const slug of MOCK_POOLS[diff]) {
      poolRows.push({ movie_id: uuidFromSlug(slug), difficulty: diff });
    }
  }
  const poolUpsert = await db
    .from("movie_pools")
    .upsert(poolRows, { onConflict: "movie_id,difficulty" });
  if (poolUpsert.error) throw new Error(poolUpsert.error.message);

  console.log("Scheduling today's puzzles…");
  const today = istDateKey();
  const puzzleRows = DIFFICULTIES.map((d) => ({
    puzzle_date: today,
    difficulty: d,
    movie_id: uuidFromSlug(MOCK_MYSTERY_PER_DIFFICULTY[d]),
    status: "live" as const,
  }));
  const puzzleUpsert = await db
    .from("daily_puzzles")
    .upsert(puzzleRows, { onConflict: "puzzle_date,difficulty" });
  if (puzzleUpsert.error) throw new Error(puzzleUpsert.error.message);

  console.log("Rebuilding edge tables…");
  await rebuildEdges(db, "director_edges", ["director_a", "director_b"], (m) => m.director);
  await rebuildEdges(db, "music_director_edges", ["md_a", "md_b"], (m) => m.musicDirectors);

  console.log(`\nSeed complete. Today (IST) is ${today}.`);
  for (const d of DIFFICULTIES) {
    console.log(`  ${d}: ${MOCK_MYSTERY_PER_DIFFICULTY[d]}`);
  }
}

function toMovieRow(m: Movie) {
  return {
    id: uuidFromSlug(m.id),
    tmdb_id: null,
    title: m.title,
    title_alternates: [],
    year: m.year,
    director: m.director,
    cast_top3: m.castTop3,
    music_directors: m.musicDirectors,
    banner: m.banner,
    banner_parent: m.bannerParent,
    genres: m.genres,
    box_office_cr: m.boxOfficeCr,
    imdb_score: m.imdbScore,
    poster_url: m.posterUrl,
    trivia: m.trivia,
    where_to_watch_url: m.whereToWatchUrl,
    hint_easy: m.hintEasy,
    hint_medium: m.hintMedium,
    hint_hard: m.hintHard,
    data_quality: "verified" as const,
  };
}

async function rebuildEdges(
  db: SupabaseClient,
  table: string,
  cols: [string, string],
  pick: (m: Movie) => string[]
) {
  const pairs = new Set<string>();
  for (const m of MOCK_MOVIES) {
    const names = pick(m);
    for (const a of names) for (const b of names) if (a !== b) pairs.add(`${a}\x1f${b}`);
  }
  const rows = Array.from(pairs).map((p) => {
    const [a, b] = p.split("\x1f");
    return { [cols[0]]: a, [cols[1]]: b } as Record<string, string>;
  });
  await db.from(table).delete().not(cols[0], "is", null);
  if (rows.length > 0) {
    const ins = await db.from(table).insert(rows);
    if (ins.error) throw new Error(`${table}: ${ins.error.message}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
