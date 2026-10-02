/**
 * Content pipeline step 3 — rebuild director + music director edges.
 *
 * For every film, generate undirected pairs of co-directors and
 * co-composers, then overwrite the edge tables.
 *
 * This is a full-rebuild — delete then insert — which is fine when total
 * edge rows is in the low thousands. If the catalog grows past ~10k films
 * we can switch to incremental sync.
 *
 * Usage:
 *   npm run edges:compute
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function fetchAllMovies(db: SupabaseClient): Promise<
  { director: string[]; music_directors: string[] }[]
> {
  const out: { director: string[]; music_directors: string[] }[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await db
      .from("movies")
      .select("director, music_directors")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { director: string[]; music_directors: string[] }[];
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function pairsFrom(names: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const a of names) {
    for (const b of names) {
      if (a !== b) pairs.push([a, b]);
    }
  }
  return pairs;
}

async function rebuild(
  db: SupabaseClient,
  table: string,
  cols: [string, string],
  rows: [string, string][]
) {
  // Dedup
  const unique = new Set<string>();
  for (const [a, b] of rows) unique.add(`${a}\x1f${b}`);
  const dedup: Record<string, string>[] = [];
  for (const key of unique) {
    const [a, b] = key.split("\x1f");
    dedup.push({ [cols[0]]: a, [cols[1]]: b });
  }

  console.log(`  ${table}: ${dedup.length} unique pairs`);

  const del = await db.from(table).delete().not(cols[0], "is", null);
  if (del.error) throw new Error(`${table} delete: ${del.error.message}`);

  if (dedup.length === 0) return;
  const BATCH = 500;
  for (let i = 0; i < dedup.length; i += BATCH) {
    const ins = await db.from(table).insert(dedup.slice(i, i + BATCH));
    if (ins.error) throw new Error(`${table} insert: ${ins.error.message}`);
  }
}

async function main() {
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  console.log("Fetching movies…");
  const movies = await fetchAllMovies(db);
  console.log(`  ${movies.length} films`);

  const dirPairs: [string, string][] = [];
  const musPairs: [string, string][] = [];
  for (const m of movies) {
    dirPairs.push(...pairsFrom(m.director ?? []));
    musPairs.push(...pairsFrom(m.music_directors ?? []));
  }

  console.log("Rebuilding edge tables…");
  await rebuild(db, "director_edges", ["director_a", "director_b"], dirPairs);
  await rebuild(db, "music_director_edges", ["md_a", "md_b"], musPairs);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Edge compute failed:", err);
  process.exit(1);
});
