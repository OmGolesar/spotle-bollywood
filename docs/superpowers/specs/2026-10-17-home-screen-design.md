# Home Screen — Bollywood Redesign PR 2

**Status:** Design spec, approved 2026-10-17.
**Parent spec:** [`2026-10-08-bollywood-redesign-design.md`](./2026-10-08-bollywood-redesign-design.md) — overall redesign direction.
**Design authority:** `.superpowers/brainstorm/.../end-to-end.html` (approved mockup, 2026-10-10) + the parent spec's tokens/type.
**Target branch:** `bollywood-pr2-home-screen` (stacked on `bollywood-pr1-loading-screen`).
**Previous PR (dependency):** `bollywood-pr1-loading-screen` — loading screen + Yatra One font variable + CSS tokens already present.

---

## 1. Intent

Port the approved end-to-end mockup's home screen into real Next.js code on top of the existing component architecture, so the home experience matches the loading screen's Bollywood identity (indigo + mustard + Yatra One + Devanagari + grain) and feels production-polished. Nothing about the game, routing, or data changes.

## 2. Scope

**In scope:**
- Replace the home page (`src/app/page.tsx`) presentation with the mockup's structure (inline util bar + rotating-poster hero + mode cards + info strips + how-it-works + attributes + FAQ + final CTA + footer).
- Restyle the home-page-only components in-place (`src/components/ModeCard.tsx`, `src/components/home/HowItWorks.tsx`, `src/components/home/GameAttributes.tsx`, `src/components/home/FaqAccordion.tsx`, `src/components/HowToPlaySheet.tsx` — modal visuals only, behavior preserved).
- Add the Bollywood design tokens (palette + motifs) as reusable CSS primitives in `frontend/styles/bollywood-tokens.css` and `frontend/components/motifs/*` (consumed by home-screen components; future PRs will consume them too).
- Copy the hero posters into `public/home/` for the rotating hero carousel.
- Update the home E2E test (`e2e/home.spec.ts`) to match new copy/selectors.
- Preserve all existing behavior: streak reads, difficulty routes (`/easy|/medium|/hard`), HowToPlaySheet open/close, archive-strip link to `/archive`, FAQ accordion open/close, bottom CTA → `/easy`, footer links.

**Out of scope:**
- `SiteHeader.tsx` (used on `/archive` and `/admin/login`) — NOT modified. Home replaces its usage with an inline util bar; the shared component keeps its current look for the other two routes until future PRs touch them.
- `GuessCard.tsx` — used both in `HowItWorks` and the real puzzle screen. Visual tweaks only, no structural change. (A future PR for the puzzle screen will do the deeper rework.)
- `/archive`, `/admin/*`, `/[difficulty]`, API routes — untouched.
- The `ThemeToggle` component — not deleted; home just stops using the `SiteHeader` that wraps it. Toggle disappears from the home surface; still available on `/archive` and `/admin/login`. Final removal defers to a later cleanup PR.
- Any new npm dependencies.

**Anti-goals:**
- No regression on existing E2E coverage (hint picker, puzzle flow, admin gating must still pass).
- No change to the Bollywood identity we locked in PR 1 — this PR extends, doesn't redefine.

## 3. Design authority

The source of truth for the visual composition is the approved mockup section-by-section, cross-referenced with the parent redesign spec for tokens.

| Section | Mockup reference | Parent-spec section |
|---|---|---|
| Hero (util bar, star rails, rotating poster, dots, date pill, bilingual tagline, PLAY pill, difficulty row) | `end-to-end.html` §01 "Landing" top | §4 palette, §5.1 landing |
| Mode cards (Easy/Medium/Hard with streaks, badges, blurbs, pool hints) | `end-to-end.html` mode-grid | §5.1 mode cards |
| Info strips (midnight + how-to-play, past-puzzles + archive) | `end-to-end.html` info-strip | §5.1 |
| How it works (3 steps + 2 demo guess cards) | `end-to-end.html` step-stack | §5.1 how-it-works |
| Attributes (8 tiles meaning) | `end-to-end.html` attr-grid | §5.1 attributes |
| FAQ (10 Qs, Yatra One summaries) | `end-to-end.html` faq | §5.1 FAQ |
| Final CTA + footer | `end-to-end.html` final-cta + foot | §5.1 bottom CTA |

## 4. Visual system (extends PR 1)

Reuse everything from PR 1's loading screen:
- Palette: `--ink`, `--ink-deep`, `--paper`, `--matchbox-red`, `--mustard`, `--pink`, `--royal`, `--teal`, `--charcoal`, `--paper-dim`, `--paper-mute`.
- Fonts: Yatra One (`--font-yatra-one`), Anek Devanagari (new on home), Baloo Bhai 2 (new on home).
- Grain SVG overlay.

New in this PR:
- Anek Devanagari + Baloo Bhai 2 loaded via `next/font/google` in `src/app/layout.tsx` (same pattern as Yatra One in PR 1).
- `--font-anek-devanagari` and `--font-baloo-bhai-2` CSS variables.
- `frontend/styles/bollywood-tokens.css` — exports CSS classes for recurring primitives: `.bw-eyebrow`, `.bw-section-head`, `.bw-pill-mustard`, `.bw-pill-outline-ink`, `.bw-pill-outline-paper`, `.bw-info-strip`, grain overlay utility.
- `frontend/components/motifs/StarRail.tsx` — the decorative column of stars flanking the hero.
- `frontend/components/home/BollywoodHero.tsx` — the rotating poster hero (consumes `/home/*.png` posters, falls back to `title-logo.png` if any missing).

## 5. Preserved functionality (acceptance checklist)

Each of these MUST still work on the new home page:
- [ ] Date eyebrow shows IST display date, server-rendered (`istDisplayDate()`).
- [ ] Three mode cards render with correct streak numbers and `playedToday` state from `loadStreakState()`.
- [ ] Each mode card is a link to `/easy|/medium|/hard`.
- [ ] "How to play" link in the midnight-reset info strip opens the existing `HowToPlaySheet` modal.
- [ ] Archive strip link routes to `/archive` (existing route).
- [ ] HowItWorks' two embedded demo `GuessCard`s render using existing `DEMO_PARTIAL_*` / `DEMO_WIN_*` data.
- [ ] FAQ accordion expands/collapses on click; all 10 existing questions preserved.
- [ ] Bottom CTA button links to `/easy`.
- [ ] Footer author link routes to the LinkedIn URL and the email link opens mail compose.
- [ ] `/auth/callback` redirect logic at the top of `page.tsx` is preserved verbatim.

## 6. Structural changes (not purely visual)

Flagged separately so review can scrutinize:

- **Hero text headline is removed.** Current prod has "Guess today's mystery Bollywood film." as an `<h1>`. The new hero's `<h1>` is the Devanagari + English tagline from the mockup ("आज की फ़िल्म पहचानिए — दस कोशिशों में / Guess today's film in 10 tries"). SEO: the `<title>` and meta description in `src/app/layout.tsx` are unchanged, so Google still sees the same product-level copy.
- **Home no longer uses `SiteHeader`.** The home page renders its own inline util bar (bilingual word-mark left, streak chip right). SiteHeader keeps living in the repo for `/archive` and `/admin/login`.
- **FAQ copy color-term update.** Two FAQ answers reference tile colors ("green/gold/grey"). They now read "teal/mustard/red" to match the new tile semantics locked in the parent spec. Everything else about those FAQs is unchanged.

## 7. Responsive behavior

- **Mobile (<720px):** mode grid stacks (1 col); attr grid stacks (2 col); star rails hidden; tagline + PLAY scale down via `clamp()`; FAQ summaries stay readable; info strips reflow vertical if needed.
- **Desktop (>=720px):** mode grid 3 col; attr grid 4 col; star rails visible flanking the hero; hero poster capped at `min(50vh, 440px)` so it never dominates.
- Tested on Playwright projects `chromium-desktop` (1280×800) and `chromium-mobile` (Pixel 7).

## 8. Testing

### Unit (Vitest)
- The new `BollywoodHero` component's poster rotation logic (cycle index, interval cleanup on unmount, respect `prefers-reduced-motion`) — 3-4 small tests under `frontend/components/home/BollywoodHero.test.tsx`.
- No new tests for tokens CSS or motif SVGs (static CSS/markup, covered via E2E visual presence checks).

### E2E (Playwright)
Update `e2e/home.spec.ts` selectors/copy to match new structure. New assertions:
- Util bar renders bilingual word-mark.
- Rotating-poster hero exists (at least one `img` with `/home/` src or title-logo).
- Three mode cards link to the correct difficulty route.
- "How to play" opens the HowToPlaySheet modal.
- 10 FAQ accordion items present; clicking the first expands it.
- Bottom CTA routes to `/easy`.

Preserve the existing hints.spec.ts, puzzle.spec.ts, admin.spec.ts, and loading-screen.spec.ts — all must still pass.

## 9. Rollout

- Branch `bollywood-pr2-home-screen` stacks on `bollywood-pr1-loading-screen`.
- CI runs on every push (added as first commit of this PR).
- Vercel preview on every push shows the integrated loading screen + new home screen.
- No merge to `main` until the full UI redesign series is done.

## 10. Resolved rulings (post builder-check)

Builder review surfaced 11 questions. Om answered the one copy-fidelity decision; the rest I settled as a sensible builder would.

| # | Question | Resolution |
|---|---|---|
| 1 | Hero PLAY & difficulty chips semantics | **PLAY** routes to `/easy`. **Each chip** is a direct link to `/easy|/medium|/hard`. No stateful difficulty selector in the hero. Simplest hover-less navigation, zero new state. |
| 2 | Which streak drives the util-bar `★ 4` chip | Easy streak. Render the chip only when at least one of the three streaks is ≥ 1. All-zero state hides the chip. |
| 3 | BollywoodHero rotation details | 5-second interval, 900ms crossfade. Six posters copied to `public/home/` with the names from the mockup fallback (`title-logo.png`, `poster-01-retro.png`, `poster-02-halftone.png`, `poster-03-rose.png`, `poster-04-matchbox.png`, `poster-05-devanagari.png`). `title-logo.png` is slide 1 AND the single-slide fallback. Dots are decorative indicators (not clickable). Aspect ratio locked at `1134 / 1340` with the poster capped at `min(50vh, 440px)` on desktop and `min(44vh, 380px)` on mobile. `prefers-reduced-motion` → show `title-logo.png` only; no cycle, no dots. |
| 4 | HowToPlaySheet integration | Preserve current pattern — the component owns its trigger button. The info-strip pill restyles the trigger via a new `className` prop (optional, defaults to current styling), zero behavior change. No API break. |
| 5 | Where shared tokens live | Promote the palette from `frontend/styles/loading.css` into a new `frontend/styles/bollywood-tokens.css`, imported once from `src/app/globals.css` so every component sees them without extra imports. `loading.css` trims to loading-specific rules only. |
| 6 | Component placement | New primitives go in `frontend/components/motifs/` and `frontend/components/home/`. Existing home components (`ModeCard.tsx`, `home/HowItWorks.tsx`, `home/GameAttributes.tsx`, `home/FaqAccordion.tsx`) are restyled **in place** in `src/`. No migration this PR. |
| 7 | Copy fidelity | **Om chose: ship mockup copy verbatim.** All bilingual eyebrows ("CHOOSE YOUR MATCHBOX"), the Hindi tagline, `PLAY · खेलें`, Devanagari numerals in demo tile corners, section headings. Preserve existing prod copy only where the mockup didn't change it (FAQ answers, GameAttributes descriptions, footer author/email). |
| 8 | Demo guess cards | Build a bespoke `DemoGuessCard` matching the mockup (small poster + bilingual tiles with Devanagari numerals + shortened labels like "A. Gowariker"). Lives in `frontend/components/home/DemoGuessCard.tsx`. The real `GuessCard.tsx` is untouched — the puzzle PR owns that. Minimal new copy additions to `src/components/home/demoCardData.ts` (Devanagari numeral strings + short-form director names). |
| 9 | GameAttributes copy | Keep existing descriptions ("Who helmed the film." etc.). Only visual treatment changes. |
| 10 | SEO + auth-callback | `/auth/callback` passthrough block lifted verbatim (`export const dynamic = "force-dynamic"`, searchParams typing, redirect logic). Visible H1 is the bilingual tagline (`<h1>` with Devanagari+English); add a visually-hidden `<h1>` saying "Spotle Bollywood — guess today's mystery Hindi film" ONLY IF the Devanagari H1 trips a Lighthouse SEO warning in CI. Default: single Devanagari H1 with lang attribute. |
| 11 | Final CTA label | Mockup's bilingual string verbatim: `▶ PLAY TODAY'S FILM · खेलें`. Routes to `/easy`. |

Everything in this table is now locked for implementation; the plan can treat them as settled.
