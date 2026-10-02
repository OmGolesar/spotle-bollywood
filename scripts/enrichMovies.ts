/**
 * Content pipeline step 4 — Wikipedia + Claude enrichment.
 *
 * For each film that is still tmdb_only / partial, fetch its Wikipedia
 * summary and send the Wikipedia text + the TMDB metadata we already
 * have to Claude Haiku 4.5. Claude returns:
 *   - trivia:         2-3 sentence interesting fact (production, cultural,
 *                     legacy angle — not plot)
 *   - box_office_cr:  lifetime nett in ₹ crores, or null
 *   - banner_parent:  shared parent / family label, or null
 *   - hint_easy:      direct hint (names an obvious fact)
 *   - hint_medium:    partial hint
 *   - hint_hard:      cryptic hint (connection or obscure fact)
 *
 * Updates the movies row and bumps data_quality to 'verified' when all
 * four text fields come back non-empty.
 *
 * Resumable: a film is skipped when it already has trivia + 3 hints set.
 * Rate-limited to stay under Wikipedia + Anthropic request ceilings.
 *
 * Usage:
 *   npm run enrich:films -- --limit=10          # try 10 films
 *   npm run enrich:films -- --limit=50 --fresh  # also re-enrich already-filled films
 *   npm run enrich:films -- --dry-run           # print what would change, no DB writes
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

type Args = { limit: number; fresh: boolean; dryRun: boolean };

function parseArgs(): Args {
  const out: Args = { limit: 25, fresh: false, dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--fresh") out.fresh = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--limit=")) out.limit = Number(arg.split("=")[1]);
  }
  return out;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — populate .env.local`);
  return v;
}

type MovieRow = {
  id: string;
  tmdb_id: number | null;
  title: string;
  year: number;
  director: string[];
  cast_top3: string[];
  music_directors: string[];
  banner: string;
  banner_parent: string | null;
  genres: string[];
  box_office_cr: number | null;
  imdb_score: number | null;
  trivia: string;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
  where_to_watch_url: string | null;
  data_quality: "verified" | "tmdb_only" | "partial";
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ────────────────────────────────────────────────────────────────────────────
// Wikipedia

type WikiSummary = {
  title: string;
  extract: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
};

const UA = "spotle-bollywood/0.1 (dev enrichment; contact: om@example.com)";

async function fetchWithTimeout(url: string, ms = 10_000): Promise<Response | null> {
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

async function tryWikiTitle(candidate: string): Promise<WikiSummary | null> {
  const slug = encodeURIComponent(candidate.replace(/ /g, "_"));
  const res = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  if (!res || !res.ok) return null;
  const body = (await res.json().catch(() => null)) as (WikiSummary & { type?: string }) | null;
  if (!body) return null;
  if (body.type === "disambiguation") return null;
  if (!body.extract || body.extract.length < 40) return null;
  return body;
}

async function wikipediaSummary(title: string, year: number): Promise<WikiSummary | null> {
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
    const hit = await tryWikiTitle(c);
    if (hit) return hit;
  }

  // Fallback: search API with multiple candidates, prefer film-ish titles.
  const queries = [
    `${title} ${year} Hindi film`,
    `${title} ${year} film`,
    `${title} Hindi film`,
    `${title} film`,
    title,
  ];
  for (const q of queries) {
    const sr = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
        q
      )}&limit=5&namespace=0&format=json`
    );
    if (!sr || !sr.ok) continue;
    const data = (await sr.json().catch(() => null)) as [string, string[], string[], string[]] | null;
    if (!data || !Array.isArray(data[1])) continue;
    const titles = data[1];
    const preferred =
      titles.find((t) => /\(.*film\)/i.test(t) && t.toLowerCase().includes(title.toLowerCase().slice(0, 6))) ||
      titles.find((t) => /\(.*film\)/i.test(t)) ||
      titles[0];
    if (!preferred) continue;
    const hit = await tryWikiTitle(preferred);
    if (hit) return hit;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Claude

const anthropic = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });

type Enriched = {
  trivia: string;
  box_office_cr: number | null;
  banner_parent: string | null;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
};

const SYSTEM_PROMPT = `You enrich metadata for a daily Bollywood guess-the-movie game called Spotle Bollywood. For each film you receive its known metadata (title, year, director, cast, music, banner, genres) and a Wikipedia summary. Your job:

1. TRIVIA — write 2-3 sentences of an interesting fact about the film. Favor production, cultural, or legacy angles (box-office firsts, awards, longest-running theatrical run, iconic song, unusual making-of story). AVOID plot summary. Avoid starting with the title. Must be unique to this film — don't say generic things like "a classic Hindi film".

2. BOX OFFICE — if the Wikipedia summary explicitly mentions a lifetime nett or worldwide gross in ₹ crore, return the number (just the number, as a float). If unclear or in a different unit, return null. Prefer "nett" over "gross" when both are listed. If only USD is given, don't try to convert — return null.

3. BANNER PARENT — if the production company has a well-known parent/family (e.g. Yash Raj Films → "YRF", Dharma Productions → null since it's standalone, Red Chillies Entertainment → null, Reliance Entertainment → "Reliance"), return the parent label. Otherwise null.

4. HINTS — three tiered hints. These are the game's clue system; a player opens each one if stuck.
   - EASY: direct. Names the most-recognizable element (lead actor, director for a famous director, or genre + decade). Example: "Lead actor: Shah Rukh Khan."
   - MEDIUM: partial. A specific but non-obvious fact. Example: "The director's debut was with Dil Chahta Hai."
   - HARD: cryptic. A connection or deep-cut fact a cinephile would appreciate. Example: "The music director also scored a film by Satyajit Ray."

Hint rules:
- Never name the film title itself.
- Easy ≤ 80 chars. Medium ≤ 110 chars. Hard ≤ 140 chars.
- Each hint must be distinct — Hard shouldn't just restate Medium with different words.
- When no genuinely cryptic angle exists in the Wikipedia text, fall back to a lesser-known crew/cast credit for Hard rather than inventing something.

Return a single JSON object with exactly these keys:
{"trivia": string, "box_office_cr": number | null, "banner_parent": string | null, "hint_easy": string, "hint_medium": string, "hint_hard": string}

Return ONLY the JSON object, no prose before or after, no code fences.`;

function buildUserPrompt(m: MovieRow, wiki: WikiSummary): string {
  return `FILM
Title: ${m.title}
Year: ${m.year}
Director(s): ${m.director.join(", ") || "unknown"}
Lead cast: ${m.cast_top3.join(", ") || "unknown"}
Music: ${m.music_directors.join(", ") || "unknown"}
Banner: ${m.banner}
Genres: ${m.genres.join(", ") || "unknown"}

WIKIPEDIA (${wiki.title})
${wiki.extract}`;
}

async function enrichOne(m: MovieRow, wiki: WikiSummary): Promise<Enriched | null> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(m, wiki) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip accidental code fences.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Enriched;
    return parsed;
  } catch (err) {
    console.error(`  parse failed for ${m.title}:`, (err as Error).message);
    console.error(`  raw: ${cleaned.slice(0, 200)}`);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DB

async function loadCandidates(db: SupabaseClient, args: Args): Promise<MovieRow[]> {
  let query = db
    .from("movies")
    .select(
      "id, tmdb_id, title, year, director, cast_top3, music_directors, banner, banner_parent, genres, box_office_cr, imdb_score, trivia, hint_easy, hint_medium, hint_hard, where_to_watch_url, data_quality"
    )
    .order("title", { ascending: true })
    .limit(args.limit);

  if (!args.fresh) {
    query = query.or("trivia.eq.,hint_easy.eq.,hint_medium.eq.,hint_hard.eq.");
  }

  const { data, error } = await query;
  if (error) throw new Error(`loadCandidates: ${error.message}`);
  return (data ?? []) as MovieRow[];
}

async function updateMovie(
  db: SupabaseClient,
  id: string,
  enriched: Enriched,
  current: MovieRow
) {
  const complete =
    enriched.trivia.length > 0 &&
    enriched.hint_easy.length > 0 &&
    enriched.hint_medium.length > 0 &&
    enriched.hint_hard.length > 0;

  const update: Partial<MovieRow> = {
    trivia: enriched.trivia || current.trivia,
    hint_easy: enriched.hint_easy || current.hint_easy,
    hint_medium: enriched.hint_medium || current.hint_medium,
    hint_hard: enriched.hint_hard || current.hint_hard,
    box_office_cr: enriched.box_office_cr ?? current.box_office_cr,
    banner_parent: enriched.banner_parent ?? current.banner_parent,
    data_quality: complete ? "verified" : "partial",
  };

  const { error } = await db.from("movies").update(update).eq("id", id);
  if (error) throw new Error(`update ${id}: ${error.message}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Main

async function main() {
  const args = parseArgs();
  console.log(
    `Mode: ${args.dryRun ? "DRY RUN" : "APPLY"}  limit=${args.limit}  fresh=${args.fresh}\n`
  );

  const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const candidates = await loadCandidates(db, args);
  console.log(`Found ${candidates.length} candidate films.\n`);

  let okCount = 0;
  let skipCount = 0;
  let noWikiCount = 0;

  for (const m of candidates) {
    process.stdout.write(`  ${m.title} (${m.year})… `);
    try {
      const wiki = await wikipediaSummary(m.title, m.year);
      if (!wiki) {
        console.log("no Wikipedia match");
        noWikiCount++;
        await sleep(200);
        continue;
      }

      const enriched = await enrichOne(m, wiki);
      if (!enriched) {
        console.log("Claude failed");
        skipCount++;
        await sleep(400);
        continue;
      }

      if (args.dryRun) {
        console.log("ok (dry)");
        console.log(`    trivia: ${enriched.trivia}`);
        console.log(`    easy:   ${enriched.hint_easy}`);
        console.log(`    med:    ${enriched.hint_medium}`);
        console.log(`    hard:   ${enriched.hint_hard}`);
        if (enriched.box_office_cr != null) console.log(`    box:    ₹${enriched.box_office_cr} cr`);
        if (enriched.banner_parent) console.log(`    banner: ${enriched.banner_parent}`);
      } else {
        await updateMovie(db, m.id, enriched, m);
        console.log("ok");
      }
      okCount++;
      await sleep(400);
    } catch (err) {
      console.log(`error: ${(err as Error).message.slice(0, 80)}`);
      skipCount++;
      await sleep(500);
    }
  }

  console.log(
    `\nDone. enriched=${okCount}  no-wiki=${noWikiCount}  claude-failed=${skipCount}`
  );
}

main().catch((err) => {
  console.error("Enrich failed:", err);
  process.exit(1);
});
