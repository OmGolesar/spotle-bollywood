/**
 * Backfill `movies.banner_logo_path` by refetching TMDB /movie/{id}
 * and picking the first production_companies[].logo_path.
 *
 * Usage:
 *   npm run tmdb:backfill-banner-logos
 *   npm run tmdb:backfill-banner-logos -- --limit=50
 *   npm run tmdb:backfill-banner-logos -- --force
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

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

type Detail = {
  production_companies?: { name: string; logo_path: string | null }[];
};

async function fetchDetail(tmdbId: number, apiKey: string, attempt = 0): Promise<Detail> {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}`;
  try {
    const res = await fetch(url, { keepalive: false });
    if (!res.ok) {
      if (res.status === 429 && attempt < 5) {
        const wait = Number(res.headers.get("retry-after") ?? "2") * 1000;
        await sleep(wait);
        return fetchDetail(tmdbId, apiKey, attempt + 1);
      }
      throw new Error(`TMDB ${res.status}`);
    }
    return (await res.json()) as Detail;
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (
      attempt < 4 &&
      (code === "ECONNRESET" || code === "UND_ERR_SOCKET" || code === "ETIMEDOUT")
    ) {
      await sleep(500 * Math.pow(2, attempt));
      return fetchDetail(tmdbId, apiKey, attempt + 1);
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
    .select("id, tmdb_id, title, banner, banner_logo_path")
    .not("tmdb_id", "is", null)
    .order("year", { ascending: false });
  if (error) throw new Error(error.message);
  const all = data ?? [];
  const todo = all
    .filter((r) => args.force || r.banner_logo_path == null)
    .slice(0, Number.isFinite(args.limit) ? args.limit : all.length);

  console.log(
    `${all.length} films — ${todo.length} missing banner logos${args.force ? " (force)" : ""}`
  );

  let done = 0;
  let filled = 0;
  for (const row of todo) {
    const tmdbId = row.tmdb_id as number;
    try {
      const detail = await fetchDetail(tmdbId, apiKey);
      // Prefer a company matching the stored banner name; otherwise fall
      // back to the first with a logo. Some films list the US distributor
      // ahead of the Indian producer on TMDB.
      const stored = String(row.banner ?? "").toLowerCase();
      const matched = detail.production_companies?.find(
        (c) => c.name.toLowerCase() === stored && c.logo_path
      );
      const firstWithLogo = detail.production_companies?.find((c) => c.logo_path);
      const logo = matched?.logo_path ?? firstWithLogo?.logo_path ?? null;
      if (logo) {
        const upd = await db.from("movies").update({ banner_logo_path: logo }).eq("id", row.id);
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
