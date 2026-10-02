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

## Security invariants (from spec §4.2)

- The anon Supabase role **cannot** `SELECT movie_id FROM daily_puzzles`.
  Enforced by RLS in `0002_rls.sql` — no SELECT policy exists on the base
  table; anon reads the `daily_puzzles_public` view that omits the answer.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only** in `src/app/api/*` route
  handlers, never imported from a client component.
- All date logic lives in `src/lib/dateIst.ts`. The server is authoritative
  on "which puzzle is today"; the client never computes dates.
