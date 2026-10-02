# Development setup

## Prerequisites
- Node 20+ (Node 25 is what the repo was scaffolded on)
- npm 10+
- Docker (for Supabase local, when wiring the backend in Chunk 5)

## First-time setup
```bash
npm install
cp .env.example .env.local   # leave values blank for now (Chunks 1–4 don't need them)
npm run dev                  # http://localhost:3000
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:cov` | Vitest with coverage report |

## Supabase (wired up in Chunk 5)

Two options:

**Local (recommended for development)**
```bash
npx supabase init                # one-time
npx supabase start               # boots local Postgres + Studio in Docker
# apply migrations
npx supabase db reset            # runs supabase/migrations/*.sql
```
Then copy the `anon key`, `service_role key`, and local URL from the start
output into `.env.local`.

**Remote preview/production**
Create a Supabase project at https://supabase.com, then:
```bash
npx supabase link --project-ref <ref>
npx supabase db push             # applies supabase/migrations/*.sql
```
Add the same three env vars in Vercel (project → Settings → Environment Variables).

## Where things live

```
src/
  app/              # Next.js App Router pages
  components/       # React components
  lib/              # Pure game logic — tiles, dateIst, share, difficulty
supabase/
  migrations/       # SQL migrations applied in order
docs/
  superpowers/
    specs/          # v1 design spec
```

## Content pipeline

The game needs a catalog of real films. The pipeline is three steps.

### 1. Get a TMDB API key
Register at https://www.themoviedb.org/signup → **Settings → API** → request a
dev key. It's free and arrives in about a minute. Add it to `.env.local`:
```
TMDB_API_KEY=...
```

### 2. Import films from TMDB
```bash
npm run tmdb:import -- --max=500
```
Hits TMDB's `discover` endpoint for Hindi-language films sorted by vote count,
then fetches credits for each. Resumable — if the script is interrupted, re-run
and it picks up from the last film. Output lands in
`scripts/staging/tmdb.json` (gitignored). Flags:
- `--max=N` — stop after N films (default 200)
- `--min-votes=N` — skip films with fewer TMDB votes (default 20)
- `--year-from=YYYY` — only consider releases on/after this year (default 1950)
- `--fresh` — ignore any existing staging file and start over

### 3. Load into Supabase
```bash
npm run movies:load -- --easy=500 --medium=1500
```
Reads the staging file, upserts `movies`, and assigns films to the three
difficulty pools (cumulative: Hard = all, Medium = top-M, Easy = top-E by vote
count). Idempotent — re-running reconciles pool membership safely.

### 4. Rebuild edge tables
```bash
npm run edges:compute
```
Rebuilds `director_edges` and `music_director_edges` so the tile-compare
yellow states work for co-directors / co-composers. Run after any catalog
change. Will be scheduled as a nightly Vercel Cron job in production.

> Films come in with `data_quality='tmdb_only'` — missing `box_office_cr`,
> `trivia`, hint text, `where_to_watch_url`, and `banner_parent`. Curators
> fill these in via the admin UI (`/admin`) over time.

## Security invariants (from spec §4.2)

- The anon Supabase role **cannot** `SELECT movie_id FROM daily_puzzles`.
  Enforced by RLS in `0002_rls.sql` — no SELECT policy exists on the base
  table; anon reads the `daily_puzzles_public` view that omits the answer.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only** in `src/app/api/*` route
  handlers, never imported from a client component.
- All date logic lives in `src/lib/dateIst.ts`. The server is authoritative
  on "which puzzle is today"; the client never computes dates.
