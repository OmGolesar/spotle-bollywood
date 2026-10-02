/**
 * Apply SQL migrations in supabase/migrations/ in filename order.
 *
 * Idempotent — our migrations use IF NOT EXISTS / CREATE OR REPLACE
 * everywhere, so re-running is safe.
 *
 * Usage:
 *   npm run migrate     # requires SUPABASE_DB_URL in .env.local
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set in .env.local");

  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`Connected. Applying ${files.length} migration(s)…\n`);

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`  ${file} … `);
    try {
      await client.query(sql);
      console.log("ok");
    } catch (err) {
      console.log("FAILED");
      console.error(err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\nAll migrations applied.");
}

main().catch((err) => {
  console.error("Migrate failed:", err);
  process.exit(1);
});
