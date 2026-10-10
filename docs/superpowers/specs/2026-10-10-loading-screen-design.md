# Loading Screen — Bollywood Redesign PR 1

**Status:** Design spec, approved 2026-10-10.
**Parent spec:** [`2026-10-08-bollywood-redesign-design.md`](./2026-10-08-bollywood-redesign-design.md) — this is PR 1 of the phased frontend rebuild.
**Target branch:** `bollywood-pr1-loading-screen` (cut from `main`).

---

## 1. Scope

Build the responsive loading screen that gates the existing hero on first visit. Two experiences by viewport. Everything else in the app stays untouched.

**In scope:**
- `frontend/` folder as a new isolation layer for the Bollywood UI (components + static assets, inside the existing Next.js monorepo).
- Mobile loading screen: a 5s cinematic video (`loading-screen/Untitled design (1).mp4`), fullscreen, autoplay+muted+inline.
- Desktop loading screen: branded "बॉलीवुड स्पॉटल" title in Yatra One mustard on `--ink-deep` indigo with grain, intentional ~1800ms hold.
- One-line integration in `src/app/layout.tsx` that wraps `{children}` with `<LoadingGate>`.
- Fallback behavior for autoplay-blocked / failed-load / privacy-mode scenarios.
- Session-scoped: screen shows once per session, so navigation between game routes doesn't re-trigger.
- Playwright E2E coverage of all acceptance criteria.

**Out of scope (future PRs):**
- Any redesign of hero, puzzle, result, modals.
- Any change to game logic, API routes, data pipeline, admin UI.
- Any change to Vercel deploy configuration or env vars.
- Any new npm dependencies beyond what Next.js already provides.

---

## 2. Resolved architectural decisions

### 2.1 `frontend/` structure (approved by Om 2026-10-10)

Logical isolation layer inside the existing Next.js app — **not** a nested project.

```
repository/
├─ frontend/                      ← NEW
│  ├─ components/
│  │  └─ loading/
│  │     ├─ LoadingGate.tsx
│  │     ├─ MobileLoadingScreen.tsx
│  │     └─ DesktopLoadingScreen.tsx
│  └─ styles/
│     └─ loading.css
├─ public/
│  └─ loading/
│     └─ mobile-loading.mp4       ← NEW (video copied here; Next.js serves /public at /)
├─ src/
│  └─ app/
│     └─ layout.tsx               ← ONE-line integration
└─ package.json                   ← unchanged (one package.json)
```

**Why `public/loading/mobile-loading.mp4` and not `frontend/assets/`?** Next.js only serves files from `public/` at the request root. The user-provided spec diagram showed `frontend/public/assets/` which assumes a nested Next.js project; our Option B integration uses the existing single Next.js `public/`. This is the one necessary deviation from the diagram.

**Why TypeScript `.tsx` and not plain React?** Project is TypeScript strict throughout; mixing JS would break tsconfig invariants.

### 2.2 Viewport detection

JavaScript (`window.matchMedia('(max-width: 768px)')`) at mount, inside the client component. Not userAgent sniffing (brittle for tablets, split-screen windows). Breakpoint 768px matches Tailwind `md` boundary already used elsewhere in the project.

### 2.3 Session persistence

`sessionStorage.getItem('spb_loaded_v1')`. If present → render children directly. Otherwise → render loading screen, set flag on completion.

- `sessionStorage` (not `localStorage`): user gets the loading experience fresh each new browser session, not just once per device.
- Versioned key (`_v1`): if we ever reshoot the video, bump to invalidate stored flags.
- Graceful degradation: if `sessionStorage` is unavailable (private mode in some browsers), fall through to always-show. Acceptable UX; no error UI needed.

### 2.4 Transition pattern

- Loading screen renders as a `position: fixed; inset: 0; z-index: 50` overlay above `{children}`.
- On completion → `opacity: 0` over 350ms → unmount → set session flag.
- `{children}` are rendered server-side underneath from the start (SSR intact) so there's no post-load hero flash or layout shift.

### 2.5 Desktop timing

**1800ms hold** before transition. Chosen to be perceptible as a branded moment but short enough that it doesn't feel like loading theatre. Not configurable; not random.

### 2.6 Mobile video handling

- `<video>` element with `autoPlay`, `muted`, `playsInline`, `preload="auto"`.
- `onEnded` → complete.
- `onError` → complete immediately (don't block user on broken media).
- Fallback safety timer: **7 seconds** from mount. Covers:
  - Autoplay blocked (iOS Safari with low power mode, some browsers' policies).
  - Video never reaches `ended` (long buffering, decoding issues).
  - Lost `onEnded` event (edge-case browsers).
- Attempt `videoEl.play()` imperatively on mount — Promise rejection → trigger fallback immediately.

### 2.7 Fallback render for mobile when video fails

Not the desktop title screen (that's branded differently). Instead: `--ink-deep` background with the same `बॉलीवुड स्पॉटल` word-mark the desktop uses, held for 1500ms. Keeps the loading moment on-brand even when media fails.

### 2.8 Accessibility

- Both screens: `role="status"`, `aria-live="polite"`, `aria-label="Loading"`.
- Prefers-reduced-motion: desktop static-only (no scale/fade-in). Mobile video still plays (video content is not animation per WCAG) but captions N/A (muted purely visual).
- Keyboard: `Escape` or `Enter` dismisses the loading screen early → immediate transition. Nice-to-have; included.

---

## 3. Visual language (locked)

Both screens use the tokens from the parent redesign spec:

| Token | Hex | Role here |
|---|---|---|
| `--ink-deep` | `#1C1639` | Background on both desktop + mobile fallback |
| `--mustard` | `#F2B01E` | Title text color |
| `--paper-mute` | `#C9BFA5` | Any secondary text if used |
| `--paper` | `#F5EDD9` | Grain tint target |

**Desktop:**
- Full-viewport `--ink-deep` with grain overlay (same SVG `feTurbulence` noise as the hero, ~5% opacity, overlay blend).
- Centered **बॉलीवुड स्पॉटल** in **Yatra One**, mustard, `clamp(42px, 7vw, 88px)`, letter-spacing 0.03em, with a subtle drop-shadow (`0 2px 0 rgba(0,0,0,0.3)`) for depth that matches the hero's wordmark treatment.
- No icons, no spinners, no progress bars. The text IS the loading.
- Subtle motion (unless reduced-motion): mustard text fades in from `opacity 0 → 1` over 400ms on mount, nothing after.

**Mobile:**
- Full-viewport `<video>`, `object-fit: cover`, no padding, no chrome.
- Black background (`#000`) under the video so letterboxing doesn't flash indigo if aspect ratios mismatch.
- No controls, no scrollbars, no overflow.

---

## 4. Mobile loading behavior (acceptance details)

1. Mount → detect viewport ≤ 768px → render `MobileLoadingScreen`.
2. Video element mounted with `autoPlay muted playsInline preload="auto" src="/loading/mobile-loading.mp4"`.
3. `videoEl.play()` called imperatively (returns Promise; if rejected → onError path).
4. Normal path: video plays → `onEnded` → complete.
5. Error path: `onError` → complete immediately.
6. Timeout path: 7s elapsed → complete regardless.
7. Any of (4)/(5)/(6) → set session flag, fade overlay, unmount.

## 5. Desktop loading behavior (acceptance details)

1. Mount → detect viewport > 768px → render `DesktopLoadingScreen`.
2. Fade-in animation runs (unless reduced-motion).
3. `setTimeout(onComplete, 1800)` scheduled.
4. On complete → set session flag, fade overlay, unmount.
5. User can press `Escape` or `Enter` to skip immediately.

---

## 6. Integration contract

### 6.1 `LoadingGate` prop API

```ts
// frontend/components/loading/LoadingGate.tsx
type Props = { children: React.ReactNode };
// Renders children directly if session flag already set.
// Otherwise renders overlay + children; overlay unmounts on complete.
```

### 6.2 Change to `src/app/layout.tsx`

Exactly one wrapping element added inside `<body>`:

```tsx
import { LoadingGate } from "@/frontend/components/loading/LoadingGate";
// ...
<body>
  <LoadingGate>
    {children}
  </LoadingGate>
</body>
```

### 6.3 TSConfig path alias

Add one path alias so `@/frontend/*` resolves cleanly:

```jsonc
// tsconfig.json compilerOptions.paths
{
  "@/*": ["./src/*"],
  "@/frontend/*": ["./frontend/*"]
}
```

This is the only root-level config change required. Justified by the Option B structure.

---

## 7. Testing

### Unit (Vitest)

- `LoadingGate`: renders children only when session flag set; renders Mobile on `max-width: 768px`; renders Desktop otherwise; sets session flag on completion; falls through gracefully when sessionStorage throws.
- `MobileLoadingScreen`: renders video with correct src/attrs; calls `onComplete` on `ended`; calls `onComplete` on `error`; calls `onComplete` after 7s timeout; shows word-mark fallback if `play()` rejects.
- `DesktopLoadingScreen`: renders title; calls `onComplete` after 1800ms; respects `prefers-reduced-motion` (no animation class); dismisses on Escape/Enter.

### E2E (Playwright)

- Mobile viewport (Pixel 7): on home load, video element visible fullscreen; after video ends, hero visible.
- Desktop viewport (chromium): on home load, title visible; after ≤ 2500ms, hero visible.
- Refresh during loading: no console errors, no stuck overlay.
- Navigation from `/` → `/easy` within same session: loading screen does NOT re-appear.
- Existing game smoke: typing a guess still works after loading. (Regression guard.)

---

## 8. Isolation guarantees (checklist)

- [ ] No existing file in `src/` is moved or renamed.
- [ ] No existing game logic in `src/components/`, `src/lib/`, or `src/app/api/` is touched.
- [ ] No existing API route behavior changes.
- [ ] No new dependencies added to `package.json`.
- [ ] No change to `next.config.ts` beyond what's needed (expected: nothing).
- [ ] No change to env vars, Supabase schema, or Vercel settings.
- [ ] Only root files modified: `src/app/layout.tsx` (one wrap), `tsconfig.json` (one path alias).

---

## 9. Open questions

None. All design and integration decisions resolved.
