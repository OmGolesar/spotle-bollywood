# Puzzle Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the gameplay surface to match the Bollywood identity we shipped in PRs 1 & 2 — disciplined cream `--paper` canvas, teal/mustard/matchbox-red tiles, bilingual chrome, polished mobile + desktop layouts — while preserving every API call, state machine, keyboard flow, and ARIA attribute the existing game depends on.

**Architecture:** New puzzle primitives land in `frontend/components/puzzle/`. Existing puzzle components in `src/components/` (`PuzzleScreen`, `GuessCard`, `GuessAutocomplete`, `HintSheet`, `ResultScreen`, `PuzzleTips`) are restyled in place. One new CSS file `frontend/styles/puzzle.css` imported once from `src/app/globals.css`. Zero changes to `/api/*`, `src/lib/*`, `src/app/[difficulty]/page.tsx`, `src/components/SiteHeader.tsx`, home surfaces, or admin.

**Tech Stack:** Next.js 16 · React 19 · TypeScript strict · Vitest + @testing-library/react + jsdom · Playwright · next/font/google (fonts loaded by PR 2 unchanged).

**Spec:** `docs/superpowers/specs/2026-10-17-puzzle-screen-design.md`

## Global Constraints

- All new UI code lives under `frontend/components/puzzle/` and `frontend/styles/puzzle.css`. Existing puzzle components restyled in place; no file moves.
- No file under `src/app/api/`, `src/lib/`, or `src/app/[difficulty]/page.tsx` may be modified.
- `src/components/SiteHeader.tsx`, `src/components/ThemeToggle.tsx`, `src/components/Countdown.tsx`, `src/components/ArchivePuzzleScreen.tsx`, `src/components/home/*`, `src/components/ModeCard.tsx`, `src/app/page.tsx` — untouched.
- `TileState.color` keeps its `"green" | "yellow" | "gray"` values from `src/lib/types.ts`. Puzzle components translate via a component-local `TILE_COLOR_VAR` lookup. No change to `src/lib/tiles.ts`.
- Tile mapping (verbatim): `green → var(--teal)`, `yellow → var(--mustard)`, `gray → var(--matchbox-red)`.
- `TOTAL_GUESSES=10`, `MAX_HINTS=2`, `HINT_UNLOCKS=[3,6]` imports from `@/lib/types` untouched.
- `GuessAutocomplete` ARIA (`role=combobox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete=list`, `aria-busy`) preserved verbatim — tests rely on `role=combobox` and `role=option`.
- `GuessCard` `aria-label="Guess N: Title"` preserved — E2E dependency.
- Give-up dialog `aria-label="Confirm give up"` preserved — E2E.
- HintSheet `role="dialog"` with accessible name `/Choose a hint/i` preserved — E2E.
- ResultScreen `role="dialog"` with id `result-title` + accessible name `/Solved!|Game over/i` and `Close summary` button label preserved — E2E.
- Autocomplete behavior: debounced `/api/catalog` with AbortController; blur-delay dismiss; `disabledIds` filter — all preserved.
- Hint sheet closes on `Escape` and locks body-overflow while open — preserved. Plus **new**: closes automatically when `outcome` transitions away from `in_progress` (spec ruling 5).
- Give-up button disabled while `submitting === true` (spec ruling 6, prevents race with in-flight guess).
- ResultScreen only opens on explicit "View summary →" click, never automatically — preserved.
- Font stack unchanged from PR 2: Yatra One (display), Anek Devanagari (UI/body), Baloo Bhai 2 (small chips).
- No new npm dependencies.
- Branch stacks on `bollywood-pr2-home-screen`; CI runs on every push.
- Per user memory `feedback_no_claude_attribution`: no Co-Authored-By or Generated-with lines.

## Review Focus

Edge cases the spec implies that need explicit tests (from fork audit §8 and new rulings):

1. **Keyboard-only guess submission** → tab → combobox → type → ArrowDown → Enter must land a guess. Pinned in Task 14.
2. **Give-up during in-flight submit** → clicking give-up when `submitting === true` must be a no-op (button disabled). Pinned in Task 13.
3. **Hint sheet open at the moment of a winning or losing guess** → sheet must auto-close before ResultScreen is reachable. Pinned in Task 13.
4. **No-poster fallback (`movie.posterUrl` falsy)** → MysteryPoster renders a film-strip SVG placeholder, not a blank box. Pinned in Task 4.
5. **ResultScreen Escape dismiss** → pressing Escape on the result modal closes it (consistency with HintSheet). Pinned in Task 11.

---

### Task 1: Foundation — tokens helper + puzzle.css + globals import

**Files:**
- Create: `frontend/components/puzzle/tileColor.ts`
- Create: `frontend/components/puzzle/tileColor.test.ts`
- Create: `frontend/styles/puzzle.css` (empty shell; populated by later tasks via `Edit`)
- Modify: `src/app/globals.css` — add `@import "../../frontend/styles/puzzle.css";` after the existing bollywood-tokens import.

**Interfaces:**
- Produces: `TILE_COLOR_VAR: Record<TileColor, string>` export mapping `"green" → "var(--teal)"`, `"yellow" → "var(--mustard)"`, `"gray" → "var(--matchbox-red)"`. Consumed by every puzzle component that renders tiles.
- Produces: `puzzle.css` loaded globally; later tasks add rules here.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { TILE_COLOR_VAR } from "./tileColor";

describe("TILE_COLOR_VAR", () => {
  it("maps green to --teal", () => expect(TILE_COLOR_VAR.green).toBe("var(--teal)"));
  it("maps yellow to --mustard", () => expect(TILE_COLOR_VAR.yellow).toBe("var(--mustard)"));
  it("maps gray to --matchbox-red", () => expect(TILE_COLOR_VAR.gray).toBe("var(--matchbox-red)"));
});
```

- [ ] **Step 2: Run — FAIL (`Cannot find module ./tileColor`)**

```bash
npx vitest run frontend/components/puzzle/tileColor.test.ts
```

- [ ] **Step 3: Implement `TILE_COLOR_VAR` in `frontend/components/puzzle/tileColor.ts`**

```ts
import type { TileColor } from "@/lib/types";
export const TILE_COLOR_VAR: Record<TileColor, string> = {
  green: "var(--teal)",
  yellow: "var(--mustard)",
  gray: "var(--matchbox-red)",
};
```

- [ ] **Step 4: Create empty puzzle.css**

Create `frontend/styles/puzzle.css` with just a comment header; rules land in later tasks.

- [ ] **Step 5: Import from globals.css**

In `src/app/globals.css`, below the existing `@import "../../frontend/styles/bollywood-tokens.css";`, add:
```css
@import "../../frontend/styles/puzzle.css";
```

- [ ] **Step 6: Run — PASS; tsc clean; build clean**

```bash
npx vitest run frontend/components/puzzle/tileColor.test.ts
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add frontend/components/puzzle/tileColor.ts frontend/components/puzzle/tileColor.test.ts \
        frontend/styles/puzzle.css src/app/globals.css
git commit -m "chore(puzzle): scaffold tile color token map + puzzle.css import"
```

---

### Task 2: PuzzleShell primitive

**Files:**
- Create: `frontend/components/puzzle/PuzzleShell.tsx`
- Create: `frontend/components/puzzle/PuzzleShell.test.tsx`
- Modify: `frontend/styles/puzzle.css` (append shell rules)

**Interfaces:**
- Produces: `<PuzzleShell chrome?: 'full' | 'none' = 'full'>{children}</PuzzleShell>`. Renders a cream `--paper` surface with 3% multiply grain overlay. When `chrome="none"`, no additional padding/structure — just the surface + inner children. When `chrome="full"`, provides the body container with max-width and responsive padding; the caller provides the status bar + content.

- [ ] **Step 1: Write failing tests**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { PuzzleShell } from "./PuzzleShell";

describe("PuzzleShell", () => {
  afterEach(() => cleanup());

  it("renders its children inside .bw-puzzle-shell", () => {
    const { container } = render(<PuzzleShell><div data-testid="x" /></PuzzleShell>);
    expect(container.querySelector(".bw-puzzle-shell")).toBeTruthy();
    expect(container.querySelector("[data-testid=x]")).toBeTruthy();
  });

  it("applies the chrome-full class by default", () => {
    const { container } = render(<PuzzleShell>x</PuzzleShell>);
    expect(container.querySelector(".bw-puzzle-shell")?.classList.contains("chrome-full")).toBe(true);
  });

  it("applies the chrome-none class when chrome='none'", () => {
    const { container } = render(<PuzzleShell chrome="none">x</PuzzleShell>);
    expect(container.querySelector(".bw-puzzle-shell")?.classList.contains("chrome-none")).toBe(true);
  });

  it("renders a decorative grain overlay (aria-hidden)", () => {
    const { container } = render(<PuzzleShell>x</PuzzleShell>);
    const grain = container.querySelector(".bw-puzzle-grain");
    expect(grain).toBeTruthy();
    expect(grain?.getAttribute("aria-hidden")).toBe("true");
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `PuzzleShell(props): JSX.Element` in `frontend/components/puzzle/PuzzleShell.tsx`**

Signature:
```ts
type Props = { chrome?: 'full' | 'none'; children: React.ReactNode };
```
Renders a root `<div className={"bw-puzzle-shell chrome-" + (chrome ?? 'full')}>` with an inner `<div className="bw-puzzle-grain" aria-hidden="true" />` and the children. No `'use client'` directive (purely presentational — can SSR).

Append CSS to `frontend/styles/puzzle.css`:
- `.bw-puzzle-shell { position: relative; min-height: 100dvh; background: var(--paper); color: var(--charcoal); overflow-x: hidden; }`
- `.bw-puzzle-grain { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); mix-blend-mode: multiply; opacity: 0.06; }`
- `.bw-puzzle-shell.chrome-full { padding: 0; }` (status bar renders its own padding)
- `.bw-puzzle-shell.chrome-none { display: flex; align-items: center; justify-content: center; padding: clamp(40px, 8vh, 96px) 24px; }` (for error / loading states)

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/puzzle/PuzzleShell.tsx frontend/components/puzzle/PuzzleShell.test.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): add PuzzleShell cream-surface primitive"
```

---

### Task 3: MysteryPoster primitive (Review Focus 4)

**Files:**
- Create: `frontend/components/puzzle/MysteryPoster.tsx`
- Create: `frontend/components/puzzle/MysteryPoster.test.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:**
- Consumes: nothing from other new tasks.
- Produces: `<MysteryPoster posterUrl: string | null; blurPx: number; alt: string />`. Renders either the poster `<img>` with inline `filter: blur(${blurPx}px)` and `transition: filter 400ms ease-out`, or an SVG film-strip fallback when `posterUrl` is falsy. Wrapped in a star-border frame.

- [ ] **Step 1: Write failing tests**

```tsx
import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { MysteryPoster } from "./MysteryPoster";

describe("MysteryPoster", () => {
  afterEach(() => cleanup());

  it("renders an <img> with the poster url and blur style when url present", () => {
    const { container } = render(<MysteryPoster posterUrl="/x.png" blurPx={12} alt="t" />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("/x.png");
    expect(img.style.filter).toBe("blur(12px)");
  });

  it("renders the SVG fallback when posterUrl is null", () => {
    const { container } = render(<MysteryPoster posterUrl={null} blurPx={0} alt="t" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".bw-poster-fallback")).toBeTruthy();
  });

  it("has blur 0 and no transition on win (blurPx=0)", () => {
    const { container } = render(<MysteryPoster posterUrl="/x.png" blurPx={0} alt="t" />);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.filter).toBe("blur(0px)");
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `MysteryPoster(props)` in `frontend/components/puzzle/MysteryPoster.tsx`**

```ts
type Props = { posterUrl: string | null; blurPx: number; alt: string };
```
- Root `<div className="bw-mystery-poster">` with 4 star corner `<span>★</span>` glyphs.
- If `posterUrl`: `<img src={posterUrl} alt={alt} style={{ filter: 'blur('+blurPx+'px)', transition: 'filter 400ms ease-out' }} />`.
- Else: inline SVG film-strip (16×24, `className="bw-poster-fallback"`, muted color).

Append CSS:
- `.bw-mystery-poster { position: relative; width: clamp(140px, 32vw, 200px); aspect-ratio: 2 / 3; margin: 0 auto; border: 3px solid var(--charcoal); border-radius: 8px; overflow: hidden; background: var(--paper); box-shadow: 0 10px 30px rgba(26, 22, 18, 0.2); }`
- `.bw-mystery-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }`
- Star corner positioning (reuse pattern from `end-to-end.html` `.poster-frame`): absolute `top:-10px left:-10px` etc., 20×20, var(--paper) bg, 2px var(--charcoal) border, text var(--matchbox-red).
- `.bw-poster-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--paper-dim); }`

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/puzzle/MysteryPoster.tsx frontend/components/puzzle/MysteryPoster.test.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): add MysteryPoster framed primitive with no-poster fallback"
```

---

### Task 4: EndOfRoundBanner primitive

**Files:**
- Create: `frontend/components/puzzle/EndOfRoundBanner.tsx`
- Create: `frontend/components/puzzle/EndOfRoundBanner.test.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:**
- Produces: `<EndOfRoundBanner outcome: 'won' | 'lost'; guessCount: number; answerTitle: string; answerYear: number; onViewSummary: () => void />`.

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { EndOfRoundBanner } from "./EndOfRoundBanner";

describe("EndOfRoundBanner", () => {
  afterEach(() => cleanup());

  it("renders won variant with 'Solved in N guesses'", () => {
    render(<EndOfRoundBanner outcome="won" guessCount={4} answerTitle="Lagaan" answerYear={2001} onViewSummary={() => {}} />);
    expect(screen.getByText(/Solved in 4 guesses/i)).toBeTruthy();
  });

  it("uses singular 'guess' when guessCount is 1", () => {
    render(<EndOfRoundBanner outcome="won" guessCount={1} answerTitle="A" answerYear={2001} onViewSummary={() => {}} />);
    expect(screen.getByText(/Solved in 1 guess$/i)).toBeTruthy();
  });

  it("renders lost variant with 'Out of guesses'", () => {
    render(<EndOfRoundBanner outcome="lost" guessCount={10} answerTitle="A" answerYear={2001} onViewSummary={() => {}} />);
    expect(screen.getByText(/Out of guesses/i)).toBeTruthy();
  });

  it("calls onViewSummary when the pill is clicked", () => {
    const onClick = vi.fn();
    render(<EndOfRoundBanner outcome="won" guessCount={2} answerTitle="A" answerYear={2001} onViewSummary={onClick} />);
    screen.getByRole("button", { name: /View summary/i }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement in `frontend/components/puzzle/EndOfRoundBanner.tsx`**

Markup matches spec §5.5:
- Root `<div className={"bw-end-banner " + outcome}>`.
- Won text (plural handled with ternary): `Solved in ${n} ${n === 1 ? 'guess' : 'guesses'}` + Devanagari `· शाबाश`.
- Lost text: `Out of guesses · फिर कल`.
- Right-side `<button>` with `View summary →` label — the pill from `.bw-pill-mustard`.

Append CSS: `.bw-end-banner.won` with teal 2px border, `.bw-end-banner.lost` with charcoal border, both with `--paper` bg, flex row with gap.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/puzzle/EndOfRoundBanner.tsx frontend/components/puzzle/EndOfRoundBanner.test.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): add EndOfRoundBanner won/lost variants"
```

---

### Task 5: PuzzleEmptyState + PuzzleErrorScreen + ConfirmGiveUpSheet (small primitives)

**Files:**
- Create: `frontend/components/puzzle/PuzzleEmptyState.tsx`
- Create: `frontend/components/puzzle/PuzzleEmptyState.test.tsx`
- Create: `frontend/components/puzzle/PuzzleErrorScreen.tsx`
- Create: `frontend/components/puzzle/PuzzleErrorScreen.test.tsx`
- Create: `frontend/components/puzzle/ConfirmGiveUpSheet.tsx`
- Create: `frontend/components/puzzle/ConfirmGiveUpSheet.test.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:**
- `<PuzzleEmptyState />` — static bilingual "Pick any film…" helper under the input.
- `<PuzzleErrorScreen variant: 'loading' | 'no_puzzle' | 'backend_not_configured' | 'other'; message?: string; onRetry?: () => void />`.
- `<ConfirmGiveUpSheet open: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void />` — modal with `role="dialog" aria-label="Confirm give up"` (E2E dependency preserved).

- [ ] **Step 1: Write failing tests** for all three components

```tsx
// PuzzleEmptyState.test.tsx
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { PuzzleEmptyState } from "./PuzzleEmptyState";
afterEach(() => cleanup());
describe("PuzzleEmptyState", () => {
  it("renders the bilingual pick-any-film helper", () => {
    render(<PuzzleEmptyState />);
    expect(screen.getByText(/Pick any film/i)).toBeTruthy();
  });
});

// PuzzleErrorScreen.test.tsx
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { PuzzleErrorScreen } from "./PuzzleErrorScreen";
afterEach(() => cleanup());
describe("PuzzleErrorScreen", () => {
  it("renders 'No puzzle today' for no_puzzle variant", () => {
    render(<PuzzleErrorScreen variant="no_puzzle" />);
    expect(screen.getByText(/No puzzle today/i)).toBeTruthy();
  });
  it("renders a retry button when onRetry provided (other variant)", () => {
    const onRetry = vi.fn();
    render(<PuzzleErrorScreen variant="other" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: /Retry/i });
    btn.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it("renders a loading state with no CTA", () => {
    render(<PuzzleErrorScreen variant="loading" />);
    expect(screen.getByText(/Loading puzzle/i)).toBeTruthy();
  });
});

// ConfirmGiveUpSheet.test.tsx
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { ConfirmGiveUpSheet } from "./ConfirmGiveUpSheet";
afterEach(() => cleanup());
describe("ConfirmGiveUpSheet", () => {
  it("does not render when open is false", () => {
    render(<ConfirmGiveUpSheet open={false} busy={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("renders with aria-label='Confirm give up' when open (E2E dependency)", () => {
    render(<ConfirmGiveUpSheet open busy={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("dialog", { name: /Confirm give up/i })).toBeTruthy();
  });
  it("calls onCancel on Keep guessing click", () => {
    const onCancel = vi.fn();
    render(<ConfirmGiveUpSheet open busy={false} onCancel={onCancel} onConfirm={() => {}} />);
    screen.getByRole("button", { name: /Keep guessing/i }).click();
    expect(onCancel).toHaveBeenCalledOnce();
  });
  it("calls onConfirm on Give up click (name '^Give up$' per E2E)", () => {
    const onConfirm = vi.fn();
    render(<ConfirmGiveUpSheet open busy={false} onCancel={() => {}} onConfirm={onConfirm} />);
    screen.getByRole("button", { name: /^Give up$/i }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it("disables Give up when busy", () => {
    render(<ConfirmGiveUpSheet open busy onCancel={() => {}} onConfirm={() => {}} />);
    expect((screen.getByRole("button", { name: /^Give up$/i }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("closes on Escape", () => {
    const onCancel = vi.fn();
    render(<ConfirmGiveUpSheet open busy={false} onCancel={onCancel} onConfirm={() => {}} />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run all three — FAIL**

- [ ] **Step 3: Implement all three components**

`PuzzleEmptyState` — small `<p className="bw-puzzle-empty-helper">` with "★ Pick any film. Each guess reveals comparison tiles and un-blurs the poster." + Devanagari sub.

`PuzzleErrorScreen` — Wraps in `<PuzzleShell chrome="none">` with a star-bordered inner card (`.bw-puzzle-error-card`). Variant copy:
- `loading`: "Loading puzzle…" (match current loading-screen voice; brief fade-in from PR 1 CSS).
- `no_puzzle`: "No puzzle today / आज का पहेली तैयार नहीं है" + body "Today's puzzle hasn't been scheduled yet. Try again after midnight IST, or run `npm run seed` in dev." + Back to home link.
- `backend_not_configured`: "Backend not configured" + SETUP.md pointer + Back to home.
- `other`: "Something went wrong" + optional `{message}` + Retry button.

`ConfirmGiveUpSheet` — `<div role="dialog" aria-label="Confirm give up">` with backdrop click + Escape dismiss + body overflow lock while open. Content: Yatra One heading + body + two pills (keep/give-up).

Append CSS: `.bw-puzzle-empty-helper`, `.bw-puzzle-error-card`, `.bw-confirm-sheet`, `.bw-confirm-sheet-backdrop` — reuse star-corner pattern from MysteryPoster.

- [ ] **Step 4: Run all — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/puzzle/PuzzleEmptyState.tsx frontend/components/puzzle/PuzzleEmptyState.test.tsx \
        frontend/components/puzzle/PuzzleErrorScreen.tsx frontend/components/puzzle/PuzzleErrorScreen.test.tsx \
        frontend/components/puzzle/ConfirmGiveUpSheet.tsx frontend/components/puzzle/ConfirmGiveUpSheet.test.tsx \
        frontend/styles/puzzle.css
git commit -m "feat(puzzle): add EmptyState, ErrorScreen, ConfirmGiveUpSheet primitives"
```

---

### Task 6: PuzzleStatusBar primitive

**Files:**
- Create: `frontend/components/puzzle/PuzzleStatusBar.tsx`
- Create: `frontend/components/puzzle/PuzzleStatusBar.test.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:**
- Produces: `<PuzzleStatusBar difficulty: Difficulty; guessesUsed: number; stillPlaying: boolean; hintsLeft: number; onOpenHints: () => void; onGiveUp: () => void; giveUpDisabled: boolean />`.
- Renders hints button (left) with mustard count badge when `hintsLeft > 0`; center column with back-link + difficulty label + "GUESS N of 10" counter; give-up button (right) that is disabled when `giveUpDisabled` or `!stillPlaying`.
- Preserve existing E2E-visible accessible names: hint button `aria-label="Open hints"`, give-up button `aria-label="Give up"`, back link `aria-label="Back to home"`, counter `aria-label="N guesses remaining"`.

- [ ] **Step 1: Write failing tests** covering: 10/10 remaining label when guessesUsed=0 and stillPlaying=true; hint button accessible via `Open hints`; give-up disabled when `giveUpDisabled`; mustard count badge present when `hintsLeft > 0`.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement in `frontend/components/puzzle/PuzzleStatusBar.tsx`**

- `'use client'` directive at top (hint + give-up are interactive).
- 3-column CSS grid at `>720px`, stacked 2-row grid at `<=720px`.
- Hint button: `.bw-hint-btn` class, 💡 glyph, label "Hints" (hidden on sm:hidden), count badge span `.bw-hint-count`.
- Center: back-link to `/`, difficulty label from `DIFFICULTY_META[difficulty].label` with Devanagari counterpart ("Easy · आसान", "Medium · मध्यम", "Hard · कठिन" — add Devanagari to local lookup in this file; `DIFFICULTY_META` stays untouched).
- Counter: `aria-label` text `"${TOTAL_GUESSES - guessesUsed} guesses remaining"` for the E2E; visible text `"GUESS <n> · अनुमान of 10"`.
- Give-up button: `.bw-giveup-btn`, ⚑ glyph, `aria-label="Give up"`, `disabled={!stillPlaying || giveUpDisabled}`.

Append CSS for the status bar.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/components/puzzle/PuzzleStatusBar.tsx frontend/components/puzzle/PuzzleStatusBar.test.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): add PuzzleStatusBar (hints, counter, give-up)"
```

---

### Task 7: Restyle GuessAutocomplete in place (visual only)

**Files:**
- Modify: `src/components/GuessAutocomplete.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:** Preserve every exported type and prop (`AutocompleteOption`, `onPick`, `disabled`, `disabledIds`, `difficulty`). Preserve every ARIA role, keyboard binding, debounce+abort, blur-delay behavior VERBATIM. Only className/markup around the input + listbox changes.

- [ ] **Step 1: Read the current file end-to-end**

```bash
cat src/components/GuessAutocomplete.tsx
```

- [ ] **Step 2: Rewrite only the className set + wrapper markup**

- Root container → `.bw-autocomplete`.
- `<input>` → `.bw-autocomplete-input` (paper background, 2px charcoal border, 12px radius, mustard focus ring via CSS `:focus`).
- Listbox `<ul>` → `.bw-autocomplete-listbox` (paper background, charcoal border, `max-height: min(50vh, 320px); overflow-y: auto;`).
- Options → `.bw-autocomplete-option` + `.is-active` when `aria-activedescendant` points at them. Keep poster thumb + title + year layout.
- Replace the 🔍 Tailwind utility class soup with a `.bw-autocomplete-search-icon` span.

Append CSS for every class above.

- [ ] **Step 3: Run existing E2E (`puzzle.spec.ts` autocomplete test)**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npx playwright test e2e/puzzle.spec.ts --project=chromium-desktop -g "autocomplete filters"
```

Expected: PASS. Existing selectors (`role=combobox`, `role=option`) survive because ARIA is untouched.

- [ ] **Step 4: Commit**

```bash
git add src/components/GuessAutocomplete.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): restyle GuessAutocomplete to paper surface, preserve ARIA + keyboard"
```

---

### Task 8: Restyle HintSheet in place

**Files:**
- Modify: `src/components/HintSheet.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:** Preserve props, `role="dialog"`, accessible name `/Choose a hint/i`, Esc handling, body-overflow-lock, 3 category cards.

- [ ] **Step 1: Read current file**

- [ ] **Step 2: Rewrite classNames + markup**

- Sheet surface → `.bw-hint-sheet` with star-corner glyphs.
- Title → `<h2 id="hint-title">Choose a hint · एक संकेत चुनिए</h2>` in Yatra One.
- Each category card → `.bw-hint-category-card` with mustard icon circle, Yatra One label, Anek description. States: locked (muted), available (interactive), revealed (teal glow + revealed text block).
- Keep "Keep guessing" close button (`aria-label="Close hint picker"`).

Append CSS.

- [ ] **Step 3: Run `hints.spec.ts`**

```bash
npx playwright test e2e/hints.spec.ts
```

Expected: both tests PASS (behavioral assertions unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/components/HintSheet.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): restyle HintSheet with paper surface + star corners"
```

---

### Task 9: Restyle GuessCard in place

**Files:**
- Modify: `src/components/GuessCard.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:** Preserve all props (`movie`, `tiles`, `guessIndex`, `animate`), `aria-label="Guess N: Title"` on root, `<h3>` for title. Preserve `TileState` consumption. Preserve `isLatest` animation flag.

- [ ] **Step 1: Read current file end-to-end**

- [ ] **Step 2: Rewrite markup**

- Root: `<article aria-label={aria} className="bw-guess-card">`.
- Header: 48×72 poster thumb (fallback div with film-strip SVG when `movie.posterUrl` falsy) + title/year/genre pills.
- Tile grid: new structure.
  - CSS: `.bw-guess-tiles { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }` desktop; `@media (max-width: 720px) { grid-template-columns: repeat(4, 1fr); }` mobile.
  - Each tile: `<div className={"bw-guess-tile " + tile.color}>` where className uses the TileColor name verbatim. Background from `TILE_COLOR_VAR` applied inline OR via CSS rule per color variant.
  - Inside tile: `<span className="dev-numeral" aria-hidden>{DEVANAGARI_INDEX[guessIndex]}</span>` — see note below. `<div className="label">{tile.label}</div>` and `<div className="value">{tile.value}{arrow? ' ↑/↓' : ''}</div>`.
  - Devanagari-numeral source: per spec/mockup, the corner glyph is the GUESS INDEX in Devanagari (`१` on guess 1, `२` on guess 2, …), identical across the 8 tiles in a row. Add a local constant `DEVANAGARI_INDEX = ['०','१','२','३','४','५','६','७','८','९','१०']` and index by `guessIndex + 1`.
- PeopleRow blocks (director + cast): keep existing TMDB portraits; wrap each portrait in `.bw-people-portrait` + corner Devanagari numeral badge from `DEVANAGARI_INDEX[portraitIndex+1]`.
- Latest guess animation preserved via `animate={isLatest}` → `.bw-guess-card.is-latest { animation: ... }`.

Append CSS for `.bw-guess-card`, `.bw-guess-tile[.teal|.mustard|.red]`, star-corner glyphs, people portraits.

Note: tile background colors are driven by `TILE_COLOR_VAR` (component-local mapping imported from Task 1). Either apply via inline `style` or three CSS variant classes (`.bw-guess-tile.teal { background: var(--teal) }`, etc.) — plan uses variant classes.

- [ ] **Step 3: Run every puzzle E2E**

```bash
npx playwright test e2e/puzzle.spec.ts e2e/hints.spec.ts
```

Expected: all pass. Selectors `heading level=3 name=/Title/`, `label=/Guess N: Title/` unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/GuessCard.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): restyle GuessCard with Bollywood tiles + Devanagari badges"
```

---

### Task 10: Restyle PuzzleTips (remove auto-advance)

**Files:**
- Modify: `src/components/PuzzleTips.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:** Preserve all 10 tip strings and Prev/Next/dot behaviors. Remove the 5-second auto-advance interval. No prop changes.

- [ ] **Step 1: Read current file; identify the `setInterval` responsible for auto-advance**

- [ ] **Step 2: Delete the auto-advance effect and its associated timer refs; keep manual Prev/Next and dot buttons**

- [ ] **Step 3: Restyle markup to paper surface + mustard dots**

- Root → `.bw-puzzle-tips` with max-width 560px, muted paper tint (`rgba(26,22,18,0.03)` bg).
- Tip title → Yatra One, color charcoal.
- Tip body → Anek, color paper-dim.
- Prev/Next arrow buttons → outline mustard pills.
- Dots → mustard when active, charcoal-20% when inactive.

Append CSS.

- [ ] **Step 4: Run `tsc --noEmit`; manual smoke test**

- [ ] **Step 5: Commit**

```bash
git add src/components/PuzzleTips.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): restyle PuzzleTips with paper tint; remove 5s auto-advance"
```

---

### Task 11: Restyle ResultScreen in place (Review Focus 5)

**Files:**
- Modify: `src/components/ResultScreen.tsx`
- Modify: `frontend/styles/puzzle.css`

**Interfaces:** Preserve props, `role="dialog"`, `aria-labelledby="result-title"`, accessible name `/Solved!|Game over/i`, `Close summary` button `aria-label`. Preserve emoji-grid output, `buildShareText`, `share()` flow. Preserve Countdown usage.

**New:** Add `Escape`-key dismiss via `useEffect` (keydown listener; call `onClose`).

- [ ] **Step 1: Write a failing test for Escape dismiss**

```tsx
// Create src/components/ResultScreen.test.tsx — one test
import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { ResultScreen } from "./ResultScreen";
afterEach(() => cleanup());
describe("ResultScreen Escape dismiss", () => {
  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    const answer = { id: "x", title: "A", year: 2001, director: ["D"], castTop3: ["C"], trivia: "t", whereToWatchUrl: null, posterUrl: "/p.png" };
    render(<ResultScreen difficulty="easy" outcome="won" answer={answer} guesses={[]} streakAfter={1} onClose={onClose} />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — FAIL (no Escape listener yet)**

- [ ] **Step 3: Add Escape listener via `useEffect` in `ResultScreen.tsx`** (same pattern as `HintSheet`); then rewrite markup for the Bollywood styling.

- Won variant: `.bw-result-screen won` — paper surface with conic-gradient sunburst behind the poster frame.
- Lost variant: `.bw-result-screen lost` — ink surface with grain overlay.
- Headline: Yatra One `clamp(42px, 6vw, 64px)` with bilingual Devanagari primary / English sub (won: "शाबाश! · Solved!"; lost: "फिर कल · Game over").
- Sub-headline: `In {N} {guess|guesses}` / `Out of 10 guesses` in Anek.
- Poster frame: `.bw-mystery-poster`-style star-corner frame (reuse the pattern).
- Emoji grid card: `.bw-result-card` with paper surface + double-rule border.
- Trivia card: `.bw-result-trivia` with indigo-tinted bg.
- Streak + countdown row: Preserve `<Countdown />` usage.
- Share button: `.bw-share-cta` matchbox-red pill. Text transitions "Share result" → "Copied to clipboard" / "Shared!" preserved.
- Cross-sell row: Preserve the two other-mode links + archive link.
- Close button: `.bw-result-close`, aria-label `Close summary` preserved.

Append CSS.

- [ ] **Step 4: Run — PASS; existing E2E for puzzle flow still green**

```bash
npx vitest run src/components/ResultScreen.test.tsx
npx playwright test e2e/puzzle.spec.ts -g "correct guess|give up"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultScreen.tsx src/components/ResultScreen.test.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): restyle ResultScreen with sunburst/ink variants + Escape dismiss"
```

---

### Task 12: Rewrite PuzzleScreen to use new primitives (Review Focus 2 + 3)

**Files:**
- Modify: `src/components/PuzzleScreen.tsx`

**Interfaces:**
- Consumes: `PuzzleShell`, `PuzzleStatusBar`, `MysteryPoster`, `GuessInput` (new, see below), `PuzzleEmptyState`, `EndOfRoundBanner`, `ConfirmGiveUpSheet`, `PuzzleErrorScreen` from Tasks 2–6.
- Preserves EVERY state transition and API call from today's file. The only new runtime behaviors:
  - Ruling 5: close `hintsOpen` when outcome transitions from `in_progress` to `won|lost`. Add `useEffect(() => { if (outcome !== 'in_progress') setHintsOpen(false); }, [outcome])`.
  - Ruling 6: pass `giveUpDisabled={submitting}` to `PuzzleStatusBar` and `busy={submitting}` to `ConfirmGiveUpSheet` so give-up cannot race an in-flight guess.

- [ ] **Step 1: Decide the `GuessInput` wrapper**

Create `frontend/components/puzzle/GuessInput.tsx` as a thin wrapper around `GuessAutocomplete`:
```ts
type Props = { difficulty: Difficulty; disabled: boolean; disabledIds: Set<string>; onPick: (opt: AutocompleteOption) => void };
// Renders .bw-guess-input container + <GuessAutocomplete {...props} /> + <PuzzleEmptyState /> (when guesses.length === 0 — pass as prop OR render in PuzzleScreen beneath).
```
Actually simpler: don't wrap. Render `<GuessAutocomplete />` directly from `PuzzleScreen` inside a `.bw-guess-input-wrap` div, and render `<PuzzleEmptyState />` below it only when `guesses.length === 0 && stillPlaying`. Skip `GuessInput` component.

Updated plan: scrap `GuessInput`. Keep the wrap div inline in `PuzzleScreen`.

- [ ] **Step 2: Rewrite the component body**

Keep imports and effects for `loadInitial`, `loadFinish`, `handlePick`, `handleHintPick`, `handleGiveUp` identical to today.

New effect:
```ts
useEffect(() => {
  if (outcome !== "in_progress" && hintsOpen) setHintsOpen(false);
}, [outcome, hintsOpen]);
```

Return JSX structure:
```tsx
<PuzzleShell>
  <PuzzleStatusBar
    difficulty={difficulty}
    guessesUsed={guessesUsed}
    stillPlaying={stillPlaying}
    hintsLeft={hintsLeft}
    onOpenHints={() => setHintsOpen(true)}
    onGiveUp={() => setConfirmGiveUp(true)}
    giveUpDisabled={submitting}
  />
  <section className="bw-puzzle-body">
    <MysteryPoster
      posterUrl={state.posterUrl}
      blurPx={state.posterBlurPx}
      alt={stillPlaying ? "Mystery poster, blurred" : "Today's poster"}
    />
    <div className="bw-guess-input-wrap">
      <GuessAutocomplete
        difficulty={difficulty}
        disabled={!stillPlaying || submitting}
        disabledIds={disabledIds}
        onPick={handlePick}
      />
      {stillPlaying && guessesUsed === 0 && <PuzzleEmptyState />}
    </div>
    {outcome !== "in_progress" && answer && (
      <EndOfRoundBanner
        outcome={outcome as "won" | "lost"}
        guessCount={guesses.length}
        answerTitle={answer.title}
        answerYear={answer.year}
        onViewSummary={() => setResultOpen(true)}
      />
    )}
    <section aria-label="Previous guesses" className="bw-guesses-list">
      {[...guesses].reverse().map((g, revIdx) => {
        const originalIdx = guesses.length - 1 - revIdx;
        const isLatest = originalIdx === latestGuessIdxRef.current;
        return <GuessCard key={originalIdx} movie={g.movie} tiles={g.tiles} guessIndex={originalIdx} animate={isLatest} />;
      })}
      {guesses.length === 0 && <div className="bw-guesses-empty">Your guesses will appear here.</div>}
    </section>
    <PuzzleTips />
  </section>

  <HintSheet open={hintsOpen} onClose={() => setHintsOpen(false)} state={hintState} onPick={handleHintPick} busyCategory={hintBusy} />
  <ConfirmGiveUpSheet open={confirmGiveUp && stillPlaying} busy={giveUpBusy} onCancel={() => setConfirmGiveUp(false)} onConfirm={handleGiveUp} />
  {outcome !== "in_progress" && answer && resultOpen && (
    <ResultScreen difficulty={difficulty} outcome={outcome as "won" | "lost"} answer={answer} guesses={guesses} streakAfter={streakAfter} onClose={() => setResultOpen(false)} />
  )}
</PuzzleShell>
```

Return `PuzzleErrorScreen` for the four error/loading branches instead of the inline divs that exist today.

Append CSS for `.bw-puzzle-body`, `.bw-guess-input-wrap`, `.bw-guesses-list`, `.bw-guesses-empty`.

- [ ] **Step 3: Run tsc + vitest + full E2E suite**

```bash
npx tsc --noEmit
npx vitest run --exclude '**/tiles.test.ts'
pkill -f "next dev" 2>/dev/null; sleep 1
npx playwright test
```

Expected: all pre-existing E2E tests pass; new tests from earlier tasks pass. Any Playwright failure here is a selector mismatch introduced by this task — fix selectors in the component to restore test contracts, don't change test expectations.

- [ ] **Step 4: Smoke test the dev server**

```bash
nohup npm run dev > /tmp/spb-pr3.log 2>&1 &
sleep 10
curl -s http://localhost:3000/easy | grep -oE 'bw-puzzle-shell|bw-mystery-poster|bw-autocomplete|bw-guess-card|bw-puzzle-tips' | sort -u
pkill -f "next dev"
```

Expected: all five class markers appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/PuzzleScreen.tsx frontend/styles/puzzle.css
git commit -m "feat(puzzle): rewire PuzzleScreen to new primitives + rulings (hint auto-close, give-up race fix)"
```

---

### Task 13: Update puzzle E2E tests + add keyboard-only test (Review Focus 1)

**Files:**
- Modify: `e2e/puzzle.spec.ts`
- Modify: `e2e/hints.spec.ts`

**Interfaces:** Preserve every behavioral assertion. Update selectors only where class names changed. Add one new test for keyboard-only guess submission.

- [ ] **Step 1: Run the existing suites and triage failing selectors**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npx playwright test e2e/puzzle.spec.ts e2e/hints.spec.ts --reporter=list
```

Record which assertions failed and whether due to (a) class-name mismatch (fix in test), (b) copy change (adjust regex to allow bilingual), or (c) behavior regression (fix in component, not test).

- [ ] **Step 2: Update selectors**

- Any `.font-display`-based selector → use role-based instead.
- Any `/Guess N of 10/` regex → relax to `/Guess N(\s*·\s*\S+)? of 10/i` so the Devanagari sub (`· अनुमान`) is tolerated.
- Any `.text-muted`/`.bg-surface` selector → use role or class from new DOM.
- Keep accessible names (`Open hints`, `Give up`, `Confirm give up`, `View summary`, `Close summary`, `Choose a hint`, `Solved!|Game over`) intact — if any failed, the component regressed.

- [ ] **Step 3: Add a new test — keyboard-only guess submission**

```ts
test("submits a guess via keyboard only (tab → type → ArrowDown → Enter)", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/easy");
  await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
  const combo = page.getByRole("combobox");
  await combo.focus();
  await combo.type("lag");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel(/Guess 1: Lagaan/i)).toBeVisible();
});
```

- [ ] **Step 4: Run — full E2E green**

```bash
npx playwright test
```

- [ ] **Step 5: Commit**

```bash
git add e2e/puzzle.spec.ts e2e/hints.spec.ts
git commit -m "test(e2e): update puzzle + hints selectors for Bollywood DOM; add keyboard-only submission test"
```

---

### Task 14: Final verification + PR

**Files:** none modified.

- [ ] **Step 1: Full build**

```bash
pkill -f "next dev" 2>/dev/null; sleep 1
npm run build 2>&1 | tail -10
```

Expected: success.

- [ ] **Step 2: Vitest (excluding pre-existing tiles.test.ts failure)**

```bash
npx vitest run --exclude '**/tiles.test.ts' 2>&1 | tail -5
```

Expected: all PASS, including the ~15+ new tests across Tasks 1–11.

- [ ] **Step 3: Playwright full suite**

```bash
npx playwright test 2>&1 | tail -5
```

Expected: all pass or project-skipped, 0 failures.

- [ ] **Step 4: Lint (informational)**

```bash
npm run lint 2>&1 | tail -3
```

Record final count. Growth of 1-2 instances of `react-hooks/set-state-in-effect` is expected from the new `useEffect`s in `PuzzleStatusBar`, `ConfirmGiveUpSheet`, and `ResultScreen` — matches the project's established style.

- [ ] **Step 5: Manual QA checklist (dev server, both viewports)**

```
Open http://localhost:3000/easy at 1280x800 and at 390x844 in a mobile device-mode tab.

- Status bar renders bilingual counter at both widths.
- Mystery poster appears framed, blurred initially, un-blurs after each guess.
- Autocomplete opens on type, keyboard nav works, click + Enter + ArrowDown all usable.
- Submit a correct guess → poster un-blurs fully, end-of-round banner appears, hint sheet (if opened) closes automatically.
- Click View summary → ResultScreen opens; press Escape → closes.
- Submit an incorrect guess → GuessCard appears with teal/mustard/matchbox-red tiles + Devanagari numeral in corner.
- Try to give up during an in-flight submit (hard to time; verify button is `disabled` in DevTools when `submitting` is true).
- Open hint sheet, submit winning guess → sheet closes.
- Navigate to a difficulty that has no scheduled puzzle in dev DB → PuzzleErrorScreen renders cream shell with Devanagari headline.
```

- [ ] **Step 6: Push + open PR**

```bash
git push -u origin bollywood-pr3-puzzle-screen
```

The browser URL printed by `git push` opens the PR creation page.

---

## Self-review notes

**Spec coverage:** every section in `2026-10-17-puzzle-screen-design.md` maps to a task.
- §4 tokens + grain overlay → Task 1 + 2.
- §5.1 shell → Task 2 (PuzzleShell).
- §5.2 status bar → Task 6.
- §5.3 mystery poster → Task 3.
- §5.4 guess input (wrapped autocomplete) → Task 7 restyle + inline wrap in Task 12.
- §5.5 end-of-round banner → Task 4.
- §5.6 guess cards → Task 9.
- §5.7 hint sheet → Task 8.
- §5.8 result screen → Task 11.
- §5.9 confirm give-up → Task 5.
- §5.10 puzzle tips → Task 10.
- §5.11 error screens → Task 5.
- §6 preserved-behavior checklist → Task 12 (integration) + Tasks 7/8/9/11 (don't touch logic in restyle).
- §9 rulings 17-20 → ruling 17 defers `/archive` (no task); 18 drops streak chip (no code — Task 6 renders without chip); 19 drives `PuzzleShell` chrome prop (Task 2); 20 means no latest-card prop (Task 9).

**Review Focus pinning:**
- 1 (keyboard-only submission) → Task 13.
- 2 (give-up race) → Task 12 (ruling 6: `giveUpDisabled={submitting}` + ConfirmGiveUpSheet busy prop in Task 5 tests).
- 3 (hint auto-close on outcome flip) → Task 12 (useEffect in PuzzleScreen).
- 4 (no-poster fallback) → Task 3 (MysteryPoster.test.tsx).
- 5 (ResultScreen Escape) → Task 11 (test added before implementing).

**Type consistency:** `TileColor` imported from `@/lib/types` across Task 1 and Task 9. `Difficulty` from `@/lib/difficulty` across Task 6 and Task 12. `onViewSummary: () => void`, `onCancel: () => void`, `onConfirm: () => void`, `onPick: (opt: AutocompleteOption) => void` all consistent.

**Proportion:** 14 tasks, plan ~800 lines, spec ~400 lines. Longer than ideal, but each task carries exact file paths, test code, and signatures — the implementer isn't inferring anything from vague prose. No implementation bodies are transcribed (just signatures); all code blocks are either tests or CSS pins.
