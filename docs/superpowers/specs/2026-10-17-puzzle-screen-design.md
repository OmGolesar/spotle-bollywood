# Puzzle Screen — Bollywood Redesign PR 3

**Status:** Design spec, authored 2026-10-17.
**Parent spec:** [`2026-10-08-bollywood-redesign-design.md`](./2026-10-08-bollywood-redesign-design.md) — overall identity.
**Prior PR specs:** [loading screen](./2026-10-10-loading-screen-design.md), [home screen](./2026-10-17-home-screen-design.md).
**Design authority:** parent spec §5.2 "Puzzle screen" + the end-to-end mockup §02 "Puzzle screen (mid-game)".
**Target branch:** `bollywood-pr3-puzzle-screen` (stacked on `bollywood-pr2-home-screen`).

---

## 1. Intent

The gameplay surface is where players spend the most time. Today it uses the original "understated indie" palette (`--accent`, `--tile-green`, `--tile-yellow`, `--tile-gray`) and Fraunces/Inter — none of the Bollywood identity we built in PRs 1 and 2. Players bounce from the loading screen's cinema-hall indigo → bold home with Yatra One + mustard pills → a puzzle screen that looks like a different product. PR 3 fixes that.

The goal: a disciplined cream-paper puzzle surface that reads as the same product as the loading + home, keeps every player interaction scannable during ten rapid guesses, and preserves the server-authoritative game logic exactly as-is.

## 2. Scope

**In scope:**
- Visual restyle of every puzzle component: `PuzzleScreen`, `GuessAutocomplete`, `GuessCard`, `HintSheet`, `ResultScreen`, `PuzzleTips`, and the inline error / loading / confirm-give-up / end-of-round-banner surfaces inside `PuzzleScreen`.
- New puzzle-screen shell: cream `--paper` background with 3% grain overlay, slim header, bilingual accents where natural.
- Tile color-token swap: `--tile-green → --teal`, `--tile-yellow → --mustard`, `--tile-gray → --matchbox-red` — a rename only; `TileState.color` field keeps its `"green" | "yellow" | "gray"` values from `src/lib/types.ts`. The mapping lives in the puzzle components, not in `lib/tiles.ts`.
- New puzzle-screen primitives in `frontend/components/puzzle/`:
  - `PuzzleShell.tsx` — cream surface + grain overlay + slim header + body container, consumed by `PuzzleScreen`.
  - `PuzzleStatusBar.tsx` — header with hints button (left), bilingual "GUESS N · अनुमान" counter (center), give-up button (right), streak chip (far right when > 0).
  - `MysteryPoster.tsx` — framed blurred poster with star-border corners, bigger than today (160–200px desktop, 128–144px mobile).
  - `GuessInput.tsx` — thin Bollywood-styled wrapper around the existing `GuessAutocomplete` (which keeps its ARIA, keyboard nav, debounced search, AbortController — all untouched).
  - `EndOfRoundBanner.tsx` — paper banner with teal frame when won, charcoal frame when lost, "View summary →" mustard pill.
  - `ConfirmGiveUpSheet.tsx` — paper modal with star-border corners, "Keep guessing" outline / "Give up" matchbox-red pill, Esc dismisses.
  - `PuzzleEmptyState.tsx` — the inline helper "Pick any film…" message, Devanagari + English.
  - `PuzzleErrorScreen.tsx` — paper fallback for no_puzzle / backend_not_configured / generic error, consistent with loading-screen voice.
- Restyle `GuessCard.tsx` **in place** in `src/components/` (it's puzzle-only now that PR 2's HowItWorks switched to `DemoGuessCard`). Preserve its public prop API verbatim.
- Restyle `GuessAutocomplete.tsx` **in place** (visual only — all ARIA, keyboard, debounce, abort behavior preserved).
- Restyle `HintSheet.tsx` **in place** — paper sheet with star-border corners.
- Rewrite `ResultScreen.tsx` **in place** — add `Escape`-key dismiss (fix for inconsistency flagged by fork), bilingual celebration headline, sunburst motif on win, cinema-ink on loss.
- Rewrite `PuzzleTips.tsx` **in place** — keep carousel behavior (10 tips, prev/next, dots), **disable auto-advance** (currently 5s; competes with gameplay per fork's audit), restyle to paper surface with mustard accents.
- Update `src/components/PuzzleScreen.tsx`: swap monolithic markup for the new primitives, keep every state transition and every API call verbatim.
- Update `e2e/puzzle.spec.ts` and `e2e/hints.spec.ts` selectors to match new DOM. Preserve every behavioral assertion.
- Add one new E2E test for keyboard-only guess submission (Research Focus 3).

**Out of scope:**
- `src/lib/tiles.ts`, `src/lib/types.ts`, `src/lib/hintCategories.ts`, `src/lib/share.ts`, `src/lib/difficulty.ts` — pure logic, untouched.
- `src/app/api/*` routes — untouched.
- `src/app/[difficulty]/page.tsx` SSR shell — untouched (it just renders `<PuzzleScreen>`).
- Streak writes, cookie flow, puzzle scheduling, admin — untouched.
- `src/components/Countdown.tsx` — untouched; `ResultScreen` keeps using it.
- `src/components/home/*`, `src/components/ModeCard.tsx`, `src/app/page.tsx` — PR 2 surfaces, untouched.
- `src/components/SiteHeader.tsx`, `/archive`, `/admin/*` — untouched.
- No new npm dependencies.

## 3. Resolved rulings (settled by author; recorded for review)

| # | Decision | Rationale |
|---|---|---|
| 1 | **GuessCard restyle in place in `src/`** | PR 2's HowItWorks replaced the one shared usage with `DemoGuessCard`. GuessCard is now puzzle-only; no need to migrate the file. |
| 2 | **PuzzleTips auto-advance removed** | Fork's audit called it out — a 5s carousel competing with 10 guesses the player is thinking through is noise. User can still Prev/Next or tab the dots. |
| 3 | **Streak chip added to puzzle header (when > 0)** | Reader loses the context of "what am I defending" during the game. Chip uses `visibleStreak()` from PR 2 (max across modes) so it survives any difficulty. Hidden on all-zero. |
| 4 | **ResultScreen gets `Escape`-key dismiss** | Consistency with HintSheet (which already has it). Fork flagged the inconsistency; user's brief says polish supporting interactions. |
| 5 | **Hint sheet closes on outcome flip** | Fork edge case 6. If outcome transitions to won/lost while sheet is open, close it before `/api/finish` resolves. One-line effect in `PuzzleScreen`. |
| 6 | **Give-up button disabled during an in-flight submit** | Fork edge case 5. Current code lets both POSTs race. Disabling the button when `submitting === true` prevents the race entirely. |
| 7 | **Tile color semantics: component-local token mapping** | Keep `TileState.color: "green" \| "yellow" \| "gray"` from `lib/types.ts` so `lib/tiles.ts` stays untouched. GuessCard and the mockup's tile grid translate those names → `--teal`, `--mustard`, `--matchbox-red` via a tiny lookup. Zero logic risk. |
| 8 | **Devanagari numeral badges on tiles** | Match the mockup's `.hi` corner numerals (१–८ in Yatra One, 10% opacity). Decorative only — no screen-reader exposure (aria-hidden). |
| 9 | **Bilingual chrome: English leads, Devanagari where it enhances** | Readability-first for ten rapid guesses. "GUESS 3 · अनुमान" counter, "आज की फ़िल्म पहचानिए" input placeholder; everything else English-primary. |
| 10 | **Mystery poster size bump** | Fork #7 complaint. Current `w-32` (128px) is too small for a reveal mechanic. New: `clamp(140px, 32vw, 200px)` with a star-border frame + grain. |
| 11 | **No-poster fallback** | SVG placeholder with a film-strip glyph on muted paper; shown when `movie.posterUrl` is falsy. Fork edge case 9. |
| 12 | **Keyboard-only submission** | Keep `GuessAutocomplete`'s existing ARIA + keyboard behavior exactly. Add an E2E that tabs to combobox → types → ArrowDown → Enter → asserts the guess landed. Fork edge case 3. |
| 13 | **Long film titles** | Every tile `.value` and GuessCard title use `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis`. Multi-line clamp on the GuessCard header (2 lines max). |
| 14 | **Mobile virtual-keyboard dropdown clip** | Fork #4. Autocomplete listbox `max-height: min(50vh, 320px)`. Position inside the normal flow (not fixed overlay), so the browser's own keyboard-aware scrolling keeps it visible. |
| 15 | **PuzzleTips demoted below the fold, visually quieter** | Keep it, but render below the guess list in a muted paper tone. Not a competing CTA. |
| 16 | **Loading / error / backend-not-configured screens** | Not a plain centered gray line any more. They render in `PuzzleErrorScreen` on the same cream shell with a star-border frame and bilingual messaging. |

## 4. Visual system (extends PR 2's tokens)

No new tokens needed; everything PR 2 shipped in `frontend/styles/bollywood-tokens.css` is reused. New puzzle-scoped CSS lives in a new `frontend/styles/puzzle.css` file, imported from `src/app/globals.css`.

**Tile color mapping (component-local, in `frontend/components/puzzle/tileColor.ts`):**
```ts
export const TILE_COLOR_VAR: Record<TileColor, string> = {
  green: 'var(--teal)',
  yellow: 'var(--mustard)',
  gray: 'var(--matchbox-red)',
};
```

**Puzzle surface:**
- Background: `--paper` with 3% multiply grain overlay (reuse `.bw-grain-paper`).
- Text: `--charcoal`.
- Frames: star-border corner stars + double-rule borders in `--matchbox-red` on cards; mustard details on CTA pills.
- Shadow language: soft drop-shadow instead of hard borders where the paper edge is natural.

**Typography:**
- Display (headers, section labels): Yatra One.
- UI (buttons, labels, input): Anek Devanagari.
- Tile values + Devanagari numerals: Yatra One.
- Baloo Bhai 2 reserved for small chips (streak chip, countdown).

## 5. UI composition (section by section)

### 5.1 Puzzle shell (`PuzzleShell`)

```
┌─────────────────────────────────────────┐
│ ★ PUZZLE STATUS BAR (sticky top)        │  ← cream, 2px charcoal bottom-rule
├─────────────────────────────────────────┤
│                                           │
│         [ MysteryPoster (framed) ]      │
│                                           │
│         [ GuessInput ]                   │
│         [ empty-state helper ]           │
│                                           │
│   [ EndOfRoundBanner — when won/lost ]  │
│                                           │
│   ┌───────────────────────────────┐     │
│   │ GuessCard (latest, star frame) │     │
│   └───────────────────────────────┘     │
│   ┌───────────────────────────────┐     │
│   │ GuessCard (prev)                │     │
│   └───────────────────────────────┘     │
│   ...                                     │
│                                           │
│   [ PuzzleTips — muted, below fold ]    │
└─────────────────────────────────────────┘
```

### 5.2 Status bar (`PuzzleStatusBar`)

Three-column grid at desktop, two-row at `<= 480px`:

- Left: `💡 Hints` button, matchbox-red outlined pill. Count badge in mustard when `hintsLeft > 0`.
- Center: back-arrow link to `/`, difficulty label (`Easy · आसान`), guess counter below (`GUESS 3 · अनुमान of 10`).
- Right (desktop) / top-right (mobile): give-up button (`⚑ Give up`), optional streak chip (`★ 5`) tucked to its left.
- Height: 64px desktop, 56px mobile.
- Border bottom: 2px solid `--charcoal`.

### 5.3 Mystery poster (`MysteryPoster`)

- Wrapper: `clamp(140px, 32vw, 200px)` wide, aspect 2:3.
- Frame: 3px solid `--charcoal` + 4 star-border corner glyphs in `--matchbox-red` (reuse the pattern from `end-to-end.html` `.poster-frame`).
- Blur: inline `filter: blur(${posterBlurPx}px)` + 400ms transition (unchanged behavior).
- No-poster fallback: SVG film-strip icon on muted paper.
- Spacing: 24px top from status bar, 20px bottom to input.

### 5.4 Guess input (`GuessInput` wraps `GuessAutocomplete`)

- Input container: paper, 2px `--charcoal` border, 12px radius.
- Focus ring: 3px rgba mustard glow.
- Placeholder: "Guess a Hindi film…"
- Below input, when `guesses.length === 0`: `PuzzleEmptyState` with "★ Pick any film. Each guess reveals comparison tiles and un-blurs the poster." + Devanagari sub.
- Submit action: fires on autocomplete selection (existing behavior).
- Dropdown: `max-height: min(50vh, 320px)`, scrollable, listbox items with poster thumb + title + year.

### 5.5 End-of-round banner (`EndOfRoundBanner`)

- Won: `--paper` background with teal border, teal text "शाबाश · Solved in {N} {guess|guesses}". Right side: mustard "View summary →" pill.
- Lost: `--paper` background with charcoal border, charcoal text "फिर कल · Out of guesses". Same CTA.
- Only renders when `outcome !== 'in_progress' && answer`.

### 5.6 Guess cards (restyled `GuessCard`)

Keep its props and layout structure (poster + title + 8-tile grid + 2 PeopleRow blocks). Visual changes only:

- Card wrapper: `--paper`, 2px `--charcoal` border, 14px radius, 4 small `★` corner glyphs in `--matchbox-red`, 16px padding.
- Header row: 48×72 poster thumb (left), title/year (right).
- Tile grid: switch to **1×8 horizontal row** on desktop ≥720, **4×2 grid** on mobile. Each tile:
  - 2px charcoal border + rounded 7px.
  - Background: teal / mustard / matchbox-red via `TILE_COLOR_VAR`.
  - Label: Anek 9px uppercase, color-contrast-aware.
  - Value: Yatra One 12px, 1-line ellipsis.
  - Arrow: `↑` or `↓` next to value when `TileState.arrow` set.
  - Corner Devanagari numeral १–८ at 10% opacity (aria-hidden).
- PeopleRow blocks: 48×48 portraits with Devanagari numeral badges (`१`, `२`, `३`) corner-overlayed on each portrait. Keep TMDB images + name labels.
- Latest-guess animation: 180ms fade+translateY(8px) (preserve `animate={isLatest}` flag).

### 5.7 HintSheet restyle

- Sheet: `--paper` with 3px charcoal border + 4 star corners (mobile bottom sheet, desktop centered 480px modal).
- Title: "Choose a hint · एक संकेत चुनिए" in Yatra One.
- Three category cards: paper surface with mustard icon + label (Yatra One) + description (Anek). Locked/revealed/available states retained.
- Close + Esc + body-overflow-lock behavior preserved exactly.
- `role="dialog"` with existing `aria-labelledby` preserved — E2E depends on name match `/Choose a hint/`.

### 5.8 ResultScreen restyle

Full-screen modal (`fixed inset-0 z-40`).

- Won variant: cream `--paper` canvas with soft radial sunburst (CSS conic-gradient, mustard ~22% alpha) behind the revealed poster. Headline: `शाबाश! · Solved!` (Yatra One 48px desktop, 36px mobile) + sub `In {N} {guess|guesses}` (Anek). Streak + countdown row preserved. Share button: matchbox-red pill. Cross-sell to other modes preserved.
- Lost variant: `--ink` canvas with grain. Headline: `फिर कल · Game over`. Poster framed by mustard star border. Same stats + share + cross-sell.
- **Add `Escape`-key dismiss** (new behavior).
- Preserve `role="dialog"`, `aria-labelledby="result-title"` — E2E selector `/Solved!|Game over/` depends on it.
- Preserve share flow (`buildShareText`, `emojiGrid`, native/whatsapp/clipboard) — tests assert `/Share result/` + emoji grid.
- `Close summary` button (aria-label kept) — E2E depends on it.

### 5.9 Confirm give-up (`ConfirmGiveUpSheet`)

- Modal: paper, star-border corners, 420px max-width.
- Title: `Give up this puzzle? · छोड़ देंगे?` in Yatra One.
- Body: "You'll see today's answer and your streak will reset."
- CTAs: `Keep guessing` outline charcoal pill, `Give up` matchbox-red solid pill.
- `role="dialog"` with `aria-label="Confirm give up"` preserved — E2E dependency.

### 5.10 PuzzleTips (`PuzzleTips`)

- Rendered below the guess list in a `.bw-section`-like container with muted paper tint.
- 10 existing tips preserved verbatim.
- Prev/next arrow buttons + dot indicators preserved.
- **Auto-advance removed**: no timer.
- Visual: compact card (max-width 560px), Yatra One tip title + Anek body, mustard dot indicators.

### 5.11 Loading / error states (`PuzzleErrorScreen`)

All four states (`loading`, `no_puzzle`, `backend_not_configured`, `other-error`) render the same shell: cream paper surface + star-border frame + bilingual headline + copy + "Back to home" or "Retry" matchbox-red pill. Replaces the current centered gray text block.

## 6. Preserved behavior (acceptance checklist)

Must still work exactly as it does today:

- [ ] `/api/puzzle` initial GET on mount, state flows into `loading → in_progress|won|lost`.
- [ ] If outcome !== in_progress on load, auto-call `/api/finish` to populate `answer` + `streakAfter` (but DO NOT auto-open ResultScreen).
- [ ] `GuessAutocomplete`: debounced `/api/catalog` with AbortController, keyboard nav (ArrowUp/Down/Enter/Escape), `aria-activedescendant`, `aria-expanded`, click-outside dismiss via blur-delay.
- [ ] `handlePick(opt)` posts `/api/guess`, appends to `guesses`, updates `posterBlurPx` + `hintState` + `outcome`; `submitting` flag prevents double-submit; `disabledIds` prevents re-picking an already-guessed film.
- [ ] `/api/hint` POST on category pick; `hintBusy` tracked per category.
- [ ] `/api/giveup` POST on confirm; forces `outcome='lost'`, `posterBlurPx=0`; auto-calls `/api/finish`.
- [ ] ResultScreen only opens on user click of "View summary →" — never automatically.
- [ ] Streak written server-side; client reads from `/api/finish` response.
- [ ] GuessCard `aria-label="Guess N: Title"` preserved (E2E dependency).
- [ ] Share flow (`navigator.share` → whatsapp → clipboard) preserved.
- [ ] `TOTAL_GUESSES=10`, `MAX_HINTS=2`, `HINT_UNLOCKS=[3,6]` imports untouched.
- [ ] `compareMovies` + `TILE_ORDER` + `TileState.chipColors` consumed as-is.
- [ ] `/[difficulty]/page.tsx` SSR shell untouched.

## 7. Testing

### E2E updates (`e2e/puzzle.spec.ts`, `e2e/hints.spec.ts`)

Selector updates (behavioral assertions preserved verbatim where possible):
- `label=/10 guesses remaining/` → `label=/^10 guesses remaining$/i` on the counter wrapper (keep accessible name intact).
- `button=/Open hints/` → same, but on the new `.bw-hint-btn` class if we need an alternative selector.
- `text=/Pick any film/` → same (copy preserved in `PuzzleEmptyState`).
- `heading level=3 name=/Lagaan/` → same (GuessCard title unchanged).
- Give-up dialog `name=/Confirm give up/` → same aria-label preserved.
- HintSheet dialog `name=/Choose a hint/` → same.
- ResultScreen dialog `name=/Solved!|Game over/` → same.

### New E2E test (keyboard-only guess)

In `e2e/puzzle.spec.ts`, add: tab to combobox → type "lag" → ArrowDown → Enter → assert `/Guess 1: Lagaan/` label appears.

### New unit tests

- `frontend/components/puzzle/tileColor.test.ts` — maps `"green" → var(--teal)` etc.
- `frontend/components/puzzle/MysteryPoster.test.tsx` — renders fallback when posterUrl falsy, applies blur style.
- `frontend/components/puzzle/EndOfRoundBanner.test.tsx` — won/lost variants render correct copy + border color.
- Any new puzzle primitive created in `frontend/components/puzzle/`.

## 8. Isolation guarantees

- [ ] `/api/*` routes untouched.
- [ ] `src/lib/{tiles,types,hintCategories,share,difficulty,server/*,playerCookie}.ts` untouched.
- [ ] `src/app/[difficulty]/page.tsx` untouched.
- [ ] `src/components/{SiteHeader,ThemeToggle,Countdown}.tsx` untouched.
- [ ] `src/components/home/*`, `src/components/ModeCard.tsx`, `src/app/page.tsx` (home) untouched.
- [ ] No new npm dependencies.
- [ ] CSS additions in a new file `frontend/styles/puzzle.css`, imported from `globals.css`. No existing CSS rules deleted.

## 9. Resolved rulings (post builder-check)

Builder review surfaced 4 planner blockers. Resolutions below are now authoritative.

| # | Question | Resolution |
|---|---|---|
| 17 | `/archive` collateral damage from in-place restyle of GuessCard / HintSheet / ResultScreen / PuzzleTips | **Accept half-redesigned `/archive` this PR; dedicated PR 4 restyles `ArchivePuzzleScreen` shell.** No real user is on prod during the UI series. Vercel previews will show the mixed state, which is expected. |
| 18 | Streak chip data source on puzzle header | **Dropped entirely.** This was author-invented from reviewer feedback, not in the original brief. Streak remains visible on the home `ModeCard` and in `ResultScreen` after each round. Can be reintroduced in a focused later PR if it feels missing. Ruling 3 above is superseded by this one — remove the streak chip from `PuzzleStatusBar`. |
| 19 | Shell layering for loading / error / confirm states | **`PuzzleShell` accepts `chrome: 'full' | 'none'` prop (default `'full'`).** Error/loading screens render with `chrome: 'none'` — just the cream surface + grain + inner error card. `ConfirmGiveUpSheet` continues to use the existing `bg-black/40` dim backdrop over the shell; no grain-over-grain layering. |
| 20 | Latest-card differentiated frame | **All `GuessCard`s render identically.** The §5.1 ASCII sketch was imprecise; the mockup confirms uniform treatment. No `GuessCard` prop surface needed. The `isLatest` flag continues to control only the entrance animation (fade+translateY on mount), not any chrome difference. |

**Downstream edits in this spec:**
- §3 ruling 3 (streak chip) is withdrawn; §5.2 PuzzleStatusBar renders only hints-left / counter / give-up (no chip).
- §5.1 ASCII shows "GuessCard (latest, star frame)" — treat the "star frame" qualifier as applying uniformly to all cards.
- §5.11 PuzzleErrorScreen renders `<PuzzleShell chrome="none">` + inner error card.
- `/archive` is explicitly flagged as a visual follow-up (PR 4).

## 10. Rollout

- Branch `bollywood-pr3-puzzle-screen` stacked on `bollywood-pr2-home-screen`.
- CI workflow (added in PR 2) runs on every push.
- Vercel preview on every push shows loading screen → new home → new puzzle, the integrated experience.
- No merge to `main` until the full redesign series is approved.
