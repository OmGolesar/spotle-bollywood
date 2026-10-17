# Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the approved end-to-end mockup's home screen into real Next.js code on top of the existing component architecture, matching the loading screen's Bollywood identity, preserving all game functionality.

**Architecture:** Shared palette tokens and reusable primitives live in `frontend/`. Existing home components in `src/components/home/*` and `src/components/ModeCard.tsx` are restyled in place. The home page (`src/app/page.tsx`) replaces its SiteHeader usage with an inline util bar and composes the rotating-poster hero, mode cards, info strips, how-it-works, attributes, FAQ, final CTA, and footer per the mockup. `/auth/callback` passthrough and server-side streak reads preserved verbatim.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 (@theme inline) · Vitest + @testing-library/react + jsdom · Playwright · next/font/google (Yatra One already loaded by PR 1; adding Anek Devanagari + Baloo Bhai 2).

**Spec:** `docs/superpowers/specs/2026-10-17-home-screen-design.md`

## Global Constraints

- All new UI code lives under `frontend/`. Existing home components restyled **in place** in `src/`.
- No existing file in `src/app/api/`, `src/lib/`, `src/components/GuessAutocomplete.tsx`, `src/components/HintSheet.tsx`, `src/components/PuzzleScreen.tsx`, `src/components/ResultScreen.tsx`, `src/components/SiteHeader.tsx`, or `src/components/ThemeToggle.tsx` is modified.
- No new npm dependencies.
- Node 24 LTS.
- Palette tokens (hex values) copied verbatim from the parent redesign spec: `--ink #2B2250`, `--ink-deep #1C1639`, `--paper #F5EDD9`, `--matchbox-red #D63024`, `--mustard #F2B01E`, `--pink #E8328A`, `--royal #2E52A6`, `--teal #0E7E7E`, `--charcoal #1A1612`, `--paper-dim #857C65`, `--paper-mute #C9BFA5`.
- Fonts (free Google Fonts): Yatra One (already loaded), Anek Devanagari, Baloo Bhai 2. All via `next/font/google`.
- Hero rotation: 5000ms interval, 900ms crossfade, 6 posters, title-logo.png is slide 1 + reduced-motion fallback.
- Hero poster size cap: `min(50vh, 440px)` desktop, `min(44vh, 380px)` mobile, aspect-ratio `1134 / 1340`.
- Util-bar streak chip: shows **Easy streak** when any mode streak ≥ 1, hidden when all three are 0.
- Hero PLAY button → `/easy`. Difficulty chips → `/easy|/medium|/hard` direct links. No stateful selector.
- Final CTA label (verbatim): `▶ PLAY TODAY'S FILM · खेलें` → `/easy`.
- Mockup copy verbatim where mockup specifies new strings; existing prod copy preserved where mockup did not change it.
- No change to Vercel deploy, env vars, Supabase schema.
- Branch stacks on `bollywood-pr1-loading-screen`; the CI workflow (added in commit `55519e8`) runs on every push.
- Per user memory `feedback_no_claude_attribution`: no Co-Authored-By or Generated-with lines in commits or PR body.

## Review Focus

Edge cases the spec implies that need explicit tests:

1. **All three streaks are zero** → util-bar chip must not render. Pinned in Task 9 (page.tsx) via server-render snapshot assertion + Task 10 E2E.
2. **A hero poster image 404s** (e.g. filename typo, missing copy from assets/) → BollywoodHero stays usable: broken slide is skipped or the carousel keeps cycling. Pinned in Task 3.
3. **`prefers-reduced-motion` set** → BollywoodHero shows title-logo only, no interval timer, no dots. Pinned in Task 3.
4. **`/auth/callback` passthrough with `?code=X`** → home page redirects to `/auth/callback?code=X&next=/admin` before rendering anything else. Pinned in Task 9.
5. **`HowToPlaySheet` trigger consumed by info-strip** → new optional `triggerClassName` prop defaults to current prod styling; passing it changes only the trigger button's class. Pinned in Task 8.

---

### Task 1: Foundation — tokens, fonts, posters, globals

**Files:**
- Create: `frontend/styles/bollywood-tokens.css`
- Modify: `frontend/styles/loading.css` (remove the palette lines promoted into bollywood-tokens; keep loading-specific rules)
- Modify: `src/app/globals.css` (add `@import "../../frontend/styles/bollywood-tokens.css";` at the top)
- Modify: `src/app/layout.tsx` (add `Anek_Devanagari` and `Baloo_Bhai_2` next/font variables alongside existing Yatra_One)
- Create: `public/home/title-logo.png`, `public/home/poster-01-retro.png`, `public/home/poster-02-halftone.png`, `public/home/poster-03-rose.png`, `public/home/poster-04-matchbox.png`, `public/home/poster-05-devanagari.png` (copied from `assets/`)

**Interfaces:**
- Produces: CSS custom properties `--ink`, `--ink-deep`, `--paper`, `--matchbox-red`, `--mustard`, `--pink`, `--royal`, `--teal`, `--charcoal`, `--paper-dim`, `--paper-mute` at `:root`. CSS classes `.bw-eyebrow`, `.bw-pill-mustard`, `.bw-pill-outline-ink`, `.bw-pill-outline-paper`, `.bw-info-strip`, `.bw-grain-ink`, `.bw-grain-paper`, `.bw-section-head`. CSS variables `--font-anek-devanagari`, `--font-baloo-bhai-2` on `<html>`.
- Produces: static assets at `/home/title-logo.png` and `/home/poster-0[1-5]-*.png` served by Next.js.

- [ ] **Step 1: Copy posters into `public/home/`**

```bash
mkdir -p "public/home"
cp "assets/title-logo.png" public/home/title-logo.png
cp "assets/Bollywood Spottle Retro Poster.png" public/home/poster-01-retro.png
cp "assets/Retro Bollywood Halftone Poster.png" public/home/poster-02-halftone.png
cp "assets/Retro Bollywood Rose Poster.png" public/home/poster-03-rose.png
cp "assets/Vintage Bollywood Matchbox Poster.png" public/home/poster-04-matchbox.png
cp "assets/बॉलीवुड स्पॉटल रेट्रो पोस्टर.png" public/home/poster-05-devanagari.png
```

- [ ] **Step 2: Write `frontend/styles/bollywood-tokens.css`**

Contents: `:root { --ink: #2B2250; --ink-deep: #1C1639; ... }` with all 11 tokens listed in Global Constraints. Then the shared classes:
- `.bw-eyebrow` — Anek Devanagari 600, 11px, letter-spacing .26em, uppercase, color `--paper-mute` by default.
- `.bw-pill-mustard` — mustard background, Yatra One text, `--charcoal` color, pill shape, box-shadow with mustard glow (match the mockup values from `end-to-end.html` `.pill-mustard`).
- `.bw-pill-outline-ink` — paper color text on transparent, 1px border rgba(245,237,217,.25), rounded-full, hover darkens.
- `.bw-pill-outline-paper` — mirrored for paper surfaces.
- `.bw-info-strip` — flex strip with background rgba(245,237,217,.04), border rgba(245,237,217,.14), rounded 14px.
- `.bw-grain-ink` and `.bw-grain-paper` — `position: absolute; inset: 0; pointer-events: none;` grain overlays with the SVG `feTurbulence` noise (same recipe as `loading.css`, 5% opacity overlay for ink, 3% multiply for paper).
- `.bw-section-head` — flex column, centered, gap 14px (used by every section headline block).

Values for all above are in `end-to-end.html` — copy verbatim.

- [ ] **Step 3: Trim `frontend/styles/loading.css` to loading-specific rules**

Delete the palette variables lines at the top (now in bollywood-tokens.css). Keep `.loading-overlay`, `.loading-title`, `.loading-video`, `.loading-overlay-wrap` rules.

- [ ] **Step 4: Import tokens from `src/app/globals.css`**

Add as the first line after any existing `@import` statements:
```css
@import "../../frontend/styles/bollywood-tokens.css";
```

- [ ] **Step 5: Add Anek Devanagari + Baloo Bhai 2 fonts in `src/app/layout.tsx`**

Signatures:
```ts
const anek = Anek_Devanagari({ variable: "--font-anek-devanagari", subsets: ["latin", "devanagari"], display: "swap", weight: ["400","500","600","700"] });
const baloo = Baloo_Bhai_2({ variable: "--font-baloo-bhai-2", subsets: ["latin", "devanagari"], display: "swap", weight: ["500","700"] });
```
Add both `.variable` values to the existing `<html className={...}>` string alongside `yatraOne.variable`.

- [ ] **Step 6: Run `npx tsc --noEmit` and `npm test`**

Expected: TypeScript clean. Vitest 76/77 (pre-existing tiles failure unchanged).

- [ ] **Step 7: Commit**

```bash
git add frontend/styles/bollywood-tokens.css frontend/styles/loading.css \
        src/app/globals.css src/app/layout.tsx public/home/
git commit -m "chore(home): promote palette tokens, add Anek + Baloo fonts, stage posters"
```

---

### Task 2: StarRail motif component

**Files:**
- Create: `frontend/components/motifs/StarRail.tsx`
- Create: `frontend/components/motifs/StarRail.test.tsx`

**Interfaces:**
- Produces: `<StarRail side="left" | "right" count={7} />` — vertical column of star glyphs flanking the hero. Default count 7. CSS class `.bw-star-rail`. Uses `--mustard` color. Hidden on viewports < 720px via `display: none` media query.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StarRail } from './StarRail';

describe('StarRail', () => {
  it('renders N star spans when count is passed', () => {
    const { container } = render(<StarRail side="left" count={5} />);
    expect(container.querySelectorAll('.bw-star-rail > span').length).toBe(5);
  });
  it('defaults to 7 stars when count omitted', () => {
    const { container } = render(<StarRail side="right" />);
    expect(container.querySelectorAll('.bw-star-rail > span').length).toBe(7);
  });
  it('applies side-specific class', () => {
    const { container } = render(<StarRail side="right" />);
    expect(container.querySelector('.bw-star-rail')?.classList.contains('is-right')).toBe(true);
  });
});
```

- [ ] **Step 2: Run `npx vitest run frontend/components/motifs/StarRail.test.tsx` — FAIL (module not found)**

- [ ] **Step 3: Implement `StarRail({ side: 'left'|'right', count?: number }): JSX.Element` in `frontend/components/motifs/StarRail.tsx`**

Renders `<aside aria-hidden className={"bw-star-rail is-" + side}>` with `count` (default 7) `<span>★</span>` children. Append CSS rules for `.bw-star-rail` to `frontend/styles/bollywood-tokens.css` (position: fixed, top 50%, translateY -50%, display flex column, gap 16px, color var(--mustard), opacity .5, pointer-events none, z-index 1, `clamp(20px,3vw,40px)` from edge; `@media (max-width: 720px) { display: none }`).

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/motifs/StarRail.tsx frontend/components/motifs/StarRail.test.tsx \
        frontend/styles/bollywood-tokens.css
git commit -m "feat(home): add StarRail motif component"
```

---

### Task 3: BollywoodHero component (TDD, Review Focus 2 + 3)

**Files:**
- Create: `frontend/components/home/BollywoodHero.tsx`
- Create: `frontend/components/home/BollywoodHero.test.tsx`

**Interfaces:**
- Consumes: `/home/title-logo.png` + 5 posters from Task 1. CSS classes from bollywood-tokens. `useSyncExternalStore` for reduced-motion detection (same React-19-idiomatic pattern used across the project where needed, else fall back to `useEffect` + `useState` matching ThemeToggle style — we're accepting that pattern).
- Produces: `<BollywoodHero />` component. Renders a `<div class="bw-hero-logo">` with 6 `<img>` slides (first `is-active`), 6 dot `<span>` indicators, cycles active slide every 5000ms with crossfade, respects `prefers-reduced-motion`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BollywoodHero } from './BollywoodHero';

describe('BollywoodHero', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders 6 poster slides with the title-logo as the first', () => {
    const { container } = render(<BollywoodHero />);
    const slides = container.querySelectorAll('.bw-hero-logo img');
    expect(slides.length).toBe(6);
    expect((slides[0] as HTMLImageElement).src).toContain('/home/title-logo.png');
  });

  it('starts with the first slide active', () => {
    const { container } = render(<BollywoodHero />);
    expect(container.querySelector('.bw-hero-logo img.is-active')).toBeTruthy();
    expect((container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement).src).toContain('/home/title-logo.png');
  });

  it('advances to slide 2 after 5000ms', () => {
    const { container } = render(<BollywoodHero />);
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).toContain('/home/poster-01-retro.png');
  });

  it('renders 6 dot indicators matching the active slide', () => {
    const { container } = render(<BollywoodHero />);
    expect(container.querySelectorAll('.bw-hero-dots .dot').length).toBe(6);
    expect(container.querySelectorAll('.bw-hero-dots .dot.is-active').length).toBe(1);
  });

  it('respects prefers-reduced-motion — no cycle, no dots', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)', media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    const { container } = render(<BollywoodHero />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(container.querySelector('.bw-hero-logo img.is-active')?.getAttribute('src')).toContain('/home/title-logo.png');
    expect(container.querySelectorAll('.bw-hero-dots').length).toBe(0);
  });

  it('a slide onError skips that slide — carousel continues', () => {
    const { container } = render(<BollywoodHero />);
    const slide2 = container.querySelectorAll('.bw-hero-logo img')[1] as HTMLImageElement;
    act(() => { slide2.dispatchEvent(new Event('error')); });
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).not.toContain('/home/poster-01-retro.png');
  });
});
```

- [ ] **Step 2: Run `npx vitest run frontend/components/home/BollywoodHero.test.tsx` — FAIL (module not found)**

- [ ] **Step 3: Implement `BollywoodHero(): JSX.Element` in `frontend/components/home/BollywoodHero.tsx`**

- `'use client'` directive at top.
- Posters array = exactly: `['title-logo.png','poster-01-retro.png','poster-02-halftone.png','poster-03-rose.png','poster-04-matchbox.png','poster-05-devanagari.png']` with `/home/` prefix.
- `useEffect` sets `reducedMotion` from matchMedia check (match existing project style — accept the `react-hooks/set-state-in-effect` lint, this PR adds 1 more instance of the known-tolerated pattern).
- `useState<Set<number>>` for failed indices from `onError`.
- `setInterval(() => setIdx((i) => nextNonFailed(i)), 5000)` only when `!reducedMotion`. Cleanup on unmount.
- `nextNonFailed(i, failed, length)`: pure helper that returns `(i + 1) % length`, then advances again if that index is in `failed`, loops at most `length` times to avoid infinite loop when all failed.
- Render `<div class="bw-hero-logo">` with 6 `<img src={/home/X} class={i === idx ? 'is-active' : ''} onError={() => addFailed(i)} loading={i === 0 ? 'eager' : 'lazy'}>`; renders `<div class="bw-hero-dots">` with 6 dots ONLY when `!reducedMotion`.

CSS additions to `bollywood-tokens.css`:
- `.bw-hero-logo { position: relative; height: min(50vh, 440px); aspect-ratio: 1134 / 1340; max-width: min(85vw, 400px); filter: drop-shadow(0 24px 48px rgba(0,0,0,.55)); }`
- `.bw-hero-logo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 900ms ease-in-out; }`
- `.bw-hero-logo img.is-active { opacity: 1; }`
- `.bw-hero-dots { display: flex; gap: 7px; justify-content: center; margin-top: 10px; }` and `.bw-hero-dots .dot { width: 6px; height: 6px; border-radius: 999px; background: rgba(245,237,217,.25); transition: all .3s; }` and `.bw-hero-dots .dot.is-active { background: var(--mustard); transform: scale(1.4); }`
- Media query @720px: `.bw-hero-logo { height: min(44vh, 380px); }`

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/BollywoodHero.tsx frontend/components/home/BollywoodHero.test.tsx frontend/styles/bollywood-tokens.css
git commit -m "feat(home): add BollywoodHero rotating-poster component"
```

---

### Task 4: DemoGuessCard component

**Files:**
- Create: `frontend/components/home/DemoGuessCard.tsx`
- Create: `frontend/components/home/DemoGuessCard.test.tsx`
- Modify: `src/components/home/demoCardData.ts` (add Devanagari-numeral and short-form director fields; preserve existing exports)

**Interfaces:**
- Consumes: Props `{ title: string; year: number; director: string; posterLabel: string; posterBg: string; tiles: ReadonlyArray<{ label: string; value: string; color: 'teal'|'mustard'|'red'; devIndex: string; arrow?: 'up'|'down' }> }` — 8 tiles for the mockup's demo-guess block.
- Produces: `<DemoGuessCard {...props} />` component used by HowItWorks (Task 6).

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DemoGuessCard } from './DemoGuessCard';

const PARTIAL = {
  title: 'Lagaan', year: 2001, director: 'A. Gowariker',
  posterLabel: 'LAGAAN', posterBg: '#8b2b2b',
  tiles: [
    { label: 'Director', value: 'A. Gowariker', color: 'mustard', devIndex: '१' },
    { label: 'Cast', value: 'A. Khan', color: 'teal', devIndex: '२' },
    { label: 'Year ↓', value: '2001', color: 'red', devIndex: '३' },
    { label: 'Box office ↑', value: '₹65 cr', color: 'mustard', devIndex: '४' },
    { label: 'Music', value: 'A.R. Rahman', color: 'teal', devIndex: '५' },
    { label: 'Banner', value: 'Aamir Khan Pr.', color: 'red', devIndex: '६' },
    { label: 'Genre', value: 'Drama · Sport', color: 'mustard', devIndex: '७' },
    { label: 'IMDb ↓', value: '8.1', color: 'red', devIndex: '८' },
  ],
} as const;

describe('DemoGuessCard', () => {
  it('renders title, year, director', () => {
    render(<DemoGuessCard {...PARTIAL} />);
    expect(screen.getByText('Lagaan')).toBeTruthy();
    expect(screen.getByText(/2001 · A\. Gowariker/)).toBeTruthy();
  });
  it('renders 8 tiles with correct Devanagari numerals and values', () => {
    const { container } = render(<DemoGuessCard {...PARTIAL} />);
    expect(container.querySelectorAll('.bw-demo-tile').length).toBe(8);
    expect(container.querySelectorAll('.bw-demo-tile')[0].textContent).toContain('१');
    expect(container.querySelectorAll('.bw-demo-tile')[0].textContent).toContain('A. Gowariker');
  });
  it('applies the correct color class per tile', () => {
    const { container } = render(<DemoGuessCard {...PARTIAL} />);
    expect(container.querySelectorAll('.bw-demo-tile')[0].classList.contains('mustard')).toBe(true);
    expect(container.querySelectorAll('.bw-demo-tile')[1].classList.contains('teal')).toBe(true);
    expect(container.querySelectorAll('.bw-demo-tile')[2].classList.contains('red')).toBe(true);
  });
});
```

- [ ] **Step 2: Run `npx vitest run frontend/components/home/DemoGuessCard.test.tsx` — FAIL**

- [ ] **Step 3: Implement `DemoGuessCard(props): JSX.Element` in `frontend/components/home/DemoGuessCard.tsx`**

Markup matches `end-to-end.html` `.demo-guess` block exactly. CSS additions to `bollywood-tokens.css`:
- `.bw-demo-guess` — background `--paper`, color `--charcoal`, border-radius 14px, padding 16px.
- `.bw-demo-guess-head` — flex row, gap 12px, align center, margin-bottom 12px.
- `.bw-demo-poster` — 52×78 rounded box, flex center, color `--paper`, font-size 9px, text-align center.
- `.bw-demo-info .t` Yatra One 17px / `.s` 12px `--paper-dim`.
- `.bw-demo-tiles` — grid 8 cols with 6px gap, 2 col on `<600px`.
- `.bw-demo-tile` — padding 9/10, 7px radius, 2px solid `--charcoal`, min-height ~52px, flex column justify-between.
- `.bw-demo-tile .label` Anek 700, 9px, uppercase, letter-spacing .14em, opacity .85.
- `.bw-demo-tile .val` Yatra One 12px line-height 1.15, overflow hidden ellipsis.
- `.bw-demo-tile.teal { background: var(--teal); color: var(--paper); }` etc. for mustard (charcoal text) and red (paper text).
- `.bw-demo-tile .hi` — absolute top-3 right-5, Yatra One 11px, opacity .35.

- [ ] **Step 4: Add `DEMO_PARTIAL_BW` and `DEMO_WIN_BW` constants to `src/components/home/demoCardData.ts`**

Shape: `{ title, year, director, posterLabel, posterBg, tiles: 8 items with devIndex १–८ }`. The partial state mirrors `end-to-end.html` partial `.demo-guess` (Lagaan). The win state mirrors `end-to-end.html` win `.demo-guess` (Dil Chahta Hai, all teal). Keep the existing `DEMO_PARTIAL_MOVIE/TILES` and `DEMO_WIN_MOVIE/TILES` exports untouched — the real GuessCard still uses them.

- [ ] **Step 5: Run tests — PASS**

- [ ] **Step 6: Commit**

```bash
git add frontend/components/home/DemoGuessCard.tsx frontend/components/home/DemoGuessCard.test.tsx \
        frontend/styles/bollywood-tokens.css src/components/home/demoCardData.ts
git commit -m "feat(home): add DemoGuessCard + bilingual demo data"
```

---

### Task 5: Restyle ModeCard

**Files:**
- Modify: `src/components/ModeCard.tsx`

**Interfaces:**
- Preserves existing props `{ difficulty: Difficulty; streak: number; playedToday: boolean }` and link-to-`/[difficulty]` behavior exactly. Only visual rules change.

- [ ] **Step 1: Rewrite the component's markup/className set to match `end-to-end.html` `.mode-card` block**

- Outer `<Link>` adopts `.bw-mode-card` (and `.bw-mode-card.hard` when `isHard`), replacing current `rounded-2xl border border-border bg-surface ...` classes.
- Hard badge → `.bw-mode-badge` with 🎬⭐ Hard copy.
- Title → `.bw-mode-title` (and `.hard`).
- "✓ played" chip → `.bw-mode-pt`.
- Blurb paragraph → `.bw-mode-blurb` (unchanged `meta.blurb` text).
- Streak section → `.bw-mode-foot` wrapper with `.bw-mode-streak-label` + `.bw-mode-streak-num`.
- CTA pill → `.bw-mode-cta` with text `playedToday ? 'Replay →' : 'Play →'`.
- Pool hint → `.bw-mode-pool` with `meta.poolHint`.

Add corresponding CSS to `bollywood-tokens.css`, values from `end-to-end.html` `.mode-card`, `.mode-badge`, `.mode-title`, `.mode-pt`, `.mode-blurb`, `.mode-streak-*`, `.mode-cta`, `.mode-pool`, including the `grid-template-columns: repeat(3, 1fr); gap: 16px; @max-width: 720px → 1fr` grid rule under a wrapping `.bw-mode-grid` class (used by Task 9).

- [ ] **Step 2: Run existing home E2E (sanity: mode card links still resolve)**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npx playwright test e2e/home.spec.ts 2>&1 | tail -5
```

Expected: existing tests may fail on selectors (that's Task 10's problem) BUT mode-card routing tests should not throw. Full green comes in Task 10.

- [ ] **Step 3: Commit**

```bash
git add src/components/ModeCard.tsx frontend/styles/bollywood-tokens.css
git commit -m "feat(home): restyle ModeCard with Bollywood identity"
```

---

### Task 6: Restyle HowItWorks (uses DemoGuessCard)

**Files:**
- Modify: `src/components/home/HowItWorks.tsx`

**Interfaces:**
- Consumes: `DemoGuessCard` from Task 4, `DEMO_PARTIAL_BW` / `DEMO_WIN_BW` from Task 4's demoCardData update.
- Preserves existing section structure (3 numbered steps, 2 embedded demo cards between steps 2+3 and after step 3).

- [ ] **Step 1: Rewrite the component**

- Replace existing section-head with `<div class="bw-section-head"><span class="eyebrow-stars">★ ★ ★</span><h2>How it works<span class="hi">खेल कैसे चलता है</span></h2></div>` matching the mockup exactly.
- Replace `.rounded-2xl border border-border bg-surface ...` step cards with `.bw-step-card`, step number in `.num` (Yatra One 38px, color `--mustard`), title in Yatra One 20px, description text unchanged (prod copy preserved).
- Replace existing `<GuessCard movie={DEMO_PARTIAL_MOVIE} tiles={DEMO_PARTIAL_TILES} />` with `<DemoGuessCard {...DEMO_PARTIAL_BW} />` and the win-case equivalent.
- Replace step-2's inline color-tag text ("Green / gold / grey") with the mockup's "TEAL / MUSTARD / RED" tags; use the colored `.tag` style from `end-to-end.html` step-head description.
- Search demo block becomes `.bw-search-demo` with icon + "Lagaan" in Yatra One.

Add CSS for `.bw-step-stack`, `.bw-step-card`, `.bw-step-head`, `.bw-step-head .num`, `.bw-step-head .body h3/p`, `.bw-search-demo`, `.eyebrow-stars`, `.bw-section-head h2`, `.bw-section-head h2 .hi` to `bollywood-tokens.css` — all values from `end-to-end.html`.

- [ ] **Step 2: Run `npx tsc --noEmit`**

Expected: clean. If `GuessCard` import becomes unused, remove it; `DemoGuessCard` is now the import.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HowItWorks.tsx frontend/styles/bollywood-tokens.css
git commit -m "feat(home): restyle HowItWorks with Bollywood identity + swap to DemoGuessCard"
```

---

### Task 7: Restyle GameAttributes + FaqAccordion

**Files:**
- Modify: `src/components/home/GameAttributes.tsx` (visual only; `ATTRS` content preserved)
- Modify: `src/components/home/FaqAccordion.tsx` (visual + update 2 answers that reference tile colors)

**Interfaces:**
- Preserves all behavior (static section + accordion open/close).

- [ ] **Step 1: Rewrite GameAttributes markup**

- Section-head: `.bw-section-head` with `★ WHAT THE EIGHT TILES MEAN ★` eyebrow + `h2` "Every tile tells a story / आठ संकेत · एक फ़िल्म" (verbatim mockup).
- Grid wrapper: `.bw-attr-grid` (`repeat(4, 1fr)` desktop, `repeat(2, 1fr)` ≤720px).
- Each card: `.bw-attr-card` with `.n` (01…08, Yatra One 12px, `--paper-dim`), `.label` (Yatra One 17px, `--mustard`), `.desc` (12px `--paper-mute`) using existing `ATTRS` text.

Add CSS for `.bw-attr-grid`, `.bw-attr-card`, `.bw-attr-card .n/.label/.desc` to `bollywood-tokens.css`.

- [ ] **Step 2: Rewrite FaqAccordion markup**

- Section-head: `.bw-section-head` with `★ QUESTIONS FROM THE AUDIENCE ★` eyebrow + "FAQ / आपके सवाल".
- Accordion container: `.bw-faq`, each item `details.bw-faq-item` with `summary` using Yatra One + `.plus` mustard indicator (rotates on `[open]`).
- Preserve all 10 existing questions. Update **two** answers that reference tile colors:
  - "What counts as a close match?" — in body, replace `yellow` → `mustard`, `green` → `teal`.
  - (No second one actually — the only one that mentions colors is this. Review: skim and update any residual references. If only one answer references colors, that's fine; log in commit message.)

Add CSS for `.bw-faq`, `details.bw-faq-item`, `details.bw-faq-item[open]`, `summary`, `summary .plus`, `details p` to `bollywood-tokens.css`.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/GameAttributes.tsx src/components/home/FaqAccordion.tsx frontend/styles/bollywood-tokens.css
git commit -m "feat(home): restyle GameAttributes + FaqAccordion; update color-term in FAQ"
```

---

### Task 8: HowToPlaySheet triggerClassName prop (Review Focus 5)

**Files:**
- Modify: `src/components/HowToPlaySheet.tsx`

**Interfaces:**
- Produces: `<HowToPlaySheet triggerClassName?: string />` — optional prop. When set, replaces the current hardcoded trigger-button className. When omitted, defaults to the current prod styling (zero behavior change at existing call sites).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HowToPlaySheet } from './HowToPlaySheet';

describe('HowToPlaySheet trigger', () => {
  it('applies triggerClassName to the opener button when provided', () => {
    render(<HowToPlaySheet triggerClassName="bw-pill-outline-ink" />);
    const btn = screen.getByRole('button', { name: /How to play/i });
    expect(btn.classList.contains('bw-pill-outline-ink')).toBe(true);
  });
  it('falls back to default className when triggerClassName omitted', () => {
    render(<HowToPlaySheet />);
    const btn = screen.getByRole('button', { name: /How to play/i });
    expect(btn.classList.contains('bw-pill-outline-ink')).toBe(false);
    // existing default: underline-style link — accept whatever current class is present
    expect(btn.className.length).toBeGreaterThan(0);
  });
});
```

Create the test file at `src/components/HowToPlaySheet.test.tsx` or `frontend/components/... hmm — placing a test on an existing src/ component. Since vitest config already includes `src/**/*.test.ts`, add `.test.tsx` to that same glob by updating `vitest.config.mts` include to `src/**/*.test.{ts,tsx}`.

- [ ] **Step 2: Update `vitest.config.mts` include pattern**

Change `"src/**/*.test.ts"` → `"src/**/*.test.{ts,tsx}"`. Re-run tests to confirm no existing src tests break.

- [ ] **Step 3: Write the test file at `src/components/HowToPlaySheet.test.tsx` (RED verified)**

- [ ] **Step 4: Add `triggerClassName?: string` prop to `HowToPlaySheet.tsx`**

Replace the hardcoded trigger `className="text-sm font-medium text-muted underline underline-offset-4 ..."` with `className={triggerClassName ?? "text-sm font-medium text-muted underline underline-offset-4 decoration-border transition-colors hover:text-foreground hover:decoration-accent"}`.

- [ ] **Step 5: Run tests — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/components/HowToPlaySheet.tsx src/components/HowToPlaySheet.test.tsx vitest.config.mts
git commit -m "feat(home): add optional triggerClassName prop to HowToPlaySheet"
```

---

### Task 9: Rewrite src/app/page.tsx (Review Focus 1 + 4)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `BollywoodHero` (Task 3), `StarRail` (Task 2), `DemoGuessCard` (indirectly via HowItWorks), `HowToPlaySheet` with new `triggerClassName` (Task 8), restyled `ModeCard` (Task 5), `HowItWorks` (Task 6), `GameAttributes`/`FaqAccordion` (Task 7).
- Preserves: `export const dynamic = "force-dynamic"`, the `/auth/callback` passthrough block at the top of the current `Home()` function, `loadStreakState()` call and its return typing, `DIFFICULTIES.map` iteration into ModeCards, author/email footer links.

- [ ] **Step 1: Rewrite the component**

Preserve the top of `Home()` verbatim through the `redirect` passthrough and `loadStreakState()` call. From that point, replace the returned JSX with the mockup structure from `end-to-end.html` §01 Landing (minus the `#` nav links to other mock sections):

1. Outer `<div className="bw-surface-ink">` with `.bw-grain-ink` overlay.
2. `<header className="bw-util-bar">` with brand mini (`बॉलीवुड स्पॉटल`) left, streak chip right. Streak chip rendered ONLY when `streakState.easy.streak || streakState.medium.streak || streakState.hard.streak > 0`. Chip text is `★ {streakState.easy.streak}` (per Global Constraints: Easy streak when any mode ≥ 1).
3. `<StarRail side="left" />` and `<StarRail side="right" />`.
4. `<main className="bw-hero-wrap">`:
   - `<BollywoodHero />`
   - `.bw-date-pill` with `{istDisplayDate()} · IST` wrapped between two mustard `★`.
   - `<h1 className="bw-tagline" lang="hi">आज की फ़िल्म पहचानिए — दस कोशिशों में<span class="bw-tagline-en" lang="en">Guess today's film in 10 tries</span></h1>`.
   - `<a href="/easy" className="bw-pill-mustard"><span class="arrow">▶</span>PLAY <small>खेलें</small></a>`.
   - `.bw-diff-row` with three `<Link>`s to `/easy|/medium|/hard` (direct links; no selected state).
5. Mode cards section: `<section className="bw-section"><div className="bw-section-head">...</div><div className="bw-mode-grid">...</div></section>`, iterating `DIFFICULTIES.map(d => <ModeCard key={d} difficulty={d} {...streakState[d]} />)`.
6. Info strips section: two `.bw-info-strip` divs. First strip's right-side CTA is `<HowToPlaySheet triggerClassName="bw-pill-outline-ink" />`. Second strip has an `<a href="/archive" className="bw-pill-outline-ink">Archive →</a>`.
7. `<HowItWorks />`
8. `<GameAttributes />`
9. `<FaqAccordion />`
10. Final CTA section: `<a href="/easy" className="bw-pill-mustard"><span class="arrow">▶</span>PLAY TODAY'S FILM <small>खेलें</small></a>` + `<p className="bw-eyebrow">★ FREE · ONE FILM A DAY · NO ACCOUNT ★</p>`.
11. Footer: preserved copy from current `page.tsx` ("A game by Om Golesar..." block), restyled with `.bw-foot` class.

Add CSS classes to `bollywood-tokens.css` for `.bw-surface-ink`, `.bw-hero-wrap`, `.bw-util-bar`, `.brand-mini`, `.streak-chip`, `.bw-date-pill`, `.bw-tagline`, `.bw-tagline-en`, `.bw-diff-row`, `.bw-section`, `.bw-foot` — all values from `end-to-end.html`.

Delete `import { SiteHeader } from "@/components/SiteHeader";` and its `<SiteHeader />` usage from this file. SiteHeader stays untouched for `/archive` + `/admin/login`.

- [ ] **Step 2: Start dev server + smoke test**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
nohup npm run dev > /tmp/spb-home.log 2>&1 &
sleep 10
curl -s http://localhost:3000/ | grep -oE 'bw-util-bar|bw-hero-wrap|bw-mode-grid|bw-faq|bw-pill-mustard' | sort -u
curl -s http://localhost:3000/?code=TESTCODE | grep -oE 'Location:|auth/callback' | head -2 || true
pkill -f "next dev" 2>/dev/null
```

Expected: core class names appear; the `?code=TESTCODE` test confirms `/auth/callback` redirect still fires (HTML output will be the callback page or redirect header).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx frontend/styles/bollywood-tokens.css
git commit -m "feat(home): wire new home page with inline util bar, hero, sections"
```

---

### Task 10: Update e2e/home.spec.ts

**Files:**
- Modify: `e2e/home.spec.ts`

**Interfaces:** Updates selectors + adds Review Focus 1 (all-zero streak hides chip) coverage.

- [ ] **Step 1: Read existing `e2e/home.spec.ts` to find all current assertions**

```bash
cat e2e/home.spec.ts
```

- [ ] **Step 2: Update selectors to match the new DOM**

Rules:
- Any assertion checking for the old text "Guess today's mystery Bollywood film" → change to look for the Devanagari tagline `आज की फ़िल्म पहचानिए` OR the English sub `Guess today's film in 10 tries`.
- Any assertion for `.font-display` or "Spotle Bollywood" wordmark → look for `.brand-mini` text `बॉलीवुड स्पॉटल`.
- Mode card tests still work (same hrefs); update any class-name-based assertion to behavior-based (link `href`).
- HowItWorks section test — look for `★ ★ ★` eyebrow or "How it works" `h2`.
- FAQ test — look for `details.bw-faq-item summary` text.
- Add new test: `test('util-bar streak chip hidden when all streaks are 0', ...)` — intercept `/api/streaks` with a mock returning 0s and verify `.streak-chip` is NOT visible.
- Add new test: `test('How to play strip opens the sheet', ...)` — click the info-strip pill, assert dialog opens.

- [ ] **Step 3: Run full E2E**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npx playwright test 2>&1 | tail -15
```

Expected: all tests pass (home + loading + puzzle + hints + admin). Zero failures.

- [ ] **Step 4: Commit**

```bash
git add e2e/home.spec.ts
git commit -m "test(e2e): update home.spec.ts for new Bollywood home DOM; add streak-hidden + how-to-play coverage"
```

---

### Task 11: Final verification + PR body

**Files:** None modified.

- [ ] **Step 1: Full build**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npm run build 2>&1 | tail -10
```

Expected: success.

- [ ] **Step 2: Full Vitest**

```bash
npx vitest run --exclude '**/tiles.test.ts' 2>&1 | tail -5
```

Expected: all PASS (will include the new tests from Tasks 2, 3, 4, 8).

- [ ] **Step 3: Full Playwright**

```bash
npx playwright test 2>&1 | tail -5
```

Expected: 32+ tests pass across both projects, 0 failures.

- [ ] **Step 4: Lint (informational)**

```bash
npm run lint 2>&1 | tail -3
```

Record final error count (expected growth of 1-2 instances from the known-tolerated `react-hooks/set-state-in-effect` pattern per BollywoodHero's useEffect).

- [ ] **Step 5: Push + open PR**

```bash
git push -u origin bollywood-pr2-home-screen
```

Prepare PR body summarizing scope, test plan, Review Focus coverage, rulings executed. (`gh` CLI unavailable → open PR via GitHub web UI with the printed URL.)

---

## Self-review notes

- **Spec coverage:** every section in `2026-10-17-home-screen-design.md` §5–§9 maps to a Task (hero → T3+T9, mode cards → T5+T9, info strips → T9, how-it-works → T6, attributes → T7, FAQ → T7, final CTA → T9, footer → T9, tokens → T1, fonts → T1, posters → T1, SiteHeader-removal from home → T9, HowToPlaySheet prop → T8, E2E → T10, verification → T11). ✓
- **Review Focus pinning:** item 1 (all-zero streak hidden) → T9 server-render + T10 new E2E. Item 2 (poster 404) → T3 onError test. Item 3 (reduced-motion) → T3 test. Item 4 (auth-callback passthrough) → T9 step 2 curl check. Item 5 (triggerClassName default) → T8 test. ✓
- **Type consistency:** `DemoGuessCardProps.tiles[].color: 'teal'|'mustard'|'red'` consistent across T4 definition + T6 consumption. `triggerClassName` optional in T8 and T9. BollywoodHero no props, just rendered. ✓
- **Proportion:** Plan is longer than spec (~900 vs 350 lines) but each task has concrete inputs (file lists, exact props, exact test names, exact CSS class names) and no inline component bodies — just signatures and critical values. The verbosity is in CSS class names across 15 files, which the implementer couldn't guess. ✓
