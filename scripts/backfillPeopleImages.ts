/**
 * Backfill `movies.people_images` for every film that has a tmdb_id but no
 * portrait map yet. Idempotent — rows with a non-empty people_images are
 * skipped unless --force is passed.
 *
 * Usage:
 *   npm run tmdb:backfill-people
 *   npm run tmdb:backfill-people -- --limit=100
 *   npm run tmdb:backfill-people -- --force
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";
import { buildPeopleImages } from "./importTmdb.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const RATE_LIMIT_MS = 300;

type Args = { limit: number; force: boolean };

function parseArgs(): Args {
  const out: Args = { limit: Infinity, force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") out.force = true;
    else if (arg.startsWith("--limit=")) out.limit = Number(arg.split("=")[1]);
  }
  return out;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdbCredits(
  tmdbId: number,
  apiKey: string,
  attempt = 0
): Promise<{
  cast: { id: number; name: string; order: number; profile_path: string | null }[];
  crew: { id: number; name: string; department: string; job: string; profile_path: string | null }[];
}> {
  const url = `${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${apiKey}`;
  try {
    const res = await fetch(url, { keepalive: false });
    if (!res.ok) {
      if (res.status === 429 && attempt < 5) {
        const wait = Number(res.headers.get("retry-after") ?? "2") * 1000;
        await sleep(wait);
        return tmdbCredits(tmdbId, apiKey, attempt + 1);
      }
      throw new Error(`TMDB ${res.status} for /movie/${tmdbId}/credits`);
    }
    return (await res.json()) as never;
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (
      attempt < 4 &&
      (code === "ECONNRESET" || code === "UND_ERR_SOCKET" || code === "ETIMEDOUT")
    ) {
      await sleep(500 * Math.pow(2, attempt));
      return tmdbCredits(tmdbId, apiKey, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const args = parseArgs();
  const apiKey = env("TMDB_API_KEY");
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const query = db
    .from("movies")
    .select("id, tmdb_id, title, year, director, cast_top3, people_images")
    .not("tmdb_id", "is", null)
    .order("year", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const all = data ?? [];
  const todo = all
    .filter((r) => args.force || Object.keys((r.people_images as Record<string, string>) ?? {}).length === 0)
    .slice(0, Number.isFinite(args.limit) ? args.limit : all.length);

  console.log(
    `${all.length} films with tmdb_id — ${todo.length} missing portraits${args.force ? " (force)" : ""}`
  );

  let done = 0;
  let filled = 0;
  for (const row of todo) {
    const tmdbId = row.tmdb_id as number;
    try {
      const credits = await tmdbCredits(tmdbId, apiKey);
      const peopleImages = buildPeopleImages(
        credits,
        (row.director as string[]) ?? [],
        (row.cast_top3 as string[]) ?? []
      );
      const found = Object.keys(peopleImages).length;
      if (found > 0) {
        const upd = await db
          .from("movies")
          .update({ people_images: peopleImages })
          .eq("id", row.id);
        if (upd.error) throw new Error(upd.error.message);
        filled++;
      }
      done++;
      if (done % 20 === 0 || done === todo.length) {
        process.stdout.write(
          `  ${done}/${todo.length} processed, ${filled} filled (last: ${row.title})\n`
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  skip ${row.title} (${tmdbId}): ${msg}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone. Processed ${done}, filled ${filled}.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
