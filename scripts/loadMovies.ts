/**
 * Content pipeline step 2 — load staged TMDB films into Supabase.
 *
 * Reads scripts/staging/tmdb.json, upserts every film into `movies` with a
 * deterministic UUID derived from the tmdb_id, and assigns films to the
 * three difficulty pools (cumulative: Hard = all, Medium = top-M, Easy =
 * top-E) sorted by vote_count desc.
 *
 * Idempotent — re-running will reconcile pool membership (added rows for
 * new films, no-op for existing ones). It does NOT remove films that are
 * now outside a tier's cutoff; curators manage removals via the admin UI.
 *
 * Usage:
 *   npm run movies:load -- --easy=500 --medium=1500
 *
 *   --easy=N     films in Easy pool  (default 500 or all, whichever smaller)
 *   --medium=N   films in Medium pool (default 1500 or all)
 *   --dry-run    print what would happen; don't write
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { StagedMovie } from "./importTmdb.js";
import { DIFFICULTIES, type Difficulty } from "../src/lib/difficulty.js";

const STAGING_PATH = join(process.cwd(), "scripts", "staging", "tmdb.json");

type Args = { easy: number; medium: number; dryRun: boolean };

function parseArgs(): Args {
  const out: Args = { easy: 500, medium: 1500, dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--easy=")) out.easy = Number(arg.split("=")[1]);
    else if (arg.startsWith("--medium=")) out.medium = Number(arg.split("=")[1]);
  }
  return out;
}

function uuidFromTmdbId(id: number): string {
  const h = createHash("sha1").update(`spotle:tmdb:${id}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

function toMovieRow(m: StagedMovie) {
  return {
    id: uuidFromTmdbId(m.tmdb_id),
    tmdb_id: m.tmdb_id,
    title: m.title,
    title_alternates: m.title_alternates,
    year: m.year,
    director: m.director,
    cast_top3: m.cast_top3,
    music_directors: m.music_directors,
    banner: m.banner,
    banner_parent: m.banner_parent,
    genres: m.genres,
    box_office_cr: m.box_office_cr,
    imdb_score: m.imdb_score,
    poster_url: m.poster_url,
    trivia: m.trivia,
    where_to_watch_url: m.where_to_watch_url,
    hint_easy: m.hint_easy,
    hint_medium: m.hint_medium,
    hint_hard: m.hint_hard,
    data_quality: m.data_quality,
    people_images: m.people_images ?? {},
    banner_logo_path: m.banner_logo_path ?? null,
  };
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function chunked<T>(xs: T[], size: number, fn: (slice: T[]) => Promise<void>) {
  for (let i = 0; i < xs.length; i += size) {
    await fn(xs.slice(i, i + size));
  }
}

async function main() {
  const args = parseArgs();
  if (!existsSync(STAGING_PATH)) {
    throw new Error(`Staging file not found: ${STAGING_PATH}\nRun: npm run tmdb:import`);
  }
  const staged = JSON.parse(readFileSync(STAGING_PATH, "utf8")) as StagedMovie[];
  if (staged.length === 0) throw new Error("Staging file is empty.");

  // Rank by vote_count desc; ties broken by popularity.
  const ranked = staged
    .slice()
    .sort((a, b) => b.vote_count - a.vote_count || b.popularity - a.popularity);

  const easyCount = Math.min(args.easy, ranked.length);
  const mediumCount = Math.min(args.medium, ranked.length);
  const assignment: Record<Difficulty, StagedMovie[]> = {
    easy: ranked.slice(0, easyCount),
    medium: ranked.slice(0, mediumCount),
    hard: ranked.slice(),
  };

  console.log(`${ranked.length} staged films — Easy: ${assignment.easy.length}, Medium: ${assignment.medium.length}, Hard: ${assignment.hard.length}`);
  if (args.dryRun) {
    console.log("Dry run — no DB writes.");
    return;
  }

  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const rows = ranked.map(toMovieRow);
  console.log(`Upserting ${rows.length} movies in batches of 100…`);
  await chunked(rows, 100, async (slice) => {
    const { error } = await db.from("movies").upsert(slice, { onConflict: "id" });
    if (error) throw new Error(error.message);
    process.stdout.write(`  movies ${slice.length} ok\n`);
  });

  console.log("Upserting movie_pools…");
  for (const diff of DIFFICULTIES) {
    const poolRows = assignment[diff].map((m) => ({
      movie_id: uuidFromTmdbId(m.tmdb_id),
      difficulty: diff,
    }));
    await chunked(poolRows, 500, async (slice) => {
      const { error } = await db
        .from("movie_pools")
        .upsert(slice, { onConflict: "movie_id,difficulty" });
      if (error) throw new Error(`pool ${diff}: ${error.message}`);
    });
    console.log(`  ${diff}: ${poolRows.length} rows`);
  }

  console.log("\nLoad complete.");
  console.log("Next: npm run edges:compute   (rebuild director/music edges)");
}

main().catch((err) => {
  console.error("Load failed:", err);
  process.exit(1);
});
