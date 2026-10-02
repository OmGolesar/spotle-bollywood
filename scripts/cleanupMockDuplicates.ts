/**
 * One-off cleanup: remove the Chunk-5 mock-seeded films that are now
 * duplicated by the TMDB import, and re-point any daily_puzzles that
 * still reference the mock rows to the equivalent TMDB rows.
 *
 * A film is treated as a mock duplicate iff a different movies row
 * exists with the same (lower(title), year) AND a non-null tmdb_id.
 *
 * Idempotent — if there are no mock duplicates left, it's a no-op.
 *
 * Usage:
 *   npm run cleanup:mock           # dry run
 *   npm run cleanup:mock -- --apply
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

type Row = { id: string; title: string; year: number; tmdb_id: number | null };

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  console.log(`Mode: ${apply ? "APPLY" : "dry run"} (pass --apply to execute)\n`);

  const { data: all, error } = await db
    .from("movies")
    .select("id, title, year, tmdb_id");
  if (error) throw new Error(error.message);
  const rows = (all ?? []) as Row[];
  console.log(`Scanning ${rows.length} films…`);

  const byKey = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.title.toLowerCase()}|${r.year}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(r);
  }

  const toReplace = new Map<string, string>(); // mock id -> tmdb id

  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const tmdb = group.find((r) => r.tmdb_id != null);
    if (!tmdb) continue;
    for (const r of group) {
      if (r.id !== tmdb.id && r.tmdb_id == null) {
        toReplace.set(r.id, tmdb.id);
      }
    }
  }

  if (toReplace.size === 0) {
    console.log("No mock duplicates to clean up.");
    return;
  }

  console.log(`Found ${toReplace.size} mock duplicates:`);
  for (const [mockId, tmdbId] of toReplace) {
    const title = rows.find((r) => r.id === mockId)?.title;
    console.log(`  "${title}":  ${mockId}  →  ${tmdbId}`);
  }

  if (!apply) {
    console.log("\nDry run — nothing changed. Re-run with --apply.");
    return;
  }

  console.log("\nRepointing daily_puzzles…");
  for (const [mockId, tmdbId] of toReplace) {
    const upd = await db
      .from("daily_puzzles")
      .update({ movie_id: tmdbId })
      .eq("movie_id", mockId);
    if (upd.error) throw new Error(`repoint ${mockId}: ${upd.error.message}`);
  }

  console.log("Deleting mock rows (cascade removes any dependent plays)…");
  const ids = Array.from(toReplace.keys());
  const del = await db.from("movies").delete().in("id", ids);
  if (del.error) throw new Error(`delete movies: ${del.error.message}`);

  console.log(`\nRemoved ${ids.length} mock duplicates.`);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
