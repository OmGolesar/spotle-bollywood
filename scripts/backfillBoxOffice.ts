/**
 * Backfill `movies.box_office_cr` for films that have a tmdb_id but no
 * figure yet, by fetching TMDB's `revenue` field (worldwide gross USD)
 * and converting it with boxOfficeCrFromTmdbRevenue().
 *
 * Usage:
 *   npm run tmdb:backfill-boxoffice
 *   npm run tmdb:backfill-boxoffice -- --limit=100
 *   npm run tmdb:backfill-boxoffice -- --force   # also overwrite existing non-null values
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";
import { boxOfficeCrFromTmdbRevenue } from "./importTmdb.js";

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tmdbRevenue(
  tmdbId: number,
  apiKey: string,
  attempt = 0
): Promise<number | null> {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}`;
  try {
    const res = await fetch(url, { keepalive: false });
    if (!res.ok) {
      if (res.status === 429 && attempt < 5) {
        const wait = Number(res.headers.get("retry-after") ?? "2") * 1000;
        await sleep(wait);
        return tmdbRevenue(tmdbId, apiKey, attempt + 1);
      }
      throw new Error(`TMDB ${res.status} for /movie/${tmdbId}`);
    }
    const body = (await res.json()) as { revenue?: number | null };
    return body.revenue ?? null;
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (
      attempt < 4 &&
      (code === "ECONNRESET" || code === "UND_ERR_SOCKET" || code === "ETIMEDOUT")
    ) {
      await sleep(500 * Math.pow(2, attempt));
      return tmdbRevenue(tmdbId, apiKey, attempt + 1);
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

  const { data, error } = await db
    .from("movies")
    .select("id, tmdb_id, title, box_office_cr")
    .not("tmdb_id", "is", null)
    .order("year", { ascending: false });
  if (error) throw new Error(error.message);
  const all = data ?? [];
  const todo = all
    .filter((r) => args.force || r.box_office_cr == null)
    .slice(0, Number.isFinite(args.limit) ? args.limit : all.length);

  console.log(
    `${all.length} films with tmdb_id — ${todo.length} missing box office${args.force ? " (force)" : ""}`
  );

  let done = 0;
  let filled = 0;
  for (const row of todo) {
    const tmdbId = row.tmdb_id as number;
    try {
      const revenue = await tmdbRevenue(tmdbId, apiKey);
      const cr = boxOfficeCrFromTmdbRevenue(revenue);
      if (cr != null) {
        const upd = await db.from("movies").update({ box_office_cr: cr }).eq("id", row.id);
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
