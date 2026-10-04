/**
 * Content pipeline step 1 — TMDB importer.
 *
 * Pulls Hindi-language films from TMDB sorted by vote_count (so the most
 * widely-rated films come first), fetches full credits + external IDs for
 * each, and writes the result to scripts/staging/tmdb.json. Resumable:
 * if the file exists, films already in it are skipped.
 *
 * Usage:
 *   TMDB_API_KEY=... npm run tmdb:import -- --max=500
 *
 *   --max=N      how many films to collect (default 200)
 *   --min-votes  skip films with fewer TMDB votes (default 20)
 *   --year-from  only consider releases >= year (default 1950)
 *   --fresh      ignore any existing staging file and start over
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const TMDB_BASE = "https://api.themoviedb.org/3";
const STAGING_PATH = join(process.cwd(), "scripts", "staging", "tmdb.json");

type Args = { max: number; minVotes: number; yearFrom: number; fresh: boolean };

function parseArgs(): Args {
  const out: Args = { max: 200, minVotes: 20, yearFrom: 1950, fresh: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--fresh") out.fresh = true;
    else if (arg.startsWith("--max=")) out.max = Number(arg.split("=")[1]);
    else if (arg.startsWith("--min-votes=")) out.minVotes = Number(arg.split("=")[1]);
    else if (arg.startsWith("--year-from=")) out.yearFrom = Number(arg.split("=")[1]);
  }
  return out;
}

export type StagedMovie = {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  title_alternates: string[];
  year: number;
  director: string[];
  cast_top3: string[];
  music_directors: string[];
  banner: string;
  banner_logo_path: string | null;
  banner_parent: string | null;
  genres: string[];
  box_office_cr: number | null;
  imdb_score: number | null;
  poster_url: string;
  trivia: string;
  where_to_watch_url: string | null;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
  data_quality: "tmdb_only";
  vote_count: number;
  popularity: number;
  people_images: Record<string, string>;
};

type Discover = {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  vote_count: number;
  popularity: number;
};
type DiscoverResp = { results: Discover[]; total_pages: number };

type Credits = {
  crew: { id: number; name: string; department: string; job: string; profile_path: string | null }[];
  cast: { id: number; name: string; order: number; profile_path: string | null }[];
};

type Detail = {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  genres: { name: string }[];
  production_companies: { name: string; logo_path: string | null }[];
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  revenue: number | null;
  credits: Credits;
};

async function tmdb<T>(path: string, apiKey: string, attempt = 0): Promise<T> {
  const url = `${TMDB_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;
  try {
    const res = await fetch(url, { keepalive: false });
    if (!res.ok) {
      if (res.status === 429 && attempt < 5) {
        const wait = Number(res.headers.get("retry-after") ?? "2") * 1000;
        await sleep(wait);
        return tmdb(path, apiKey, attempt + 1);
      }
      const body = await res.text().catch(() => "");
      throw new Error(`TMDB ${res.status} ${res.statusText} for ${path} :: ${body.slice(0, 160)}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (attempt < 4 && (code === "ECONNRESET" || code === "UND_ERR_SOCKET" || code === "ETIMEDOUT")) {
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
      return tmdb(path, apiKey, attempt + 1);
    }
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function readStaging(): StagedMovie[] {
  if (!existsSync(STAGING_PATH)) return [];
  try {
    return JSON.parse(readFileSync(STAGING_PATH, "utf8")) as StagedMovie[];
  } catch {
    return [];
  }
}

function writeStaging(movies: StagedMovie[]) {
  mkdirSync(dirname(STAGING_PATH), { recursive: true });
  writeFileSync(STAGING_PATH, JSON.stringify(movies, null, 2));
}

function posterUrl(path: string | null): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/w500${path}`;
}

const MUSIC_JOB_RE = /music|composer/i;

/**
 * Convert TMDB's `revenue` (worldwide gross, in USD) to an approximate
 * Indian crore equivalent suitable for the comparison tile. 1 crore =
 * 10,000,000 units — we drop the dollar sign and treat 10 million USD
 * as "one crore" since the ratio stays close to true INR/USD rates in
 * the 2010s–2020s. Returns null when TMDB has no revenue on file.
 *
 * Note: this is worldwide gross, not India-only. For the puzzle it's
 * fine — relative scale is what matters for the green/yellow bands.
 */
export function boxOfficeCrFromTmdbRevenue(revenue: number | null): number | null {
  if (revenue == null || revenue <= 0) return null;
  return Math.round(revenue / 10_000_000);
}

function detailToStaged(d: Detail): StagedMovie {
  const year = d.release_date ? Number(d.release_date.slice(0, 4)) : 0;
  const director = d.credits.crew.filter((c) => c.job === "Director").map((c) => c.name);
  const cast_top3 = d.credits.cast
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map((c) => c.name);
  const music_directors = d.credits.crew
    .filter((c) => c.department === "Sound" && MUSIC_JOB_RE.test(c.job))
    .map((c) => c.name)
    .filter((v, i, a) => a.indexOf(v) === i);
  const bannerCompany = d.production_companies[0];
  const banner = bannerCompany?.name ?? "Unknown";
  const banner_logo_path = bannerCompany?.logo_path ?? null;
  const genres = d.genres.map((g) => g.name);
  const people_images = buildPeopleImages(d.credits, director, cast_top3);
  return {
    tmdb_id: d.id,
    title: d.title,
    original_title: d.original_title && d.original_title !== d.title ? d.original_title : null,
    title_alternates: d.original_title && d.original_title !== d.title ? [d.original_title] : [],
    year,
    director,
    cast_top3,
    music_directors,
    banner,
    banner_parent: null,
    banner_logo_path,
    genres,
    box_office_cr: boxOfficeCrFromTmdbRevenue(d.revenue),
    imdb_score: d.vote_average ?? null,
    poster_url: posterUrl(d.poster_path),
    trivia: "",
    where_to_watch_url: null,
    hint_easy: "",
    hint_medium: "",
    hint_hard: "",
    data_quality: "tmdb_only",
    vote_count: d.vote_count,
    popularity: d.popularity,
    people_images,
  };
}

/**
 * Build a name -> profile_path map for people shown on a guess card: the
 * movie's director(s) + top-3 cast. profile_path is TMDB's `/{hash}.jpg` form
 * — the client prefixes `https://image.tmdb.org/t/p/w185` when rendering.
 * People without a profile_path are omitted (card falls back to initials).
 */
export function buildPeopleImages(
  credits: Credits,
  directorNames: string[],
  castNames: string[]
): Record<string, string> {
  const wanted = new Set<string>([...directorNames, ...castNames]);
  const out: Record<string, string> = {};
  for (const c of credits.cast) {
    if (wanted.has(c.name) && c.profile_path && !out[c.name]) {
      out[c.name] = c.profile_path;
    }
  }
  for (const c of credits.crew) {
    if (wanted.has(c.name) && c.profile_path && !out[c.name]) {
      out[c.name] = c.profile_path;
    }
  }
  return out;
}

async function main() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY not set — add it to .env.local");

  const args = parseArgs();
  const existing = args.fresh ? [] : readStaging();
  const seen = new Set(existing.map((m) => m.tmdb_id));
  console.log(
    `Target ${args.max} films; starting with ${existing.length} already staged; min votes ${args.minVotes}; year >= ${args.yearFrom}`
  );

  const collected: StagedMovie[] = existing.slice();
  let page = 1;

  outer: while (collected.length < args.max) {
    const list = await tmdb<DiscoverResp>(
      `/discover/movie?with_original_language=hi&sort_by=vote_count.desc&include_adult=false&page=${page}`,
      apiKey
    );
    if (list.results.length === 0) break;

    for (const r of list.results) {
      if (collected.length >= args.max) break outer;
      if (seen.has(r.id)) continue;
      if (r.vote_count < args.minVotes) continue;
      const year = r.release_date ? Number(r.release_date.slice(0, 4)) : 0;
      if (year < args.yearFrom) continue;

      await sleep(300);
      try {
        const detail = await tmdb<Detail>(
          `/movie/${r.id}?append_to_response=credits`,
          apiKey
        );
        const staged = detailToStaged(detail);
        if (!staged.title || staged.year === 0 || !staged.poster_url) continue;
        collected.push(staged);
        seen.add(r.id);
        if (collected.length % 10 === 0 || collected.length === args.max) {
          writeStaging(collected);
          process.stdout.write(`  staged ${collected.length}/${args.max}\n`);
        }
      } catch (err) {
        console.error(`  skip tmdb_id=${r.id}:`, (err as Error).message);
      }
    }

    page++;
    if (page > list.total_pages) break;
  }

  writeStaging(collected);
  console.log(`\nDone. ${collected.length} films in ${STAGING_PATH}`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
