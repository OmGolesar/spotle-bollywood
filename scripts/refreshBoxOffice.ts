/**
 * Rebuild box office figures from Wikipedia film infoboxes.
 *
 * Why this exists: TMDB's `revenue` field was giving us wrong numbers for
 * Indian films (₹15 cr for Dhurandhar, zeros for pre-2000 films). The
 * Wikipedia film infobox is where Bollywood Hungama / Sacnilk / Box Office
 * India figures ultimately get cited, so it's the best legitimate single
 * source we can automate.
 *
 * For every movie with a tmdb_id this script:
 *   1. Resolves the English Wikipedia page title using the same candidate
 *      list enrichMovies.ts uses (plus the opensearch fallback).
 *   2. Fetches the full wikitext of that page via the action API.
 *   3. Finds the `box_office = ...` line inside the Infobox film and parses
 *      it into (amount, currency), preferring "worldwide" over "gross"
 *      over "India" when multiple figures are present.
 *   4. Writes box_office_amount, box_office_currency ('INR_CR' | 'USD_M' |
 *      'USD_B'), box_office_source = 'wikipedia' and keeps the legacy
 *      box_office_cr column in sync with a crore-equivalent for the game's
 *      tile-comparison math.
 *
 * Usage:
 *   npm run tmdb:refresh-boxoffice               # fill rows missing data
 *   npm run tmdb:refresh-boxoffice -- --force    # overwrite everything
 *   npm run tmdb:refresh-boxoffice -- --limit=50
 *   npm run tmdb:refresh-boxoffice -- --tmdb-id=416569   # single film
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient } from "@supabase/supabase-js";

const UA = "spotle-bollywood-boxoffice/1.0 (https://spotle-bollywood.vercel.app)";
const RATE_LIMIT_MS = 400;

// Rough INR/USD anchors — only used to populate the legacy comparison
// column, never shown to players.
const USD_PER_CRORE_INR = 1 / 83 / 1e-7; // ≈ 1.2M USD per crore INR; inverse below
const CRORE_PER_USD = 1 / 83 / 1e7; // 1 USD ≈ 0.0000012 crore
const CRORE_PER_USD_MILLION = CRORE_PER_USD * 1_000_000; // ≈ 8.3 cr
const CRORE_PER_USD_BILLION = CRORE_PER_USD * 1_000_000_000; // ≈ 8333 cr

type Args = { limit: number; force: boolean; tmdbId: number | null };
type Currency = "INR_CR" | "USD_M" | "USD_B";
type Parsed = { amount: number; currency: Currency; label?: string };

function parseArgs(): Args {
  const out: Args = { limit: Infinity, force: false, tmdbId: null };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") out.force = true;
    else if (arg.startsWith("--limit=")) out.limit = Number(arg.split("=")[1]);
    else if (arg.startsWith("--tmdb-id=")) out.tmdbId = Number(arg.split("=")[1]);
  }
  return out;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url: string, ms = 15_000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA } });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Wikipedia title resolution ------------------------------------------------

async function pageExists(candidate: string): Promise<string | null> {
  const slug = encodeURIComponent(candidate.replace(/ /g, "_"));
  const res = await fetchWithTimeout(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`
  );
  if (!res || !res.ok) return null;
  const body = (await res.json().catch(() => null)) as
    | { type?: string; title?: string }
    | null;
  if (!body || body.type === "disambiguation" || !body.title) return null;
  return body.title;
}

async function resolveWikiTitle(title: string, year: number): Promise<string | null> {
  const candidates = [
    `${title} (${year} film)`,
    `${title} (${year} Hindi film)`,
    `${title} (${year} Indian film)`,
    `${title} (film)`,
    `${title} (Hindi film)`,
    `${title} (Indian film)`,
    title,
  ];
  for (const c of candidates) {
    const hit = await pageExists(c);
    if (hit) return hit;
  }
  // opensearch fallback
  const queries = [`${title} ${year} Hindi film`, `${title} ${year} film`, title];
  for (const q of queries) {
    const sr = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
        q
      )}&limit=5&namespace=0&format=json`
    );
    if (!sr || !sr.ok) continue;
    const data = (await sr.json().catch(() => null)) as
      | [string, string[], string[], string[]]
      | null;
    if (!data || !Array.isArray(data[1])) continue;
    const titles = data[1];
    const preferred =
      titles.find((t) => /\(.*film\)/i.test(t) && t.toLowerCase().includes(title.toLowerCase().slice(0, 6))) ||
      titles.find((t) => /\(.*film\)/i.test(t)) ||
      titles[0];
    if (preferred) {
      const hit = await pageExists(preferred);
      if (hit) return hit;
    }
  }
  return null;
}

// Wikitext fetch + infobox box_office line extract --------------------------

async function fetchWikitext(pageTitle: string): Promise<string | null> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}` +
    `&prop=wikitext&format=json&redirects=1`;
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return null;
  const body = (await res.json().catch(() => null)) as
    | { parse?: { wikitext?: { "*": string } } }
    | null;
  return body?.parse?.wikitext?.["*"] ?? null;
}

export function extractBoxOfficeLine(wikitext: string): string | null {
  // Infobox film uses `box_office` on most pages but `gross` on others
  // (older or non-standard templates), and some use `worldwide_gross`.
  // Try each in priority order.
  for (const field of ["box_office", "worldwide_gross", "gross"]) {
    const re = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n]+(?:\\n(?!\\s*\\|)[^\\n]+)*)`, "i");
    const m = wikitext.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

// Box-office value parser ---------------------------------------------------

function stripFluff(raw: string): string {
  return raw
    // strip ref tags and HTML comments
    .replace(/<ref[^>]*?\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // strip bold/italic markup and <br/>
    .replace(/'''?/g, "")
    .replace(/<br\s*\/?>/gi, " / ")
    // strip wikilinks: [[foo|bar]] -> bar
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
    // normalise whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand common wiki templates:
 *   {{INRConvert|2024|c}}           -> "2024 crore"
 *   {{INRConvert|200|lakh}}         -> "200 lakh"
 *   {{INRConvert|500}}              -> "500" (crore implied)
 *   {{currency|2.8 billion|usd}}    -> "USD 2.8 billion"
 *   {{USD|295 million}}             -> "USD 295 million"
 */
function expandTemplates(s: string): string {
  return s
    .replace(/\{\{\s*INRConvert\s*\|\s*([0-9.,]+)\s*\|\s*(c|crore|cr|lakh|k)?\s*\}\}/gi, (_m, n, unit) => {
      const u = (unit || "crore").toLowerCase();
      const unitWord = u === "c" || u === "cr" || u === "crore" ? "crore" : u === "lakh" ? "lakh" : u;
      return `INR ${n} ${unitWord}`;
    })
    .replace(/\{\{\s*INR\s*\|\s*([^|}]+)\s*\}\}/gi, (_m, v) => `INR ${v}`)
    .replace(/\{\{\s*currency\s*\|\s*([^|}]+)\s*\|\s*(usd|us\$|dollar[s]?)\s*\}\}/gi, (_m, v) => `USD ${v}`)
    .replace(/\{\{\s*(?:US\$|USD)\s*\|\s*([^|}]+)\s*\}\}/gi, (_m, v) => `USD ${v}`)
    .replace(/\{\{[^{}]*\}\}/g, " "); // drop unknown templates
}

/**
 * Score a candidate figure based on scope keywords in the surrounding
 * text. Worldwide > gross > lifetime > India-only > unknown.
 */
function scopeScore(context: string): number {
  const c = context.toLowerCase();
  if (/worldwide|global/.test(c)) return 100;
  if (/gross/.test(c)) return 80;
  if (/lifetime/.test(c)) return 60;
  if (/india/.test(c)) return 20;
  return 50;
}

const INR_RE = /(?:₹|rs\.?|rupee[s]?|INR)\s*([\d.,]+)(?:\s*(crore|cr\.?|lakh|billion|million))?/gi;
const USD_RE = /(?:\$|US\$|USD)\s*([\d.,]+)(?:\s*(billion|B|million|M|thousand|K))?/gi;

function toNumber(s: string): number {
  return Number(s.replace(/,/g, ""));
}

export function parseBoxOfficeValue(raw: string): Parsed | null {
  const prepped = expandTemplates(stripFluff(raw));
  // split on separators so each candidate has its own scope context
  const parts = prepped.split(/\s*(?:\/|•|•|\bor\b|\(|\)|,)\s*/i).filter(Boolean);
  const candidates: Array<Parsed & { score: number }> = [];

  for (const part of parts) {
    const context = part;

    for (const m of part.matchAll(INR_RE)) {
      const n = toNumber(m[1]);
      if (!Number.isFinite(n) || n <= 0) continue;
      const unit = (m[2] || "crore").toLowerCase();
      let amount = n;
      let currency: Currency = "INR_CR";
      if (unit.startsWith("cr") || unit === "crore") {
        currency = "INR_CR";
        amount = n;
      } else if (unit === "lakh") {
        currency = "INR_CR";
        amount = n / 100; // 100 lakh = 1 crore
      } else if (unit === "billion") {
        // "₹1 billion" ≈ 100 crore
        currency = "INR_CR";
        amount = n * 100;
      } else if (unit === "million") {
        currency = "INR_CR";
        amount = n / 10; // 10 million = 1 crore
      }
      candidates.push({ amount, currency, label: context, score: scopeScore(context) });
    }

    for (const m of part.matchAll(USD_RE)) {
      const n = toNumber(m[1]);
      if (!Number.isFinite(n) || n <= 0) continue;
      const unit = (m[2] || "").toLowerCase();
      if (unit === "billion" || unit === "b") {
        candidates.push({ amount: n, currency: "USD_B", label: context, score: scopeScore(context) });
      } else if (unit === "million" || unit === "m") {
        candidates.push({ amount: n, currency: "USD_M", label: context, score: scopeScore(context) });
      } else if (unit === "thousand" || unit === "k") {
        candidates.push({ amount: n / 1000, currency: "USD_M", label: context, score: scopeScore(context) });
      } else if (n >= 1_000_000_000) {
        candidates.push({ amount: n / 1_000_000_000, currency: "USD_B", label: context, score: scopeScore(context) });
      } else if (n >= 1_000_000) {
        candidates.push({ amount: n / 1_000_000, currency: "USD_M", label: context, score: scopeScore(context) });
      }
      // bare $ values under a million are not useful (likely budget or typo)
    }
  }

  if (candidates.length === 0) return null;
  // pick the highest-scope candidate; tie-break on largest amount in crore-equivalent
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return toCroreEquivalent(b) - toCroreEquivalent(a);
  });
  const best = candidates[0];
  return { amount: round(best.amount), currency: best.currency, label: best.label };
}

export function toCroreEquivalent(p: Parsed): number {
  switch (p.currency) {
    case "INR_CR":
      return p.amount;
    case "USD_M":
      return p.amount * CRORE_PER_USD_MILLION;
    case "USD_B":
      return p.amount * CRORE_PER_USD_BILLION;
  }
}

function round(n: number): number {
  // one decimal when under 10, otherwise integer
  if (n < 10) return Math.round(n * 10) / 10;
  return Math.round(n);
}

// Main loop ----------------------------------------------------------------

async function main() {
  const args = parseArgs();
  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  let query = db
    .from("movies")
    .select(
      "id, tmdb_id, title, year, box_office_amount, box_office_currency, box_office_source"
    )
    .not("tmdb_id", "is", null)
    .order("year", { ascending: false });
  if (args.tmdbId != null) query = query.eq("tmdb_id", args.tmdbId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const all = data ?? [];
  const todo = all
    .filter((r) => args.force || r.box_office_source !== "wikipedia" || r.box_office_amount == null)
    .slice(0, Number.isFinite(args.limit) ? args.limit : all.length);

  console.log(`${all.length} films — refreshing ${todo.length}`);

  let done = 0;
  let filled = 0;
  let misses = 0;
  for (const row of todo) {
    try {
      const wikiTitle = await resolveWikiTitle(row.title as string, row.year as number);
      let parsed: Parsed | null = null;
      if (wikiTitle) {
        const wt = await fetchWikitext(wikiTitle);
        if (wt) {
          const line = extractBoxOfficeLine(wt);
          if (line) parsed = parseBoxOfficeValue(line);
        }
      }

      if (parsed) {
        const cr = Math.round(toCroreEquivalent(parsed) * 10) / 10;
        const upd = await db
          .from("movies")
          .update({
            box_office_amount: parsed.amount,
            box_office_currency: parsed.currency,
            box_office_source: "wikipedia",
            box_office_cr: cr,
          })
          .eq("id", row.id);
        if (upd.error) throw new Error(upd.error.message);
        filled++;
      } else {
        // Clear the stale TMDB-derived figure so the UI shows '—' instead
        // of a wrong number. Keep the row for future manual override.
        const upd = await db
          .from("movies")
          .update({
            box_office_amount: null,
            box_office_currency: null,
            box_office_source: null,
            box_office_cr: null,
          })
          .eq("id", row.id);
        if (upd.error) throw new Error(upd.error.message);
        misses++;
      }
      done++;
      if (done % 20 === 0 || done === todo.length) {
        process.stdout.write(
          `  ${done}/${todo.length} processed  (filled ${filled}, misses ${misses}, last: ${row.title})\n`
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  skip ${row.title}: ${msg}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone. Processed ${done}, filled ${filled}, misses ${misses}.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
