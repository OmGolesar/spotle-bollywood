# Spotle Bollywood - Complete Project Understanding

> **Last Updated:** October 31, 2026  
> **Version:** v1 Preview  
> **Live URL:** [spotle-bollywood.vercel.app](https://spotle-bollywood.vercel.app)  
> **Total Lines of Code:** ~7,578 lines

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design Philosophy](#architecture--design-philosophy)
4. [Database Schema](#database-schema)
5. [Core Game Logic](#core-game-logic)
6. [Application Routes](#application-routes)
7. [API Endpoints](#api-endpoints)
8. [Components Structure](#components-structure)
9. [Data Pipeline](#data-pipeline)
10. [Admin System](#admin-system)
11. [Security Model](#security-model)
12. [Recent Development History](#recent-development-history)
13. [Environment Configuration](#environment-configuration)
14. [Testing Strategy](#testing-strategy)
15. [Deployment & Infrastructure](#deployment--infrastructure)
16. [Areas for Improvement](#areas-for-improvement)

---

## Project Overview

**Spotle Bollywood** is a daily guess-the-movie game for Bollywood (Hindi cinema) fans, inspired by Wordle. Players get **10 guesses** to identify a mystery film using **8 color-coded tiles** that compare their guess against the target film across multiple dimensions.

### Key Features

- **Three difficulty modes**: Easy (~500 films), Medium (~1,500 films), Hard (3,000+ films)
- **8-dimensional comparison tiles**: Director, Cast, Year, Box Office, Music Director, Banner, Genre, IMDb Score
- **Progressive poster reveal**: Poster un-blurs with each guess
- **Hint system**: Two hints unlock at guesses 3 and 6
- **Streak tracking**: Daily streak system with difficulty-specific tracking
- **Archive mode**: Practice on past puzzles without affecting streaks
- **Admin/curator interface**: Schedule puzzles and enrich film metadata
- **Share functionality**: Share results via native share, WhatsApp, or clipboard

### Core Gameplay Loop

```
┌─────────────────────────────────────────────────────────┐
│  1. Player selects difficulty (Easy/Medium/Hard)        │
│  2. Daily puzzle loaded (mystery film hidden)           │
│  3. Autocomplete search for film guess                  │
│  4. Submit guess → 8 tiles colored:                     │
│     • Green = exact match                               │
│     • Yellow = close/partial match                      │
│     • Gray = no match                                   │
│  5. Poster blur reduces (40px → 0px over 10 guesses)    │
│  6. Hints unlock at guesses 3 and 6                     │
│  7. Win (correct guess) or Lose (10 incorrect guesses)  │
│  8. Result screen with stats, share button, streak      │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.3.8 | React framework (App Router) |
| **React** | 19.2.8 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling |
| **Turbopack** | Built-in | Fast dev bundler |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.117.2 | PostgreSQL + Auth + RLS |
| **PostgreSQL** | Latest | Database (via Supabase) |
| **Server Actions** | Next.js 16 | API routes |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **ESLint** | Linting |
| **tsx** | TypeScript script execution |
| **dotenv** | Environment management |

### External APIs
| Service | Purpose |
|---------|---------|
| **TMDB** | Film metadata import (cast, crew, posters) |
| **Wikipedia** | Box office data (manual extraction) |

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **Cron Jobs**: Vercel Cron (for nightly edge table rebuilds)

---

## Architecture & Design Philosophy

### Architectural Principles

1. **Server-authoritative dates**: All date logic lives in `src/lib/dateIst.ts`. Client never computes "today's puzzle"
2. **Row-level security (RLS)**: Anon role cannot read `daily_puzzles.movie_id` (enforced in PostgreSQL)
3. **Pure game logic**: Core tile comparison in `src/lib/tiles.ts` is framework-agnostic
4. **Cookie-based player ID**: Anonymous play via UUID in HTTP-only cookie
5. **Supabase for backend**: No custom API server - Next.js API routes + Supabase
6. **IST timezone**: All puzzles reset at midnight IST (Indian Standard Time)

### Directory Structure

```
spotle-bollywood/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page (mode selection)
│   │   ├── [difficulty]/       # Daily puzzle (/easy, /medium, /hard)
│   │   ├── archive/            # Past puzzle browser
│   │   ├── admin/              # Curator dashboard
│   │   └── api/                # API route handlers
│   ├── components/             # React components
│   │   ├── PuzzleScreen.tsx    # Main game UI
│   │   ├── TileGrid.tsx        # 8-tile comparison display
│   │   ├── GuessAutocomplete.tsx # Film search input
│   │   ├── ResultScreen.tsx    # Win/lose modal
│   │   ├── ArchiveGrid.tsx     # Past puzzles calendar
│   │   └── home/               # Landing page components
│   └── lib/                    # Pure logic (no React)
│       ├── types.ts            # TypeScript types
│       ├── tiles.ts            # Tile comparison algorithm
│       ├── dateIst.ts          # IST date handling
│       ├── difficulty.ts       # Difficulty metadata
│       ├── share.ts            # Share text generation
│       ├── streaks.ts          # Streak calculation
│       ├── hintCategories.ts   # Hint category definitions
│       ├── server/             # Server-only code
│       │   ├── puzzle.ts       # Puzzle resolution
│       │   ├── schedule.ts     # Admin schedule loading
│       │   ├── archive.ts      # Archive puzzle loading
│       │   ├── films.ts        # Film catalog queries
│       │   ├── edges.ts        # Co-director/composer edges
│       │   └── requireAdmin.ts # Admin auth guard
│       └── supabase/           # Supabase clients
│           ├── admin.ts        # Service role client
│           ├── serverAuth.ts   # Auth client (SSR)
│           ├── env.ts          # Env validation
│           └── types.ts        # Database types
├── supabase/
│   └── migrations/             # SQL schema migrations
│       ├── 0001_init.sql       # Core tables
│       ├── 0002_rls.sql        # Row-level security
│       ├── 0003_grants.sql     # Role permissions
│       └── ...                 # Additional migrations
├── scripts/                    # Data pipeline scripts
│   ├── importTmdb.ts           # Fetch films from TMDB API
│   ├── loadMovies.ts           # Upsert to Supabase
│   ├── computeEdges.ts         # Rebuild edge tables
│   ├── backfillTaglines.ts     # TMDB tagline enrichment
│   ├── backfillPeopleImages.ts # Actor/director images
│   ├── backfillBoxOffice.ts    # Box office from TMDB
│   ├── refreshBoxOffice.ts     # Wikipedia box office scrape
│   └── ...                     # Other maintenance scripts
├── e2e/                        # Playwright E2E tests
├── public/                     # Static assets
├── .claude/                    # Claude Code configuration
├── SETUP.md                    # Developer setup guide
├── AGENTS.md                   # AI agent instructions
└── package.json                # Dependencies & scripts
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│     movies      │
├─────────────────┤
│ id (PK)         │───┐
│ tmdb_id         │   │
│ title           │   │
│ year            │   │
│ director[]      │   │
│ cast_top3[]     │   │
│ music_directors[]│  │
│ banner          │   │
│ banner_parent   │   │
│ genres[]        │   │
│ box_office_cr   │   │
│ box_office_amount│  │
│ box_office_currency│ │
│ imdb_score      │   │
│ poster_url      │   │
│ trivia          │   │
│ where_to_watch  │   │
│ hint_easy       │   │
│ hint_medium     │   │
│ hint_hard       │   │
│ data_quality    │   │
│ tagline         │   │
│ people_images   │   │
│ banner_logo_path│   │
└─────────────────┘   │
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
┌─────────────────┐        ┌─────────────────┐
│  movie_pools    │        │ daily_puzzles   │
├─────────────────┤        ├─────────────────┤
│ movie_id (FK)   │        │ puzzle_date (PK)│
│ difficulty (PK) │        │ difficulty (PK) │
│ added_at        │        │ movie_id (FK)   │───┐
└─────────────────┘        │ status          │   │
                           │ created_at      │   │
                           └─────────────────┘   │
                                                 │
        ┌────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐        ┌─────────────────┐
│    players      │◄───────│     plays       │
├─────────────────┤        ├─────────────────┤
│ id (PK)         │        │ id (PK)         │
│ user_id         │        │ player_id (FK)  │
│ created_at      │        │ puzzle_date (FK)│
└─────────────────┘        │ difficulty (FK) │
        │                  │ guesses (jsonb) │
        │                  │ hints_used      │
        │                  │ outcome         │
        │                  │ won_on_guess    │
        │                  │ started_at      │
        │                  │ completed_at    │
        │                  └─────────────────┘
        │
        ▼
┌─────────────────┐
│    streaks      │
├─────────────────┤
│ player_id (FK)  │
│ difficulty (PK) │
│ current_streak  │
│ max_streak      │
│ total_plays     │
│ total_wins      │
│ last_played_date│
└─────────────────┘

┌──────────────────────┐  ┌──────────────────────────┐
│  director_edges      │  │ music_director_edges     │
├──────────────────────┤  ├──────────────────────────┤
│ director_a (PK)      │  │ md_a (PK)                │
│ director_b (PK)      │  │ md_b (PK)                │
└──────────────────────┘  └──────────────────────────┘
    (Edge cache tables, rebuilt nightly)
```

### Table Details

#### `movies`
Core film catalog. One row per film.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `tmdb_id` | integer | TMDB API film ID (unique) |
| `title` | text | Display title |
| `title_alternates` | text[] | Search aliases |
| `year` | integer | Release year |
| `director` | text[] | Director names |
| `cast_top3` | text[] | Top 3 cast members |
| `music_directors` | text[] | Music composers |
| `banner` | text | Production company |
| `banner_parent` | text | Parent company (for yellow match) |
| `genres` | text[] | Genre tags |
| `box_office_cr` | numeric | Box office in crores (normalized) |
| `box_office_amount` | numeric | Native amount |
| `box_office_currency` | enum | `INR_CR`, `USD_M`, `USD_B` |
| `imdb_score` | numeric | IMDb rating (0-10) |
| `poster_url` | text | TMDB poster URL |
| `trivia` | text | Fun fact (curator-written) |
| `where_to_watch_url` | text | JustWatch/streaming link |
| `hint_easy/medium/hard` | text | Difficulty-specific hints |
| `data_quality` | enum | `verified`, `tmdb_only`, `partial` |
| `tagline` | text | Film tagline |
| `people_images` | jsonb | Actor/director headshots (name → URL) |
| `banner_logo_path` | text | Production company logo |

#### `movie_pools`
Difficulty pool membership. One row per (film, difficulty) pair.

- **Easy**: ~500 most popular films
- **Medium**: ~1,500 well-known films
- **Hard**: All 3,000+ films in catalog

#### `daily_puzzles`
Scheduled puzzles. One row per (date, difficulty) pair.

| Column | Type | Purpose |
|--------|------|---------|
| `puzzle_date` | date | YYYY-MM-DD (IST) |
| `difficulty` | enum | `easy`, `medium`, `hard` |
| `movie_id` | uuid | The mystery film (hidden from anon) |
| `status` | enum | `scheduled`, `live`, `archived` |

**Security**: RLS prevents `SELECT movie_id` for anon role. Clients read from `daily_puzzles_public` view (omits `movie_id`).

#### `plays`
Player progress on a puzzle. One row per (player, date, difficulty) triple.

| Column | Type | Purpose |
|--------|------|---------|
| `guesses` | jsonb | Array of `{ movie_id: uuid }` |
| `hints_used` | integer | Count of hints consumed (0-2) |
| `outcome` | enum | `in_progress`, `won`, `lost` |
| `won_on_guess` | integer | Which guess won (1-10), null if lost |

#### `streaks`
Per-player, per-difficulty streak stats.

| Column | Type | Purpose |
|--------|------|---------|
| `current_streak` | integer | Consecutive days won (resets on skip/loss) |
| `max_streak` | integer | All-time best streak |
| `total_plays` | integer | Games started |
| `total_wins` | integer | Games won |
| `last_played_date` | date | Most recent play date (IST) |

#### Edge Cache Tables
Rebuilt nightly via `npm run edges:compute` (to be scheduled as Vercel Cron).

- **`director_edges`**: Co-director pairs (e.g., Raj & DK)
- **`music_director_edges`**: Co-composer pairs (e.g., Shankar-Ehsaan-Loy)

Used for **yellow tile logic**: "Guess director A worked with mystery director B on another film."

---

## Core Game Logic

### Tile Comparison Algorithm

Located in `src/lib/tiles.ts`. The `compareMovies(guess, mystery, edges)` function returns 8 `TileState` objects.

#### Tile Definitions

| Tile | Label | Green | Yellow | Gray | Arrow |
|------|-------|-------|--------|------|-------|
| **Director** | Director | Exact match (any director) | Co-directed with mystery director | No overlap | - |
| **Cast** | Lead cast | Same actor, same position | Same actor, wrong position | No overlap | - |
| **Year** | Year | Exact year | Within ±5 years | >5 years off | ↑ mystery is later / ↓ earlier |
| **Box Office** | Box office | Within ±10% | Within ±50% | >50% off | ↑ mystery earned more / ↓ less |
| **Music** | Music | Exact match (any composer) | Co-composed with mystery composer | No overlap | - |
| **Banner** | Banner | Exact production company | Same parent company | No match | - |
| **Genre** | Genre | All genres match | Some genres overlap | No overlap | - |
| **IMDb** | IMDb | Same rating (±0.0 at 1 decimal) | Within ±0.5 | >0.5 off | ↑ mystery rated higher / ↓ lower |

#### Special Logic

**Cast Tile** (`cast`)
- `chipColors` array: per-actor color for avatar rings
- Position-sensitive: Shah Rukh Khan at index 0 in guess vs. index 1 in mystery = yellow

**Director/Music Tiles** (`director`, `music`)
- Use edge tables for yellow state
- Example: Guess has Anurag Kashyap; mystery has Vikramaditya Motwane → yellow (co-directed *Paanch*)

**Genre Tile** (`genre`)
- Green = all genres match (set equality)
- Yellow = partial overlap
- `chipColors` array shows which individual genres matched

**Box Office Tile** (`boxOffice`)
- Displays native currency: `₹1,968 cr`, `$295M`, `$2.8B`
- Comparison uses normalized `box_office_cr` value
- ±10% threshold for green (close match)
- Arrow independent of color (gray tile can still point direction)

**IMDb Tile** (`imdb`)
- Compares at display precision (rounded to 1 decimal)
- 6.9 vs 7.0 = yellow (not green, to avoid "both correct" confusion)

### Poster Blur Progression

| Guesses Used | Blur (px) | Formula |
|--------------|-----------|---------|
| 0 | 40 | `40 - (guesses * 4)` |
| 1 | 36 | |
| 5 | 20 | |
| 9 | 4 | |
| 10 | 0 | |
| Won/Lost | 0 | Always reveal |

Function: `blurFor(guessCount, outcome)` in `src/lib/server/puzzle.ts`

### Hint System

- **2 hints total** per puzzle
- Unlock at guesses **3** and **6** (`HINT_UNLOCKS = [3, 6]`)
- **9 hint categories** (defined in `src/lib/hintCategories.ts`):

| Category | Example |
|----------|---------|
| `release_year_range` | "Released between 2010-2015" |
| `genre_partial` | "One genre is Drama" |
| `cast_partial` | "One lead actor is Shah Rukh Khan" |
| `director_partial` | "One director worked on Gangs of Wasseypur" |
| `music_partial` | "Music by A.R. Rahman" |
| `banner_partial` | "Produced by Yash Raj Films" |
| `box_office_range` | "Earned ₹100-200 crores" |
| `imdb_range` | "IMDb rating between 7.5-8.5" |
| `tagline` | "The film's tagline: '...'" |

**Server-side generation**: `generateHintFor(category, movie)` in `src/lib/server/hintCategories.ts`

---

## Application Routes

### User-Facing Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `src/app/page.tsx` | Home page - mode selection |
| `/easy` | `src/app/[difficulty]/page.tsx` | Daily Easy puzzle |
| `/medium` | `src/app/[difficulty]/page.tsx` | Daily Medium puzzle |
| `/hard` | `src/app/[difficulty]/page.tsx` | Daily Hard puzzle |
| `/archive` | `src/app/archive/page.tsx` | Past puzzles calendar grid |
| `/archive/[date]/[difficulty]` | `src/app/archive/[date]/[difficulty]/page.tsx` | Play specific archive puzzle |

### Admin Routes

| Path | Purpose |
|------|---------|
| `/admin` | Schedule dashboard (30 past + 30 future days) |
| `/admin/login` | Magic link email auth |
| `/admin/films` | Film catalog browser |
| `/admin/films/[id]` | Edit film metadata |
| `/admin/[date]/[difficulty]` | Assign mystery film for date/mode |

### Auth Route

| Path | Purpose |
|------|---------|
| `/auth/callback` | Supabase magic link callback handler |

---

## API Endpoints

All routes in `src/app/api/`.

### Daily Puzzle APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/puzzle` | GET | Load today's puzzle state | Cookie |
| `/api/guess` | POST | Submit a guess | Cookie |
| `/api/hint` | POST | Request a hint | Cookie |
| `/api/giveup` | POST | Give up (reveal answer) | Cookie |
| `/api/finish` | POST | Get full answer + streak | Cookie |
| `/api/catalog` | GET | Autocomplete search films | None |
| `/api/streaks` | GET | Fetch player streaks | Cookie |

### Archive APIs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/archive/puzzle` | GET | Load archive puzzle | Cookie |
| `/api/archive/guess` | POST | Submit archive guess | Cookie |
| `/api/archive/giveup` | POST | Give up on archive puzzle | Cookie |

### Shared Utilities

`src/app/api/_shared.ts`:
- `requireBackend()`: Returns 503 error if Supabase not configured
- `parseDifficulty(string)`: Validates difficulty param
- `badRequest(message)`: Returns 400 JSON response

---

## Components Structure

### Client Components

#### `PuzzleScreen.tsx`
Main game orchestrator. Manages:
- Puzzle loading (`/api/puzzle`)
- Guess submission (`/api/guess`)
- Hint sheet (`HintSheet`)
- Result screen (`ResultScreen`)
- State: `guesses`, `outcome`, `posterBlurPx`, `hintState`

#### `TileGrid.tsx`
Renders 8 tiles for a guess row.
- Props: `tiles[]`, `guessIdx`
- Visual: color-coded tiles, arrows, chip colors for cast/director/genre

#### `GuessAutocomplete.tsx`
Autocomplete search input powered by `/api/catalog`.
- Uses pg_trgm trigram index on `movies.title`
- Debounced fetch (300ms)
- Keyboard navigation (↑/↓/Enter)

#### `GuessCard.tsx`
Single guess row display.
- Film poster thumbnail
- Title + year
- `<TileGrid />` for 8 tiles
- PersonChip avatars for cast/director

#### `ResultScreen.tsx`
Win/lose modal.
- Full film details (poster, title, year, trivia, streaming link)
- Emoji share grid
- Streak display
- "Next puzzle in..." countdown

#### `HintSheet.tsx`
Bottom sheet with 9 hint category cards.
- Locked/unlocked state based on `hintUnlocks` and `guessesUsed`
- POST to `/api/hint` on category click
- Shows hint text after reveal

#### `ArchiveGrid.tsx`
Calendar grid of past puzzles.
- Numbered cards (1-31)
- Difficulty tabs (Easy/Medium/Hard)
- Green/Gray/Empty states (won/lost/unplayed)
- Links to `/archive/[date]/[difficulty]`

#### `ArchivePuzzleScreen.tsx`
Archive puzzle UI (similar to `PuzzleScreen` but uses `/api/archive/*`)

### Server Components

#### Home page (`page.tsx`)
- Loads streak state for 3 modes
- Shows "played today" badge on mode cards
- Countdown to next puzzle
- How It Works, FAQ, attributes sections

#### `SiteHeader.tsx`
Site-wide header with:
- Logo + tagline
- Theme toggle (dark/light)
- Archive link
- Difficulty badge (when on puzzle page)

#### `ModeCard.tsx`
Difficulty selection card.
- Color-coded accent (Easy=blue, Medium=orange, Hard=red via CSS vars)
- Streak display
- "Completed" checkmark if played today

---

## Data Pipeline

Located in `scripts/`. Executed via `npm run <script>`.

### Pipeline Flow

```
┌─────────────────────┐
│ 1. TMDB API Import  │  npm run tmdb:import --max=500
│    importTmdb.ts    │  Fetch films + credits from TMDB
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  staging/tmdb.json  │  Gitignored staging file
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Load to Supabase │  npm run movies:load --easy=500 --medium=1500
│    loadMovies.ts    │  Upsert movies + assign difficulty pools
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Rebuild Edges    │  npm run edges:compute
│  computeEdges.ts    │  Rebuild director_edges + music_director_edges
└─────────────────────┘
           │
           ▼
    ┌─────────────┐
    │  Optional:  │
    │ Enrichment  │
    │   Scripts   │
    └─────────────┘
      ├── backfillTaglines.ts       (TMDB taglines)
      ├── backfillPeopleImages.ts   (Actor/director headshots)
      ├── backfillBoxOffice.ts      (TMDB box office)
      ├── refreshBoxOffice.ts       (Wikipedia box office)
      └── backfillBannerLogos.ts    (Production company logos)
```

### Script Details

#### `importTmdb.ts`
Fetches Hindi films from TMDB `discover/movie` endpoint.

**Flags**:
- `--max=N` (default 200): Stop after N films
- `--min-votes=N` (default 20): Skip films with < N TMDB votes
- `--year-from=YYYY` (default 1950): Only releases after year
- `--fresh`: Ignore existing staging file, start over

**Output**: `scripts/staging/tmdb.json`

**Resumable**: Tracks last fetched film, re-run to continue

#### `loadMovies.ts`
Upserts films to `movies` table and assigns difficulty pools.

**Flags**:
- `--easy=N` (default 500): Top N films → Easy pool
- `--medium=N` (default 1500): Top N films → Medium pool
- Hard pool = all films

**Idempotent**: Re-running reconciles pool membership safely

**Data Quality**: Films imported with `data_quality='tmdb_only'` (missing curated fields like trivia, hints, streaming links)

#### `computeEdges.ts`
Rebuilds `director_edges` and `music_director_edges` tables.

**Algorithm**:
- Find all films with multiple directors/composers
- Create bidirectional edge for each pair
- Example: *Sacred Games* has Anurag Kashyap + Vikramaditya Motwane → 2 edges

**When to run**: After any catalog change (new films, cast updates)

**Production**: Will be scheduled as nightly Vercel Cron job

#### Enrichment Scripts

| Script | Purpose | Data Source |
|--------|---------|-------------|
| `backfillTaglines.ts` | Add `tagline` column | TMDB API |
| `backfillPeopleImages.ts` | Add `people_images` JSONB | TMDB person API |
| `backfillBoxOffice.ts` | Add `box_office_cr` | TMDB API (revenue field) |
| `refreshBoxOffice.ts` | Add `box_office_amount/currency` | Wikipedia infoboxes (Anthropic API scrape) |
| `backfillBannerLogos.ts` | Add `banner_logo_path` | TMDB company logos |

---

## Admin System

### Authentication

**Magic link email auth** (Supabase Auth):
1. User navigates to `/admin/login`
2. Enters email (must be in `SPOTLE_ADMIN_EMAILS` env var)
3. Supabase sends magic link
4. Click link → redirected to `/auth/callback` → session established → redirect to `/admin`

**Authorization**: `requireAdmin()` guard in `src/lib/server/requireAdmin.ts`
- Checks Supabase session
- Verifies email in allowlist (`SPOTLE_ADMIN_EMAILS`)
- Returns 401 if unauthorized

### Schedule Dashboard (`/admin`)

Shows **60-day calendar** (30 past + 30 future):
- **Past 30 days**: Allows backfilling archive puzzles
- **Future 30 days**: Schedule upcoming puzzles

**Features**:
- Color-coded cells (empty/scheduled/live)
- Click any cell → `/admin/[date]/[difficulty]` to assign film
- Coverage stats: "X / 30 scheduled" per difficulty

**Recent Change** (PR #28): Unlocked past-date edits to enable archive backfill

### Film Assignment (`/admin/[date]/[difficulty]`)

1. Autocomplete search for film (filtered by difficulty pool)
2. Preview film details
3. Confirm assignment → Updates `daily_puzzles` table
4. Sets `status='scheduled'` (cron job will update to `live`/`archived`)

### Film Catalog (`/admin/films`)

Browse all films with filters:
- Data quality (`verified`, `tmdb_only`, `partial`)
- Difficulty pool membership
- Search by title

### Film Editor (`/admin/films/[id]`)

Curator-editable fields:
- `trivia` (fun fact shown on result screen)
- `where_to_watch_url` (JustWatch link)
- `hint_easy/medium/hard` (custom hints override auto-generated)
- `banner_parent` (for yellow banner matching)
- `data_quality` status

**After edit**: Mark film as `verified` data quality

---

## Security Model

### Row-Level Security (RLS)

Enforced in `supabase/migrations/0002_rls.sql`.

#### Anon Role Restrictions

**Cannot read** `daily_puzzles.movie_id`:
```sql
-- No SELECT policy exists on daily_puzzles for anon role
-- Client reads from daily_puzzles_public view instead
```

**Can read** own plays:
```sql
CREATE POLICY "players_read_own" ON plays
  FOR SELECT USING (player_id = current_user_id_from_cookie());
```

**Can insert/update** own plays:
```sql
CREATE POLICY "plays_upsert_own" ON plays
  FOR INSERT WITH CHECK (player_id = current_user_id_from_cookie());
```

#### Authenticated Role (Admin)

**Full access** to all tables (via service role key in API routes).

### API Route Security

- **Anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): Client-side reads (safe, RLS enforced)
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`): Server-only, used in `/api/*` routes
  - **NEVER** imported in client components
  - Bypasses RLS (trusted server code)

### Cookie-Based Player Identification

- `player_id` stored in HTTP-only cookie (`src/lib/playerCookie.ts`)
- UUID generated on first visit
- No PII stored
- Used for streak tracking and play history

### Environment Variable Separation

```
# Safe for client bundle
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Server-only (never exposed)
SUPABASE_SERVICE_ROLE_KEY=...
SPOTLE_ADMIN_EMAILS=...
TMDB_API_KEY=...
```

**Validation**: `src/lib/supabase/env.ts` checks required vars at runtime

---

## Recent Development History

### Recent Commits (Last 20)

| Commit | Description | PR |
|--------|-------------|-----|
| `f7ce53d` | Merge PR #28: admin-past-date-backfill | #28 |
| `3320024` | Unlock past-date admin edits for archive backfill | - |
| `d5b7602` | Merge PR #27: archive-grid-redesign | #27 |
| `46d5ef0` | Archive — numbered-card grid + difficulty tabs; admin shows past 30 days | - |
| `fbfe967` | Merge PR #26: archive-practice-mode | #26 |
| `f5a0fd9` | Archive mode — play past puzzles as practice | - |
| `df0f775` | Merge PR #25: tiles-arrows-and-tips-autoplay | #25 |
| `f0d6cfc` | Show direction arrows on all box office / IMDb tiles, auto-advance tips | - |
| `9785b30` | Catch magic-link code=/token_hash= on home page and forward to /auth/callback | - |
| `4cdc3f3` | Merge PR #24: chunk-14-box-office-rework | #24 |
| `6470cb5` | Chunk 14: rebuild box office from Wikipedia infoboxes (native currency) | - |
| `ed9efd7` | Merge PR #23: chunk-13-tips-and-banner-logos | #23 |
| `fb4dd3d` | Chunk 13: rotating puzzle tips + banner logo + vertical banner tile | - |
| `b464be2` | Merge PR #22: fix-per-genre-pill-colors | #22 |
| `56d4524` | Per-genre pill coloring instead of a single pool color | - |
| `bdce8f9` | Merge PR #21: person-chip-grayscale | #21 |
| `92d480b` | Desaturate PersonChip avatars for cast/director misses | - |
| `b977c63` | Merge PR #20: chunk-12-cast-matching-and-dismissible-result | #20 |
| `13e35bb` | Chunk 12: per-actor cast matching + dismissible result screen | - |

### Development Phases

The project was built in "chunks" (incremental PRs):

1. **Chunks 1-4**: Core game loop (tiles, guesses, daily puzzle)
2. **Chunks 5-8**: Supabase integration, streak tracking, share functionality
3. **Chunks 9-11**: Hint system, admin dashboard, film editor
4. **Chunk 12**: Per-actor cast matching (green/yellow avatar rings)
5. **Chunk 13**: Rotating puzzle tips, banner logos
6. **Chunk 14**: Native currency box office (Wikipedia enrichment)
7. **Recent**: Archive mode, past-date admin edits, arrow directions on tiles

### Current State

- **Version**: v1 preview
- **Live**: [spotle-bollywood.vercel.app](https://spotle-bollywood.vercel.app)
- **Catalog**: ~3,000 Hindi films
- **Branch**: `main` (no feature branches currently)
- **Modified Files**: `next.config.ts` (allowedDevOrigins for local network testing)
- **Untracked**: `.superpowers/` (brainstorming/SDD artifacts from recent Claude sessions)

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` from `.env.example`:

```bash
# Supabase (required for backend)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin auth (comma-separated emails)
SPOTLE_ADMIN_EMAILS=you@example.com,curator@example.com

# TMDB (optional, for data pipeline scripts)
TMDB_API_KEY=...
```

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Start Supabase local (Docker required)
npx supabase start

# 4. Apply migrations
npx supabase db reset

# 5. Start dev server
npm run dev  # http://localhost:3000
```

### Production Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in project settings
4. Deploy

**Auto-deployment**: Main branch auto-deploys on push

---

## Testing Strategy

### Unit Tests (Vitest)

Located in `src/lib/*.test.ts`.

**Coverage**:
- `tiles.test.ts`: Tile comparison algorithm (green/yellow/gray logic)
- `dateIst.test.ts`: IST date handling, date key generation
- `streaks.test.ts`: Streak calculation (current, max, reset logic)

**Run**:
```bash
npm test          # Run once
npm run test:watch # Watch mode
npm run test:cov   # With coverage report
```

### E2E Tests (Playwright)

Located in `e2e/*.spec.ts`.

**Coverage**:
- `home.spec.ts`: Mode selection, streak display
- `puzzle.spec.ts`: Guess submission, tile colors, win/lose
- `hints.spec.ts`: Hint unlock, reveal
- `admin.spec.ts`: Schedule dashboard (basic smoke test)

**Mocking**: `e2e/mocks.ts` provides Supabase mock data for test isolation

**Run**:
```bash
npm run e2e        # Headless
npm run e2e:ui     # UI mode
npm run e2e:headed # Headed browser
```

### Manual Testing Checklist

- [ ] Daily puzzle loads correctly for all 3 difficulties
- [ ] Guess submission → correct tile colors
- [ ] Poster blur progresses (40px → 0px)
- [ ] Hints unlock at guesses 3 and 6
- [ ] Streak increments on win, resets on skip/loss
- [ ] Share generates correct emoji grid
- [ ] Archive mode works (practice play, no streak impact)
- [ ] Admin can schedule puzzles
- [ ] Admin can edit film metadata
- [ ] Theme toggle (light/dark) persists

---

## Deployment & Infrastructure

### Hosting

**Platform**: Vercel
- **Framework Preset**: Next.js
- **Node Version**: 24 LTS (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Database

**Supabase** (managed PostgreSQL):
- **Tier**: Free (or Pro for production)
- **Extensions**: `pgcrypto`, `pg_trgm`
- **Backups**: Daily automated (Supabase)

### Cron Jobs (Planned)

**Vercel Cron** configuration (to be added to `vercel.json` or `vercel.ts`):

```json
{
  "crons": [
    {
      "path": "/api/cron/rebuild-edges",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/update-puzzle-status",
      "schedule": "30 0 * * *"
    }
  ]
}
```

**Jobs**:
1. **Rebuild edges** (2:00 AM IST daily): Run `computeEdges.ts` logic
2. **Update puzzle status** (12:30 AM IST daily): Move `scheduled` → `live`, `live` → `archived`

### CDN & Performance

- **Edge Network**: Vercel global CDN
- **Static Assets**: `/public/*` served from edge
- **Image Optimization**: Next.js `<Image />` component (auto WebP/AVIF)
- **Cache Headers**: API routes use `force-dynamic` (no caching for puzzle data)

### Monitoring (Planned)

- **Vercel Analytics**: Page views, Web Vitals
- **Sentry**: Error tracking (to be integrated)
- **Supabase Logs**: Query performance, RLS policy audits

---

## Areas for Improvement

### High Priority

#### 1. Cron Job Implementation
**Issue**: Edge tables (`director_edges`, `music_director_edges`) not auto-rebuilding  
**Solution**: Implement Vercel Cron jobs for nightly edge rebuilds  
**Files**: Create `/api/cron/rebuild-edges/route.ts`, update `vercel.ts`

#### 2. Puzzle Status Automation
**Issue**: `daily_puzzles.status` not auto-updating (scheduled → live → archived)  
**Solution**: Cron job to transition puzzle status at midnight IST  
**Files**: Create `/api/cron/update-puzzle-status/route.ts`

#### 3. Data Quality Backfill
**Issue**: ~70% of films have `data_quality='tmdb_only'` (missing trivia, hints, streaming links)  
**Solution**:
- Curator workflow improvements (batch edit UI)
- Community contributions (submit trivia form)
- LLM-assisted hint generation (GPT-4 with TMDB data)

#### 4. Performance Optimization
**Current**: Autocomplete query time ~200-400ms  
**Target**: <100ms  
**Solutions**:
- Add GIST index on `title_alternates` (currently only on `title`)
- Cache popular searches in Redis/Vercel KV
- Pre-compute trigram matches for top 500 films

#### 5. Mobile Responsiveness
**Issue**: Tile grid overflows on small screens (<360px)  
**Solution**: Responsive font sizing, horizontal scroll fallback

### Medium Priority

#### 6. Share Enhancements
**Current**: Text-only emoji grid  
**Desired**: Image share (card with logo, emoji grid, stats)  
**Tech**: Canvas API to generate share image

#### 7. Leaderboards
**Planned**: Global/friend leaderboards by max streak  
**Blocked by**: User accounts (currently anonymous via cookie)

#### 8. Multiplayer Mode
**Idea**: Head-to-head racing (same puzzle, who wins faster)  
**Complexity**: Real-time sync (Supabase Realtime)

#### 9. Puzzle Variants
- **Movie of the Week**: One harder puzzle, 7 days to solve
- **Theme Weeks**: Only SRK films, only 90s films, etc.

#### 10. Accessibility
- [ ] ARIA labels for tiles (screen reader support)
- [ ] Keyboard navigation for autocomplete
- [ ] High-contrast mode (for colorblind users)
- [ ] Focus indicators

### Low Priority

#### 11. Analytics Dashboard (Admin)
**Metrics**:
- Daily active users
- Average guesses to win (by difficulty)
- Most-searched films (autocomplete logs)
- Hint category usage

#### 12. Internationalization
**Languages**: Hindi, English (dual language support)  
**Scope**: UI strings, film titles (some have Hindi/English alternates)

#### 13. Offline Mode
**PWA**: Service worker to cache today's puzzle  
**Sync**: Submit guesses when back online

#### 14. Content Moderation
**Issue**: User-submitted trivia/hints (if community feature added)  
**Solution**: Admin approval queue

---

## Technical Debt

### Code Quality

1. **Type Safety**: Some `any` types in API response parsing (should use Zod schemas)
2. **Error Handling**: Generic try-catch blocks (should use error boundaries)
3. **Component Size**: `PuzzleScreen.tsx` is 300+ lines (split into hooks/contexts)
4. **Duplicate Logic**: Archive puzzle logic duplicates daily puzzle (refactor into shared hook)

### Database

1. **Missing Indexes**: 
   - `plays(completed_at)` for analytics queries
   - `movies(data_quality)` for catalog filtering
2. **Denormalization**: `people_images` JSONB could be separate `people` table
3. **Migrations**: No rollback scripts (all forward-only)

### Testing

1. **E2E Coverage**: Only 4 test files (missing admin edit flow, archive mode)
2. **Unit Tests**: No tests for server-side functions (`puzzle.ts`, `schedule.ts`)
3. **Integration Tests**: No tests for Supabase RLS policies

### DevOps

1. **CI/CD**: No pre-merge checks (linting, tests)
2. **Environments**: No staging environment (deploys direct to prod)
3. **Secrets Management**: Env vars managed manually in Vercel UI

---

## Design System

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Display | Fraunces | 32-48px | 600-700 |
| Body | Inter | 14-16px | 400 |
| UI Labels | Inter | 12px | 500-600 |
| Monospace | Monospace | 12px | 400 |

**Font Loading**: `next/font/google` with `display: swap`

### Color System

Defined in `src/app/globals.css` via CSS variables.

**Light Mode**:
```css
--accent: hsl(220, 90%, 56%);       /* Blue for Easy */
--accent-ink: white;
--foreground: hsl(0, 0%, 10%);
--surface: white;
--border: hsl(0, 0%, 90%);
```

**Dark Mode**:
```css
--accent: hsl(220, 80%, 60%);
--foreground: hsl(0, 0%, 95%);
--surface: hsl(0, 0%, 10%);
--border: hsl(0, 0%, 20%);
```

**Difficulty Colors** (via inline styles):
- Easy: Blue (`hsl(220, 90%, 56%)`)
- Medium: Orange (`hsl(30, 100%, 50%)`)
- Hard: Red (`hsl(0, 80%, 50%)`)

### Tile Colors

| State | Light | Dark |
|-------|-------|------|
| Green | `hsl(142, 76%, 36%)` | `hsl(142, 70%, 45%)` |
| Yellow | `hsl(45, 93%, 47%)` | `hsl(45, 90%, 55%)` |
| Gray | `hsl(0, 0%, 60%)` | `hsl(0, 0%, 40%)` |

### Spacing Scale

Tailwind default scale (4px base):
- `gap-2` = 8px
- `gap-4` = 16px
- `gap-8` = 32px

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

**Max Width**: `max-w-3xl` (48rem / 768px) for main content

---

## Key Files Reference

### Entry Points
- `src/app/page.tsx` - Home page
- `src/app/[difficulty]/page.tsx` - Daily puzzle
- `src/app/api/puzzle/route.ts` - Puzzle loading API

### Core Logic
- `src/lib/tiles.ts` - Tile comparison algorithm (158 lines)
- `src/lib/dateIst.ts` - IST date handling
- `src/lib/streaks.ts` - Streak calculation
- `src/lib/difficulty.ts` - Difficulty metadata

### Database
- `supabase/migrations/0001_init.sql` - Schema definition
- `supabase/migrations/0002_rls.sql` - Row-level security
- `src/lib/supabase/admin.ts` - Service role client

### Components
- `src/components/PuzzleScreen.tsx` - Main game UI
- `src/components/TileGrid.tsx` - Tile display
- `src/components/GuessAutocomplete.tsx` - Film search

### Scripts
- `scripts/importTmdb.ts` - TMDB import
- `scripts/loadMovies.ts` - Database upsert
- `scripts/computeEdges.ts` - Edge table rebuild

---

## Glossary

| Term | Definition |
|------|------------|
| **Tile** | One of 8 comparison dimensions (Director, Cast, Year, etc.) |
| **Edge** | Co-director or co-composer relationship (for yellow matching) |
| **Pool** | Difficulty-specific film subset (Easy/Medium/Hard) |
| **Streak** | Consecutive days won without skipping |
| **IST** | Indian Standard Time (UTC+5:30) |
| **RLS** | Row-Level Security (PostgreSQL access control) |
| **Anon Role** | Unauthenticated Supabase user (client-side) |
| **Service Role** | Admin Supabase client (server-side, bypasses RLS) |
| **Curator** | Admin user who schedules puzzles and enriches film data |
| **Data Quality** | Film metadata completeness (`verified`, `tmdb_only`, `partial`) |
| **Archive Mode** | Practice play on past puzzles (no streak impact) |
| **Give Up** | Reveal answer early (counts as loss, breaks streak) |

---

## Appendix: npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start dev server (Turbopack) |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Lint code |
| `test` | `vitest run` | Run unit tests once |
| `test:watch` | `vitest` | Unit tests in watch mode |
| `test:cov` | `vitest run --coverage` | Unit tests with coverage |
| `e2e` | `playwright test` | Run E2E tests (headless) |
| `e2e:ui` | `playwright test --ui` | E2E tests in UI mode |
| `e2e:headed` | `playwright test --headed` | E2E tests with browser visible |
| `seed` | `tsx scripts/seed.ts` | Seed database (deprecated) |
| `migrate` | `tsx scripts/migrate.ts` | Run migrations (deprecated, use Supabase CLI) |
| `tmdb:import` | `tsx scripts/importTmdb.ts` | Import films from TMDB |
| `movies:load` | `tsx scripts/loadMovies.ts` | Load films to Supabase |
| `edges:compute` | `tsx scripts/computeEdges.ts` | Rebuild edge tables |
| `cleanup:mock` | `tsx scripts/cleanupMockDuplicates.ts` | Remove mock data |
| `enrich:films` | `tsx scripts/enrichMovies.ts` | Enrich film metadata |
| `tmdb:taglines` | `tsx scripts/backfillTaglines.ts` | Backfill taglines |
| `tmdb:backfill-people` | `tsx scripts/backfillPeopleImages.ts` | Backfill actor images |
| `tmdb:backfill-boxoffice` | `tsx scripts/backfillBoxOffice.ts` | Backfill TMDB box office |
| `tmdb:backfill-banner-logos` | `tsx scripts/backfillBannerLogos.ts` | Backfill company logos |
| `tmdb:refresh-boxoffice` | `tsx scripts/refreshBoxOffice.ts` | Refresh box office from Wikipedia |

---

## Contact & Contribution

**Creator**: Om Golesar  
**Email**: omgolesar99@gmail.com  
**LinkedIn**: [om-golesar-173ab12aa](https://www.linkedin.com/in/om-golesar-173ab12aa/)

**Repository**: Private (as of writing)  
**Issues**: Contact via email

---

**End of Document**
