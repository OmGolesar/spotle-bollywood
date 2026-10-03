/**
 * Content pipeline — backfill taglines from TMDB.
 *
 * For every film with a tmdb_id, hit TMDB /movie/{id} and pull the
 * tagline into our movies.tagline column. Idempotent and resumable:
 * films that already have a non-empty tagline are skipped unless
 * --fresh is passed. Films without a TMDB tagline are not retried
 * on subsequent runs (the tagline column stays empty) — curators can
 * fill those in via /admin/films/[id].
 *
 * Usage:
 *   npm run tmdb:taglines           # fill empty taglines
 *   npm run tmdb:taglines -- --fresh  # overwrite existing taglines
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

type Args = { fresh: boolean };

function parseArgs(): Args {
  return { fresh: process.argv.includes("--fresh") };
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function tmdbTagline(id: number, apiKey: string, attempt = 0): Promise<string | null> {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`;
  try {
    const res = await fetch(url, { keepalive: false });
    if (res.status === 429 && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      return tmdbTagline(id, apiKey, attempt + 1);
    }
    if (!res.ok) return null;
    const body = (await res.json()) as { tagline?: string };
    return body.tagline?.trim() ?? "";
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (attempt < 3 && (code === "ECONNRESET" || code === "UND_ERR_SOCKET")) {
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      return tmdbTagline(id, apiKey, attempt + 1);
    }
    return null;
  }
}

async function main() {
  const args = parseArgs();
  const apiKey = env("TMDB_API_KEY");
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  let query = db
    .from("movies")
    .select("id, title, tmdb_id, tagline")
    .not("tmdb_id", "is", null)
    .order("title", { ascending: true });

  if (!args.fresh) query = query.eq("tagline", "");

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { id: string; title: string; tmdb_id: number; tagline: string }[];
  console.log(`Checking ${rows.length} films…\n`);

  let filled = 0;
  let empty = 0;
  for (const r of rows) {
    process.stdout.write(`  ${r.title}… `);
    const tagline = await tmdbTagline(r.tmdb_id, apiKey);
    if (!tagline) {
      console.log("no tagline");
      empty++;
    } else {
      const { error: upErr } = await db.from("movies").update({ tagline }).eq("id", r.id);
      if (upErr) {
        console.log(`error: ${upErr.message}`);
      } else {
        console.log(`"${tagline.slice(0, 60)}${tagline.length > 60 ? "…" : ""}"`);
        filled++;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nDone. filled=${filled} empty=${empty}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
