# Spotle Bollywood — v1 Design Spec

**Date:** 2026-10-02
**Status:** Draft, pending user review
**Author:** Om (with Claude)

---

## 1. Purpose & Intent

Build a daily "guess the mystery Bollywood movie" game, modeled on [Spotle Movies](https://spotle.movie/) but designed from the ground up for Hindi cinema fans. The product is a real website intended for a real audience — not a toy — so day-one decisions must support growth into audio clues (v2), accounts and leaderboards (v3), and lore/badges (v4) without re-architecting.

**Success looks like:**
- A player opens the site daily, plays one or more of the three difficulty modes, and shares results on WhatsApp.
- Three difficulty tiers (Easy, Medium, Hard) genuinely serve different audiences — casual fans of recent blockbusters at one end, cinephiles of parallel/cult cinema at the other.
- The site works equally well on a budget Android phone and a desktop browser; no native app needed in v1.
- Puzzle quality is high enough that players don't bounce from "I've never heard of this film" (Easy) or "that was trivially recognisable" (Hard).

**Non-goals for v1:**
- No native mobile app.
- No accounts / login / social features.
- No audio clues (song/dialogue clips).
- No badges, trivia collection, or long-term progression beyond daily streaks.
- No monetisation surfaces (ads, subscriptions).

---

## 2. Scope

### v1 (this spec)
- Core daily puzzle: 10 guesses, 8 color-coded attribute tiles per guess.
- Three difficulty levels (Easy / Medium / Hard), each a separately scheduled daily puzzle on an independent movie pool.
- Progressive poster-blur reveal across guesses.
- Hint system: 2 hints per play, same count for all difficulties; hint text tier varies by difficulty.
- Streak tracking per difficulty (cookie-based, no accounts).
- Share-to-WhatsApp emoji grid.
- Result screen with trivia and "where to watch" link.
- Admin curation UI for scheduling puzzles.
- Responsive web, mobile-first, works to desktop.

### Deferred to later versions
- **v2:** Multi-modal clues (song intro clips, dialogue audio).
- **v3:** Accounts, friend leaderboards, duels, "challenge a friend" with persistent identity.
- **v4:** Collectibles — unlocked trivia cards, decade/star-collector badges, long-term progression.
- **v1.1 candidates** (post-launch): archive / rewatch mode, dynamic rescue for stuck Hard players, Hard-mode visual theme (B&W / filmreel), sensitive-content tagging.

---

## 3. Game Design

### 3.1 Core loop
A player picks a difficulty, is presented with a progressively-blurring poster and a search box, and has up to 10 attempts to name the mystery film. Each wrong guess:
- Reveals 8 color-coded tiles comparing the guess to the mystery film across 8 attributes.
- Reduces the poster blur by one step (10 steps total, from σ≈40px to near-clear).

The player wins when they name the correct film; loses after 10 wrong guesses. Either outcome triggers a result screen with the answer, trivia, and a shareable emoji grid.

### 3.2 The 8 attribute tiles

| Tile | Green | Yellow | Gray |
|---|---|---|---|
| Director | directors intersect | guess's director has co-directed a different film with mystery's director | otherwise |
| Lead cast (top 3) | ≥1 cast member in same billing position | cast member present but different position | no overlap |
| Year | exact | within 5 years, with ↑/↓ arrow | otherwise |
| Box office (₹ cr) | within 10% | within 50%, with ↑/↓ arrow | otherwise, or either value null |
| Music director(s) | arrays intersect | co-composed with mystery's MD on another film | otherwise |
| Banner | same banner | same `banner_parent` (sister label) | otherwise |
| Genre | genre sets equal | ≥1 overlap | zero overlap |
| IMDb score | within 0.3 | within 1.0, with ↑/↓ arrow | otherwise, or either null |

Tile rules live in a single server module `lib/tiles.ts` with exhaustive unit tests. **The client never computes tile state** — it receives pre-computed states from `/api/guess`. This is both correctness insurance and the mechanism that keeps the answer out of the client bundle.

Precomputed lookup tables (`director_edges`, `music_director_edges`) are materialized from the `movies` table on a nightly Vercel Cron so the hot path is a single Postgres read, not graph traversal.

### 3.3 Three difficulty levels

| Aspect | Easy | Medium | Hard |
|---|---|---|---|
| Movie pool | ~500 modern blockbusters | ~1,500 well-known | ~3,000+ incl. parallel, cult, deep cuts |
| Guesses | 10 | 10 | 10 |
| Visible tiles | 8 | 8 | 8 |
| Hints available | 2 | 2 | 2 |
| Hint tone | direct ("Lead actor: SRK") | partial ("Lead actor's debut was 1988") | cryptic ("Music director also scored a Satyajit Ray film") |
| Autocomplete pool | Easy pool only | Medium pool only | Hard pool only |
| Streak reward | 1× | 1× | 3× (🎬⭐ badge) |
| Loss screen | identical template | identical | identical (trivia + where-to-watch) |

**Key design decision:** All three modes have identical mechanics. Difficulty signal lives in (a) movie pool, (b) hint cryptic-ness, and (c) prestige shown on the share card. Rationale: punishing mechanics in optional difficulty tiers kill retention; we want cinephiles who choose Hard to still *win*, not bounce. Hard earns prestige through winning harder films, not through surviving tighter rules.

**Pools are cumulative:** Hard includes Easy and Medium films plus deep cuts. A film seen in Easy may reappear in Hard weeks later. This is intentional — recognising a film you got help on in Easy mode when it appears cold in Hard mode is a satisfying win.

**Hint unlock schedule:** hint 1 after guess 3, hint 2 after guess 6. (Earlier than Spotle Movies' 5/8 because our pools include tougher films.)

### 3.4 Scoring & streaks (v1)
No points system in v1. The reward surface is:
- Per-difficulty streak counter on the home screen.
- Share card renders Hard wins with a 🎬⭐ badge, visually distinguishing them.
- Three difficulties' streaks shown side-by-side so Hard streaks stand out by comparison.

Proper points land with v3 accounts.

### 3.5 Daily puzzle scheduling
Puzzles are **pre-scheduled** by the curator (via `/admin`), not generated deterministically from a date hash. This gives:
- Editorial control (sequence hard/easy weeks, avoid "SRK twice in a row").
- Ability to swap bad picks after discovery.
- No ability for anyone to compute future answers from a leaked pool.

Puzzle dates are IST (`Asia/Kolkata`); cutover is 00:00 IST. All date math lives in one module (`lib/dateIst.ts`).

---

## 4. Architecture

### 4.1 Stack
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.
- **Backend:** Next.js API routes (co-deployed, no separate service).
- **Database:** Supabase Postgres with row-level security.
- **Storage:** Supabase Storage reserved for v2 audio clips. v1 posters served from TMDB CDN directly.
- **Hosting:** Vercel. Supabase project separate per environment.
- **Scheduled jobs:** Vercel Cron for nightly edge-table rebuild and daily puzzle-health ping.

### 4.2 Core architectural rule — the client never knows the answer

**Non-negotiable.** The daily `movie_id` is never serialized to the browser. The client submits guesses; the server computes tile state and returns only the comparison result. The movie *catalog* (searchable list for autocomplete) is public but only exposes id, title, year, poster thumbnail — nothing that would reveal the answer via elimination.

**RLS enforces this at the database level:** the anonymous Supabase role cannot `SELECT movie_id FROM daily_puzzles`. Only the service role (used server-side in API routes) can.

### 4.3 Request flow

```
Browser ──► GET  /api/puzzle?date=&difficulty=
         ◄── { puzzleId, totalGuesses, posterBlurStart, hintsAvailable, existingGuesses, posterUrl }

Browser ──► GET  /api/catalog?q=&difficulty=   (debounced)
         ◄── [{ id, title, year, posterThumb }, ...]

Browser ──► POST /api/guess { puzzleId, guessMovieId }
         ◄── { tiles, posterBlurPx, correct, guessesRemaining, hintsRemaining, outcome }

Browser ──► POST /api/hint  { puzzleId }
         ◄── { hintText, hintsRemaining }

Browser ──► POST /api/finish { puzzleId }   (triggered on win/lose)
         ◄── { answer:{title,year,director,cast,trivia,whereToWatchUrl,posterUrl}, scoreDelta }
```

### 4.4 Session identity (v1)
A first-party `playerId` cookie (uuid, httpOnly, SameSite=Lax) is set on first visit. All server state keys off this cookie. Streak and resume behavior are tied to the cookie. Losing the cookie loses the streak — acceptable risk for v1; v3 adds account-based identity.

### 4.5 Dependencies
- **TMDB API:** used offline for bootstrap and ongoing data refresh; not on the request hot path.
- **Supabase:** critical dependency. Free tier is sufficient for launch (500MB DB, 50k MAU, 2GB bandwidth).
- **Vercel:** critical dependency. Free tier sufficient.

---

## 5. Data Model

Six tables.

### 5.1 `movies` — the catalog
Single source of truth for every candidate film.

| column | type | notes |
|---|---|---|
| `id` | uuid, pk | internal id |
| `tmdb_id` | int, unique | for re-sync from TMDB |
| `title` | text | canonical English title |
| `title_alternates` | text[] | Devanagari, parenthesized variants, etc. for search |
| `year` | int | release year |
| `director` | text[] | array (co-directors exist, e.g. Abbas-Mustan) |
| `cast_top3` | text[] | ordered; billing position matters |
| `music_directors` | text[] | array (SEL = 3 entries) |
| `banner` | text | production house name |
| `banner_parent` | text, nullable | for sister-label yellow matches |
| `genres` | text[] | bounded vocab ~12 |
| `box_office_cr` | numeric, nullable | lifetime nett in ₹ crores |
| `imdb_score` | numeric, nullable | 0–10 |
| `poster_url` | text | TMDB CDN URL |
| `trivia` | text | 2–4 lines for the result screen |
| `where_to_watch_url` | text, nullable | JioCinema/Netflix/Prime etc. |
| `hint_easy`, `hint_medium`, `hint_hard` | text | the three hint flavors |
| `data_quality` | enum: `verified`, `tmdb_only`, `partial` | for curator filtering |

Nullable numeric attributes render as `—` in the UI and always evaluate to gray; score math skips them.

### 5.2 `movie_pools`
Many-to-many; cumulative design (every Easy film also lives in Medium and Hard pools, inserted explicitly).

| column | type |
|---|---|
| `movie_id` | fk → movies |
| `difficulty` | enum: `easy`, `medium`, `hard` |
| `added_at` | timestamptz |

Pk `(movie_id, difficulty)`.

### 5.3 `daily_puzzles` — pre-scheduled calendar

| column | type |
|---|---|
| `puzzle_date` | date (IST) |
| `difficulty` | enum |
| `movie_id` | fk |
| `status` | enum: `scheduled`, `live`, `archived` |

Pk `(puzzle_date, difficulty)`. **RLS: `movie_id` unreadable to anon role.**

### 5.4 `players` — anonymous identity

| column | type |
|---|---|
| `id` | uuid, pk — matches cookie value |
| `created_at` | timestamptz |
| `user_id` | uuid, nullable, fk → auth.users (v3) |

### 5.5 `plays` — one row per (player, puzzle)
Heart of game state. Resumable sessions, streak math, result screens all read from here.

| column | type |
|---|---|
| `id` | uuid, pk |
| `player_id` | fk |
| `puzzle_date` | date |
| `difficulty` | enum |
| `guesses` | jsonb — array of `{movieId, tilesResult, timestamp}` |
| `hints_used` | int |
| `outcome` | enum: `in_progress`, `won`, `lost` |
| `won_on_guess` | int, nullable |
| `started_at`, `completed_at` | timestamptz |

Unique `(player_id, puzzle_date, difficulty)`.

### 5.6 `streaks` — denormalized convenience
Could be derived from `plays`; denormalized to keep home-screen render cheap.

| column | type |
|---|---|
| `player_id` | fk |
| `difficulty` | enum |
| `current_streak`, `max_streak` | int |
| `total_plays`, `total_wins` | int |
| `last_played_date` | date |

Compound pk `(player_id, difficulty)`.

### 5.7 Edge-cache tables (materialized)
- `director_edges(director_a, director_b)` — pairs who co-directed any film.
- `music_director_edges(md_a, md_b)` — pairs who co-composed any film.

Rebuilt nightly from `movies` via Vercel Cron.

---

## 6. UI / UX

### 6.1 Routes
```
/                       Home / mode-picker + streaks
/easy, /medium, /hard   Puzzle screens
/result/[puzzleId]      Shared result page (opened from WhatsApp)
/archive                Rewatch (v1.1 stub)
/admin                  Curator UI (auth-gated)
```

### 6.2 Screens
- **Home:** logo, IST date, three mode cards (name, one-line description, Play button, current streak, "played ✓" check). Hard card has subtle 🎬⭐ accent. "How to play" link opens a sheet.
- **Puzzle:** top bar (mode, guesses remaining, hint button) → blurred poster (~40% of mobile viewport, un-blurs on each guess) → sticky guess input with autocomplete rising above the keyboard → guesses history (most recent first, 2×4 tile grid per guess on mobile, 1×8 on desktop ≥768px). No ads, footer, or hamburger.
- **Hints sheet:** bottom sheet from the hint button; unlocked hints as cards; locked hints show "Unlocks after guess N".
- **Result screen:** full-screen, win/lose header with emoji grid, unblurred poster, title/director/year, 3-line trivia card, "Where to watch" button, streak summary, Share button (native share → WhatsApp fallback), midnight-IST countdown, cross-sell to other modes.
- **Shared result page:** respects whether recipient has played — shows redacted "Someone solved today's Hard in 4 — can you beat them?" with Play CTA, never leaks the answer to a non-player.

### 6.3 Design system
- **Tailwind** with custom palette.
- **Primary accent:** marigold `#F4A24C` (placeholder, revisitable).
- **Hard-mode accent:** muted gold `#C9A961` for 🎬⭐ badge.
- **Tile colors (stable across modes):** green `#5BA85A`, yellow `#D4A24C`, gray `#4A4A4A`.
- **Type:** Inter for UI; display face (Fraunces or Playfair) for wordmark and result-screen titles only.
- **Dark mode:** supported from day one; system-preference default; toggle in settings sheet.
- **Motion:** tile flip 200ms stagger; poster blur 400ms ease-out; respects `prefers-reduced-motion`.

### 6.4 Accessibility
- Every tile has an aria-label describing color, attribute, and arrow direction.
- Tiles include small iconography (✓, ↑, ↓, ∿, ✕) so color is never the only signal.
- Full keyboard navigation: autocomplete arrow-navigable, enter-submits, tab-order through tiles.
- 44×44 minimum touch targets.
- Contrast ≥ 4.5:1 in both light and dark modes.

---

## 7. Game Flow — explicit sequences

### 7.1 Loading a puzzle
1. Browser hits `/[difficulty]`. Server reads `playerId` cookie (sets one if absent).
2. Server queries `plays` for `(playerId, today_IST, difficulty)`.
   - Existing & `outcome != 'in_progress'` → redirect to result screen (idempotent).
   - Existing & `in_progress` → hydrate UI with partial guesses.
   - Missing → insert new play row with `outcome='in_progress'`, empty guesses.
3. Server renders page with the above state. Poster URL is included; browser downloads once from TMDB and applies CSS blur that decreases per guess.

### 7.2 A guess
1. Player types in autocomplete; client calls `/api/catalog?q=…&difficulty=…` with debounce (150ms). Server fuzzy-matches via `pg_trgm` + `title_alternates`, returns top ~8 restricted to the current difficulty pool.
2. Player selects → `/api/guess { puzzleId, guessMovieId }`.
3. Server loads both movies, computes tile states, appends to `plays.guesses`.
4. On match: `outcome='won'`, `won_on_guess=N`, update `streaks`.
5. On 10th wrong guess: `outcome='lost'`, reset `streaks.current_streak=0`.
6. Returns `{ tiles, posterBlurPx, correct, guessesRemaining, hintsRemaining, outcome }`.
7. Client animates tile flip (200ms stagger), reduces poster blur with 400ms ease-out.

### 7.3 Hints
Unlock schedule: after guess 3 and after guess 6. Hint text pulled from `hint_{difficulty}` column. Using a hint does not consume a guess. Server enforces: 2 max, must be currently unlocked.

### 7.4 End screen
Fired on `won` or `lost`. Server returns answer + trivia + where-to-watch URL. Client renders full-screen result with emoji grid and share CTA.

### 7.5 Edge cases
- **Timezone:** all date logic in `lib/dateIst.ts`; server authoritative; client never computes "today".
- **Resuming:** `/api/puzzle` hydrates partial state from `plays.guesses`.
- **Replay:** `/api/guess` returns 409 if play's `outcome != 'in_progress'`.
- **Invalid guess (movie not in pool):** 400; client prevents via autocomplete; server guards defensively.
- **Hint exhausted or locked:** 409.
- **Missing numeric data (null box_office / imdb):** tile renders `—`, always gray, excluded from comparisons.
- **Catalog typos:** `pg_trgm` similarity threshold; `title_alternates` column handles common misspellings and transliteration variants.

---

## 8. Content Pipeline

Puzzle quality is as important as code quality. A beautiful game with bad puzzles dies in a week.

### 8.1 One-time bootstrap (built as part of v1)
1. `scripts/import-tmdb.ts` — Pulls Hindi-language films from TMDB (`with_original_language=hi`, filtered by vote count / release year). Rate-limited, resumable. Produces staging CSV.
2. `scripts/enrich-wikipedia.ts` — For each film, fetches Wikipedia infobox for missing fields (box office in ₹ cr, music directors, banner). Sets `data_quality` accordingly.
3. **Manual curation** (Om + Claude together): spreadsheet review of ~3,000 candidate films. Fix wrong box-office figures, write trivia, add `where_to_watch_url`, write three hint variants, assign to Easy/Medium/Hard pools. Realistically 2–4 weeks of focused work.
4. `scripts/load-movies.ts` — Idempotent load of curated CSV into Postgres.
5. `scripts/compute-edges.ts` — Precomputes `director_edges` and `music_director_edges`. Nightly cron rebuilds.

### 8.2 Launch pool targets
Floors below which we delay launch rather than ship:
- Easy: 200 films (≈6 months of unique daily puzzles).
- Medium: 500 films.
- Hard: 800 films.

### 8.3 Ongoing scheduling
`/admin` page (Supabase magic-link auth, curator-only) lets the curator:
- View the next 30 days per difficulty.
- Drag films onto dates.
- See which films are used recently (soft rule: warn if same director/lead actor in last 7 days — not enforced).
- Flag films needing more data (filter by `data_quality='partial'`).

No auto-scheduling in v1. Manual curation is a feature, not a bug.

---

## 9. Testing (robustness is a first-class requirement)

Three layers. All new game-logic units written TDD-first per `superpowers:test-driven-development`. A flaky test is a bug, not a nuisance — fix it, don't retry it.

### 9.1 Unit tests (Vitest)
- `lib/tiles.ts` — exhaustive per-tile tests. Every rule (green/yellow/gray boundary) gets a focused test. Property-based tests for symmetry (A vs B same color as B vs A) and null-handling.
- `lib/difficulty.ts` — pool filtering, autocomplete scoping, hint tier selection.
- `lib/streaks.ts` — streak advance, break, 3× Hard display, cross-day correctness via faked IST clock.
- `lib/dateIst.ts` — the one place IST date math lives; tested across DST edges and timezone boundaries.
- `lib/share.ts` — emoji grid serialization, redacted share-page rendering.

### 9.2 Integration tests (Vitest + Supabase local via Docker)
- `/api/puzzle` — returns correct puzzle, never leaks `movie_id` in any shape, idempotent on repeat.
- `/api/guess` — correct tiles end-to-end, rejects after `outcome != in_progress` (409), rejects out-of-pool movies (400), atomic update of `plays` + `streaks`.
- `/api/hint` — 2-max enforced, correct tier text returned, 409 on exhaustion or lock.
- `/api/finish` — returns answer only after `outcome` is terminal.
- `/api/catalog` — fuzzy match works for common typos and transliteration variants.
- Resume flow: start → 3 guesses → drop session → return → identical state.
- RLS integration test: attempt to read `daily_puzzles.movie_id` with anon key → must fail.

### 9.3 E2E tests (Playwright)
- Happy path per difficulty (play, win, see result).
- Lose path (10 wrong guesses, see trivia + where-to-watch).
- Share URL opens correctly for played-today and not-played-today recipient.
- Keyboard-only playthrough.
- Mobile viewport (390×844) and desktop (1280×800) both render correctly.
- Hint button lock → unlock sequence across guesses.
- Resume: close tab mid-game, reopen, state preserved.
- Dark mode toggle persists across reload.

### 9.4 Coverage targets
- `lib/*` modules: ≥ 95% line coverage, 100% branch coverage on tile rules.
- `/api/*` routes: all paths exercised by integration tests.
- E2E: every user-visible flow listed in §9.3.

### 9.5 CI
- Lint + typecheck + unit + integration on every PR (blocking).
- E2E on preview deploys (non-blocking initially; promote to blocking once stable).
- No merge to `main` with failing tests. No `--skip-ci`, no commented-out tests, no `.skip` without an issue number.

---

## 10. Operations

### 10.1 Environments
- **local:** Supabase local via Docker, `.env.local`.
- **preview:** every PR → Vercel preview + dedicated Supabase project (free tier).
- **production:** Vercel production + one Supabase project.

### 10.2 Secrets
- `SUPABASE_SERVICE_ROLE_KEY`, `TMDB_API_KEY` — Vercel env vars only; never committed; never in client bundle.
- Service-role key only in `/api/*` routes. Client uses anon key, which cannot read `daily_puzzles.movie_id`.

### 10.3 Observability
- Vercel logs + analytics (free tier adequate for v1).
- Supabase dashboard for DB health.
- Structured `console.error` with context (puzzleId, redacted playerId).
- `/api/health` endpoint pinged hourly by UptimeRobot (free tier).

### 10.4 Deploy
- Trunk-based: `main` → auto-deploys to production.
- All work on branches, PR-reviewed, merged after CI passes.
- No `--no-verify`, no `--force` to main.

### 10.5 Legal / policy
- **TMDB attribution:** required by TOS; include "Movie data from TMDB" line in How-to-play sheet.
- **Posters:** served from TMDB CDN, not re-hosted; placeholder fallback on takedown.
- **Trivia:** written originally; no verbatim Wikipedia prose.
- **Sensitive content:** curate conservatively in v1; "sensitive content" tag added in v1.1.
- **Cookies:** first-party only, no PII, no third-party trackers → likely no banner needed; revisit if we add analytics with cookies.

---

## 11. Risks

1. **Curation runs long.** Likeliest schedule risk. Mitigation: launch with reduced pool floors (Easy 100 / Medium 250 / Hard 400) and grow weekly post-launch.
2. **TMDB data gaps on pre-2000s films.** Hard pool especially exposed. Mitigation: Wikipedia enrichment + manual input; some beloved classics may be excluded until data appears.
3. **Mobile autocomplete UX.** Devanagari + Hinglish + transliteration + typos is harder than Wordle's 5-letter keyboard. Mitigation: `pg_trgm` + `title_alternates` + explicit test cases.
4. **Daily cadence demands reliability.** Missing puzzle at 00:00 IST = bounced players. Mitigation: pre-scheduled puzzles set at least a week ahead + hourly health check pinging puzzle endpoint.
5. **Cookie-based identity is fragile.** Clearing cookies loses the streak. Accepted for v1; v3 accounts solve this.
6. **No anti-cheat beyond server-side answer.** A determined player could play the same puzzle multiple times via multiple cookies/browsers. Acceptable for v1; account-based rate limits land with v3.

---

## 12. Open questions (for later, not blocking v1)

- Which movies seed the Easy pool at launch? (Curator decides during content pipeline work.)
- Final color palette and type pairing — placeholders now, design pass before launch.
- Specific trivia tone — playful? informative? regional-reference-heavy? Decide during curation.
- When do we add the "sensitive content" tag? (Target: v1.1.)

---

## 13. Out-of-scope reminders

Items users or future-us may ask for; explicitly deferred:
- Social login / accounts.
- Audio clips (song intro, dialogue).
- Leaderboards, friend duels.
- Collectibles, badges, trivia unlocks.
- Native app.
- Monetisation (ads, subscriptions, paid tier).
- Analytics beyond Vercel defaults.
- Automated puzzle scheduling.
- Multi-language UI (v1 ships English UI only; movie data includes Devanagari for search).

---

*End of spec.*
