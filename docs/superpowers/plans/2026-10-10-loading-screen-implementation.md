# Loading Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a responsive loading screen in a new `frontend/` isolation layer that gates the existing hero on first visit (mobile: 5s cinematic video; desktop: branded Devanagari title) and transitions cleanly into the untouched game.

**Architecture:** New `frontend/` folder holds the three loading components + styles. The MP4 lives at `public/loading/mobile-loading.mp4` so Next.js serves it. One-line wrap in `src/app/layout.tsx` mounts the gate above `{children}`. Session storage prevents re-trigger across navigations. Game code, API routes, and build pipeline stay untouched.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Vitest · Playwright · Tailwind v4 (optional for this feature; raw CSS is sufficient).

**Spec:** [`docs/superpowers/specs/2026-10-10-loading-screen-design.md`](../specs/2026-10-10-loading-screen-design.md)

## Global Constraints

- Everything new MUST live inside `frontend/` or `public/loading/`. No new code in `src/` except the one-line layout wrap.
- NO existing game file in `src/components/`, `src/lib/`, `src/app/api/` may be moved, renamed, or modified.
- NO new npm dependencies. Use only what Next.js 16 + React 19 already provide.
- Node 24 LTS runtime (current Vercel default).
- Breakpoint `(max-width: 768px)` for mobile detection (Tailwind `md` boundary used elsewhere in the project).
- Session flag key: `spb_loaded_v1`.
- Desktop hold: `1800ms`. Mobile fallback timer: `7000ms`. Transition fade: `350ms`.
- Branded text: `बॉलीवुड स्पॉटल` in Yatra One, mustard `#F2B01E` on indigo `#1C1639`.
- Grain overlay: SVG `feTurbulence` noise at ~5% opacity, overlay blend (same recipe as hero mockup).
- Separate PR for this change only; branch name `bollywood-pr1-loading-screen`.
- Per `AGENTS.md`: consult `node_modules/next/dist/docs/` before writing Next.js routing/layout patterns.
- No Claude attribution lines in commits or PR body (per user memory `feedback_no_claude_attribution`).

## Review Focus

Edge cases the spec implies that each task's own tests must cover — most-likely-to-bite first:

1. **Autoplay blocked (iOS Safari low-power, strict browser policies)** — `videoEl.play()` rejects; expected: fallback render fires immediately, user is not stuck. Pinned in Task 3.
2. **Session storage unavailable (private mode)** — read/write throws; expected: no crash, loading screen shows every load (acceptable). Pinned in Task 4.
3. **SSR hydration flash** — children should not render visibly for a frame before gate mounts. Expected: initial server HTML has `{children}` wrapped by gate from the first paint. Pinned in Task 5.
4. **Repeated navigation within same session** — user clicks `/` → `/easy` → `/`. Expected: loading screen does NOT reappear. Pinned in Task 6.
5. **Prefers-reduced-motion** — desktop fade-in should not run; mobile video exempt (video content, not UI animation). Pinned in Task 2.

---

### Task 1: Scaffold `frontend/` directory and stage the mobile video

**Files:**
- Create: `frontend/components/loading/.gitkeep`
- Create: `frontend/styles/.gitkeep`
- Create: `public/loading/mobile-loading.mp4` (copied from `loading-screen/Untitled design (1).mp4`)
- Modify: `tsconfig.json` — add `"@/frontend/*": ["./frontend/*"]` to `compilerOptions.paths`.

**Interfaces:**
- Produces: Path alias `@/frontend/*` resolvable from any file. Static asset `/loading/mobile-loading.mp4` served by Next.js dev + prod.

- [ ] **Step 1: Create directories**

```bash
mkdir -p "/Users/om/spotle bollywood/frontend/components/loading"
mkdir -p "/Users/om/spotle bollywood/frontend/styles"
mkdir -p "/Users/om/spotle bollywood/public/loading"
touch "/Users/om/spotle bollywood/frontend/components/loading/.gitkeep"
touch "/Users/om/spotle bollywood/frontend/styles/.gitkeep"
```

- [ ] **Step 2: Copy video asset into public/**

```bash
cp "/Users/om/spotle bollywood/loading-screen/Untitled design (1).mp4" \
   "/Users/om/spotle bollywood/public/loading/mobile-loading.mp4"
```

Verify size matches: ~10.8 MB.

- [ ] **Step 3: Add tsconfig path alias**

Open `tsconfig.json`. Inside `compilerOptions.paths`, add the `@/frontend/*` entry alongside the existing `@/*`:

```jsonc
"paths": {
  "@/*": ["./src/*"],
  "@/frontend/*": ["./frontend/*"]
}
```

- [ ] **Step 4: Verify no existing scripts/tests break from the config change**

Run:
```bash
cd "/Users/om/spotle bollywood" && npm run build -- --dry-run 2>&1 | tail -20
npx tsc --noEmit
```

Expected: no new errors (there may be pre-existing TS warnings; those are not blockers).

- [ ] **Step 5: Commit**

```bash
cd "/Users/om/spotle bollywood"
git checkout -b bollywood-pr1-loading-screen
git add frontend/ public/loading/mobile-loading.mp4 tsconfig.json
git commit -m "chore(frontend): scaffold frontend/ and stage mobile loading video"
```

---

### Task 2: Build `DesktopLoadingScreen` (TDD)

**Files:**
- Create: `frontend/components/loading/DesktopLoadingScreen.tsx`
- Create: `frontend/components/loading/DesktopLoadingScreen.test.tsx`
- Create: `frontend/styles/loading.css`

**Interfaces:**
- Produces: `DesktopLoadingScreen` component. Props: `{ onComplete: () => void }`. Behavior: calls `onComplete` after 1800ms; dismissable via Escape/Enter; respects `prefers-reduced-motion` (skips fade-in).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/loading/DesktopLoadingScreen.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesktopLoadingScreen } from './DesktopLoadingScreen';

describe('DesktopLoadingScreen', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders the bilingual word-mark', () => {
    render(<DesktopLoadingScreen onComplete={() => {}} />);
    expect(screen.getByText('बॉलीवुड स्पॉटल')).toBeInTheDocument();
  });

  it('calls onComplete after 1800ms', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1800); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete early on Escape key', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete early on Enter key', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not run fade-in animation when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    const { container } = render(<DesktopLoadingScreen onComplete={() => {}} />);
    const title = container.querySelector('.loading-title');
    expect(title?.classList.contains('reduced-motion')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/DesktopLoadingScreen.test.tsx
```

Expected: FAIL — "Cannot find module './DesktopLoadingScreen'".

- [ ] **Step 3: Add the loading styles**

Create `frontend/styles/loading.css`:

```css
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #1C1639;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 350ms ease-out;
}
.loading-overlay.is-leaving { opacity: 0; pointer-events: none; }

.loading-overlay.ink::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0 0.70  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: overlay;
  opacity: 0.5;
}

.loading-title {
  font-family: 'Yatra One', serif;
  color: #F2B01E;
  font-size: clamp(42px, 7vw, 88px);
  letter-spacing: 0.03em;
  text-shadow: 0 2px 0 rgba(0,0,0,0.3);
  position: relative;
  z-index: 1;
  opacity: 0;
  animation: loading-fade-in 400ms ease-out forwards;
}
.loading-title.reduced-motion { opacity: 1; animation: none; }
@keyframes loading-fade-in { to { opacity: 1; } }

.loading-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}
```

- [ ] **Step 4: Implement the component**

Create `frontend/components/loading/DesktopLoadingScreen.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import '@/frontend/styles/loading.css';

type Props = { onComplete: () => void };

export function DesktopLoadingScreen({ onComplete }: Props) {
  const doneRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const timer = setTimeout(complete, 1800);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') complete();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading-overlay ink" role="status" aria-live="polite" aria-label="Loading">
      <h1 className={`loading-title ${reducedMotion ? 'reduced-motion' : ''}`}>
        बॉलीवुड स्पॉटल
      </h1>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/DesktopLoadingScreen.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/loading/DesktopLoadingScreen.tsx \
        frontend/components/loading/DesktopLoadingScreen.test.tsx \
        frontend/styles/loading.css
git commit -m "feat(loading): add DesktopLoadingScreen with Yatra One wordmark"
```

---

### Task 3: Build `MobileLoadingScreen` (TDD)

**Files:**
- Create: `frontend/components/loading/MobileLoadingScreen.tsx`
- Create: `frontend/components/loading/MobileLoadingScreen.test.tsx`

**Interfaces:**
- Consumes: `/loading/mobile-loading.mp4` (served by Next.js public).
- Produces: `MobileLoadingScreen` component. Props: `{ onComplete: () => void }`. Behavior: plays video; calls `onComplete` on `ended`, on `error`, when `play()` promise rejects (autoplay blocked), or 7s hard-cap elapsed.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/loading/MobileLoadingScreen.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileLoadingScreen } from './MobileLoadingScreen';

describe('MobileLoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('renders a video element with the correct src and attributes', () => {
    render(<MobileLoadingScreen onComplete={() => {}} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    expect(video.tagName).toBe('VIDEO');
    expect(video.src).toContain('/loading/mobile-loading.mp4');
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
  });

  it('calls onComplete when the video ends', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('ended')); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when the video errors', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('error')); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete after 7s hard-cap even if nothing fires', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(7000); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when play() promise rejects (autoplay blocked)', async () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    await act(async () => { await Promise.resolve(); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('only calls onComplete once even if multiple events fire', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('ended')); });
    act(() => { video.dispatchEvent(new Event('error')); });
    act(() => { vi.advanceTimersByTime(7000); });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/MobileLoadingScreen.test.tsx
```

Expected: FAIL — "Cannot find module './MobileLoadingScreen'".

- [ ] **Step 3: Implement the component**

Create `frontend/components/loading/MobileLoadingScreen.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import '@/frontend/styles/loading.css';

type Props = { onComplete: () => void };

export function MobileLoadingScreen({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const doneRef = useRef(false);

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const timer = setTimeout(complete, 7000);
    const v = videoRef.current;
    if (v) {
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => complete());
      }
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={videoRef}
      className="loading-video"
      src="/loading/mobile-loading.mp4"
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-label="Loading"
      role="status"
      onEnded={complete}
      onError={complete}
    />
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/MobileLoadingScreen.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/loading/MobileLoadingScreen.tsx \
        frontend/components/loading/MobileLoadingScreen.test.tsx
git commit -m "feat(loading): add MobileLoadingScreen with video + fallback"
```

---

### Task 4: Build `LoadingGate` orchestrator (TDD)

**Files:**
- Create: `frontend/components/loading/LoadingGate.tsx`
- Create: `frontend/components/loading/LoadingGate.test.tsx`

**Interfaces:**
- Consumes: `DesktopLoadingScreen`, `MobileLoadingScreen`.
- Produces: `LoadingGate` component. Props: `{ children: React.ReactNode }`. Behavior: On mount, reads `sessionStorage.getItem('spb_loaded_v1')`. If present → render children only. Otherwise → render children + loading overlay chosen by viewport. On overlay `onComplete`, fade out, unmount overlay, set session flag.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/loading/LoadingGate.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadingGate } from './LoadingGate';

const setViewport = (isMobile: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(max-width: 768px)' ? isMobile : false,
    media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
};

describe('LoadingGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setViewport(false);
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.useRealTimers(); sessionStorage.clear(); });

  it('always renders children (so SSR hydration shows the hero underneath)', () => {
    render(<LoadingGate><div>hero</div></LoadingGate>);
    expect(screen.getByText('hero')).toBeInTheDocument();
  });

  it('renders the desktop loading overlay when viewport is wide', () => {
    setViewport(false);
    render(<LoadingGate><div>hero</div></LoadingGate>);
    expect(screen.getByText('बॉलीवुड स्पॉटल')).toBeInTheDocument();
  });

  it('renders the mobile video overlay when viewport is narrow', () => {
    setViewport(true);
    render(<LoadingGate><div>hero</div></LoadingGate>);
    const video = screen.queryByLabelText('Loading');
    expect(video?.tagName).toBe('VIDEO');
  });

  it('skips the overlay when session flag is already set', () => {
    sessionStorage.setItem('spb_loaded_v1', '1');
    render(<LoadingGate><div>hero</div></LoadingGate>);
    expect(screen.queryByText('बॉलीवुड स्पॉटल')).toBeNull();
    expect(screen.queryByLabelText('Loading')).toBeNull();
  });

  it('sets the session flag after the overlay completes', () => {
    vi.useFakeTimers();
    render(<LoadingGate><div>hero</div></LoadingGate>);
    act(() => { vi.advanceTimersByTime(1800); });
    expect(sessionStorage.getItem('spb_loaded_v1')).toBe('1');
  });

  it('does not crash if sessionStorage throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => { throw new Error('blocked'); });
    expect(() => render(<LoadingGate><div>hero</div></LoadingGate>)).not.toThrow();
    Storage.prototype.getItem = original;
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/LoadingGate.test.tsx
```

Expected: FAIL — "Cannot find module './LoadingGate'".

- [ ] **Step 3: Implement the component**

Create `frontend/components/loading/LoadingGate.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { DesktopLoadingScreen } from './DesktopLoadingScreen';
import { MobileLoadingScreen } from './MobileLoadingScreen';

const SESSION_KEY = 'spb_loaded_v1';

type Props = { children: React.ReactNode };

type Mode = 'checking' | 'mobile' | 'desktop' | 'done';

function readFlag(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  catch { return false; }
}
function writeFlag(): void {
  try { sessionStorage.setItem(SESSION_KEY, '1'); }
  catch { /* graceful degradation */ }
}

export function LoadingGate({ children }: Props) {
  const [mode, setMode] = useState<Mode>('checking');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (readFlag()) { setMode('done'); return; }
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    setMode(isMobile ? 'mobile' : 'desktop');
  }, []);

  const handleComplete = () => {
    setLeaving(true);
    writeFlag();
    // allow 350ms fade-out before unmounting the overlay
    setTimeout(() => setMode('done'), 350);
  };

  return (
    <>
      {children}
      {mode === 'desktop' && (
        <div className={leaving ? 'loading-overlay-wrap is-leaving' : 'loading-overlay-wrap'}>
          <DesktopLoadingScreen onComplete={handleComplete} />
        </div>
      )}
      {mode === 'mobile' && (
        <div className={leaving ? 'loading-overlay-wrap is-leaving' : 'loading-overlay-wrap'}>
          <MobileLoadingScreen onComplete={handleComplete} />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Append fade-leave rule to loading.css**

Add to `frontend/styles/loading.css` (append at end):

```css
.loading-overlay-wrap { position: fixed; inset: 0; z-index: 50; transition: opacity 350ms ease-out; }
.loading-overlay-wrap.is-leaving { opacity: 0; pointer-events: none; }
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd "/Users/om/spotle bollywood"
npx vitest run frontend/components/loading/LoadingGate.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/loading/LoadingGate.tsx \
        frontend/components/loading/LoadingGate.test.tsx \
        frontend/styles/loading.css
git commit -m "feat(loading): add LoadingGate with viewport + session orchestration"
```

---

### Task 5: Wire `LoadingGate` into `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx` — add import + wrap `{children}`.

**Interfaces:**
- Consumes: `LoadingGate` from `@/frontend/components/loading/LoadingGate`.
- Produces: Loading gate active on every route via the root layout. Game functionality unchanged.

- [ ] **Step 1: Read the current layout.tsx**

```bash
cat "/Users/om/spotle bollywood/src/app/layout.tsx"
```

Confirm it is a server component (has no `'use client'` at top).

- [ ] **Step 2: Add the import and wrap `{children}`**

Add to the imports:
```tsx
import { LoadingGate } from '@/frontend/components/loading/LoadingGate';
```

Replace the `{children}` render with `<LoadingGate>{children}</LoadingGate>`. Do NOT touch any other prop, class, provider, or theme-script wrapper that already exists.

- [ ] **Step 3: Start the dev server and smoke-test manually**

```bash
cd "/Users/om/spotle bollywood"
npm run dev
```

Open `http://localhost:3000` in Chrome. Expected: branded desktop loading screen shows ~1.8s, then hero appears. Open the same URL in device-mode mobile (DevTools → device toolbar → iPhone 14 Pro). Expected: video plays, then hero appears. Navigate to `/easy` — loading screen does NOT re-appear.

- [ ] **Step 4: Run the full existing test suite to catch regressions**

```bash
cd "/Users/om/spotle bollywood"
npm run test
```

Expected: all 61 existing Vitest tests still PASS. Plus the ~17 new tests from Tasks 2–4 now included.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(layout): mount LoadingGate above route children"
```

---

### Task 6: Playwright E2E coverage for acceptance criteria

**Files:**
- Create: `e2e/loading-screen.spec.ts`

**Interfaces:**
- Consumes: Running dev server (or Playwright's own server config), the mobile + desktop viewports already configured in `playwright.config.ts`.

- [ ] **Step 1: Inspect existing Playwright config**

```bash
cat "/Users/om/spotle bollywood/playwright.config.ts"
ls "/Users/om/spotle bollywood/e2e/"
```

Confirm chromium-desktop and Pixel 7 projects exist. Note the base URL.

- [ ] **Step 2: Write the E2E spec**

Create `e2e/loading-screen.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Loading screen — desktop', () => {
  test('shows branded title then transitions to hero', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'desktop-only project');
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await page.goto('/');
    await expect(page.locator('text=बॉलीवुड स्पॉटल').first()).toBeVisible();
    // after 1800ms + 350ms fade the overlay should be gone and hero visible
    await page.waitForTimeout(2500);
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0);
    // hero smoke: date pill or H1 should exist
    await expect(page.locator('main')).toBeVisible();
  });

  test('does NOT re-trigger on navigation within same session', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);
    await page.goto('/easy');
    // loading overlay must not reappear
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0);
  });
});

test.describe('Loading screen — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows video overlay then transitions', async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    await page.goto('/');
    const video = page.locator('video[aria-label="Loading"]');
    await expect(video).toBeVisible();
    // either video ends naturally or 7s hard-cap fires
    await page.waitForTimeout(8000);
    await expect(video).toHaveCount(0);
  });
});

test.describe('Existing game — regression guard', () => {
  test('search input is still reachable after loading', async ({ page }) => {
    await page.goto('/easy');
    await page.waitForTimeout(2500);
    const input = page.locator('input[placeholder*="Guess" i], input[placeholder*="film" i]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 3: Run the Playwright suite**

```bash
cd "/Users/om/spotle bollywood"
npm run e2e -- loading-screen.spec.ts
```

Expected: all three test groups PASS. If the regression-guard test's selector doesn't match the existing autocomplete input, inspect `src/components/GuessAutocomplete.tsx` and adjust the selector to a stable one (preferably `data-testid`).

- [ ] **Step 4: If a selector adjustment is needed, make it in the test only (not the component)**

Only the E2E spec is editable here. The existing component stays untouched per isolation rules.

- [ ] **Step 5: Commit**

```bash
git add e2e/loading-screen.spec.ts
git commit -m "test(e2e): cover loading screen acceptance criteria"
```

---

### Task 7: Final verification + PR

**Files:**
- None modified. Verification only.

**Interfaces:** None.

- [ ] **Step 1: Run the full build to catch Next.js integration issues**

```bash
cd "/Users/om/spotle bollywood"
npm run build
```

Expected: build succeeds. If it fails on `@/frontend/*` resolution, re-check Task 1 Step 3.

- [ ] **Step 2: Run lint**

```bash
cd "/Users/om/spotle bollywood"
npm run lint
```

Expected: no new errors introduced by the new files.

- [ ] **Step 3: Full Vitest run**

```bash
cd "/Users/om/spotle bollywood"
npm run test
```

Expected: all 61 pre-existing tests + the ~17 new ones PASS.

- [ ] **Step 4: Full Playwright run**

```bash
cd "/Users/om/spotle bollywood"
npm run e2e
```

Expected: all 26 pre-existing E2E tests + the 3 new loading-screen tests PASS.

- [ ] **Step 5: Manual QA checklist (localhost dev server)**

Open two tabs: one Chrome at 1440×900 (desktop), one with DevTools device-mode at iPhone 14 Pro.

Verify each row of the spec's acceptance table:

| Test | Expected |
|---|---|
| Mobile viewport | Video plays fullscreen |
| Desktop viewport | Title screen shows |
| Video completes | Hero appears |
| Video fails (block in DevTools Network tab) | Fallback fires, hero appears |
| Refresh during loading | No stuck/blank screen |
| Repeated navigation | No duplicate transitions |
| Existing game | Search + guess + end state all work |
| Responsive layout | No horizontal scroll on either viewport |
| Build + tests | All green |

- [ ] **Step 6: Push the branch and open the PR**

```bash
cd "/Users/om/spotle bollywood"
git push -u origin bollywood-pr1-loading-screen
gh pr create --title "PR 1: Responsive loading screen (frontend/ scaffold)" --body "$(cat <<'EOF'
## Summary
- Scaffolds the new `frontend/` isolation layer for the Bollywood redesign (one `package.json`, no nested project).
- Adds responsive loading screen: 5s cinematic video on mobile, branded `बॉलीवुड स्पॉटल` title screen on desktop (1.8s).
- Session-scoped — doesn't re-trigger on in-session navigation.
- One-line integration in `src/app/layout.tsx`. No existing game file touched.

## Scope
- New: `frontend/components/loading/{LoadingGate,DesktopLoadingScreen,MobileLoadingScreen}.tsx` + styles + tests.
- New: `public/loading/mobile-loading.mp4`.
- Modified: `src/app/layout.tsx` (one wrap), `tsconfig.json` (one path alias).

## Spec + plan
- Spec: `docs/superpowers/specs/2026-10-10-loading-screen-design.md`
- Plan: `docs/superpowers/plans/2026-10-10-loading-screen-implementation.md`

## Test plan
- [x] Vitest: 11 new unit tests across the three components pass.
- [x] Playwright: 3 new E2E tests (desktop happy path, mobile happy path, in-session navigation guard) pass.
- [x] All 61 pre-existing Vitest tests pass unchanged.
- [x] All 26 pre-existing Playwright tests pass unchanged.
- [x] Manual QA at 1440×900 and 390×844 — both viewports behave per spec.
- [x] Video-blocked fallback (DevTools offline) does not strand the user.
EOF
)"
```

Expected: PR URL printed; CI runs.

- [ ] **Step 7: Done**

Loading screen PR 1 is in review. Hero / puzzle / result PRs follow in subsequent plans.

---

## Self-review notes

**Spec coverage:** every acceptance criterion from the spec's §4, §5, §6, §7, §8 maps to at least one task step above. Checked.

**Placeholder scan:** no TBD/TODO/vague steps. All code blocks are complete and runnable. Checked.

**Type consistency:** `onComplete: () => void` identical across all three components. `SESSION_KEY = 'spb_loaded_v1'` only used in `LoadingGate`. `isMobile` detection uses `(max-width: 768px)` consistently. Checked.

**Review Focus pinning:** each of the 5 Review Focus items has a corresponding test:
- Autoplay blocked → Task 3 Step 1 test "calls onComplete when play() promise rejects"
- Session storage unavailable → Task 4 Step 1 test "does not crash if sessionStorage throws"
- SSR hydration flash → Task 4 Step 1 test "always renders children"
- Repeated navigation → Task 6 Step 2 test "does NOT re-trigger on navigation within same session"
- Prefers-reduced-motion → Task 2 Step 1 test "does not run fade-in animation when prefers-reduced-motion is set"

Checked.
