# Spotle Bollywood — v2 Visual Redesign (Bollywood Edition)

**Status:** Design spec. Not yet implemented. Target branch: `bollywood-redesign` (not yet created).
**Date:** 2026-10-08
**Author:** Om Golesar (sanketshirode7294) with Claude Code
**Supersedes visual direction of:** `2026-10-02-bollywood-spotle-design.md` (v1 game spec remains the source of truth for game mechanics; this doc replaces only the visual language).

---

## 1. Context & intent

v1 of Spotle Bollywood shipped as an "understated indie" game — cream + warm gold + Fraunces/Inter, deliberately quiet. It works, but it does not visually signal "Bollywood" or feel rooted in Indian pop/print culture.

**Goal:** redesign the visual identity so the product reads as a love letter to Hindi cinema and Indian graphic design — matchbox labels, hand-painted film posters, lobby cards, truck art, wedding cards, vintage advertisements. Loud, confident, bilingual. The game mechanics do not change.

**Non-goals:**
- No change to game logic, API, data model, admin backend.
- No new routes beyond those already in v1.
- No change to the content pipeline (TMDB / Wikipedia enrichment).

**Rollout constraint:** build and iterate on `localhost` only. **Nothing pushes to Vercel or `main`** until Om explicitly green-lights. The live site at `spotle-bollywood.vercel.app` must remain untouched throughout development.

---

## 2. Research summary

Four reference sites were researched in parallel (full briefs in session transcripts):

- **artsandculture.google.com/project/hindi-cinema** — institutional neutral chrome, imagery carries color. Lesson: let posters be loud, let one surface class stay quiet.
- **artsandculture.google.com/partner/cinemaazi** — editorial story rails, faceted browse, zero decorative chrome. Lesson: editorial storytelling as a landing device.
- **map-india.org** — Western-museum discipline applied to Indian content. Lesson: typographic section dividers at scale beat ornamental borders.
- **ektype.in** — Indian multi-script type foundry. Lesson: a free stack (Yatra One + Anek Devanagari + Baloo Bhai 2) fully covers the brief without paid licenses.

**Takeaway:** the institutional refs push restraint; the Pinterest board (matchbox labels, hand-painted posters, truck art, wedding cards) pushes maximalism. Resolution: **loud on the landing, disciplined on the puzzle screen** — the design has two modes with the same DNA.

---

## 3. Design decisions (locked)

| Decision | Choice |
|---|---|
| **Intensity** | Full maximalism — poster-as-UI |
| **Primary visual anchor** | Matchbox + hand-painted film poster, elevated by the custom lobby-card logo |
| **Puzzle screen treatment** | Disciplined — cream canvas, saturated tiles, ornament only on card edges |
| **Bilingual** | Devanagari + Latin co-equal in display; Latin leads in dense UI chrome |
| **Landing structure** | Minimal hero like spotle.movie — logo + date + tagline + one PLAY CTA + difficulty row. HowItWorks/Attributes/FAQ demoted to modal or footer |
| **Dark mode** | Dropped. One designed look: dark cinematic hero, cream paper game surface |
| **Branch strategy** | Phased on `bollywood-redesign`: tokens → hero → game screen → secondary surfaces → cleanup |
| **Type licensing** | Free stack only (Google Fonts): Yatra One, Anek Devanagari, Baloo Bhai 2 |

---

## 4. Visual system

### 4.1 Palette

Extracted from `assets/title-logo.png`. Hex values below are approximate anchors; final values should be color-picked from the asset when wiring tokens.

| Token | Role | Hex |
|---|---|---|
| `--ink` | hero backdrop, dark surfaces | `#2B2250` (deep indigo-purple, logo border tone) |
| `--ink-deep` | lower-canvas gradient target | `#1C1639` |
| `--paper` | game surface, cards, result screens | `#F5EDD9` (aged cream) |
| `--matchbox-red` | primary CTA, "wrong" tiles, bold accents | `#D63024` |
| `--mustard` | PLAY pill, "close" tiles, highlights | `#F2B01E` |
| `--pink` | paisley accents, hover, decorative | `#E8328A` |
| `--royal` | tile frames, hover underline | `#2E52A6` |
| `--teal` | "exact" tiles, success states | `#0E7E7E` |
| `--charcoal` | body type on cream | `#1A1612` |
| `--paper-dim` | muted type on cream | `#857C65` |
| `--paper-mute` | muted type on ink | `#C9BFA5` |

**Tile semantics (replaces v1 green/yellow/gray):**
- **Teal `--teal`** = exact match
- **Mustard `--mustard`** = close / partial
- **Matchbox-red `--matchbox-red`** = wrong

Rationale: gives the game its own voice while preserving Wordle-grade clarity. All three colors already live in the logo, so the game surface and the landing speak the same language.

### 4.2 Typography

All three faces free via `next/font/google`, loaded once in `src/app/layout.tsx` with `display: 'swap'`.

| Face | Role | Weights |
|---|---|---|
| **Yatra One** | Display headlines, taglines, section eyebrows, PLAY CTA. Devanagari + Latin, single weight. Bollywood poster character. | 400 |
| **Anek Devanagari** | Body copy, UI chrome, buttons, forms, tile labels. Variable, multi-script. | 400, 500, 600, 700 |
| **Baloo Bhai 2** | Playful accents — streak badge, small eyebrow labels, bilingual date pills. | 500, 700 |

**Drop:** Fraunces, Inter. All current typography replaced.

### 4.3 Motifs (SVG, inlined)

Five reusable decorative primitives, each <5KB inline SVG, exported from a new `src/lib/design/motifs.tsx`:

1. **StarBorder** — matchbox-style star corner. Props: `color`, `size`.
2. **DoubleRule** — twin horizontal rules, used as section dividers. Props: `color`, `gap`.
3. **PaisleyCorner** — mango/paisley flourish, echoes logo border. 4-rotation variants.
4. **Sunburst** — 8-ray sunburst, echoes logo center. Props: `color`, `rayCount`, `opacity`.
5. **Grain** — SVG `feTurbulence` noise. Applied via CSS `background-image` with 4–6% opacity. One global on dark surfaces, lighter variant on cream.

**Usage rule:** motifs appear on **surface edges and headers**, never inside tile grids or form controls. Keeps the game scannable.

### 4.4 Grain + texture

- Dark `--ink` surfaces: grain overlay at ~6% opacity, `mix-blend-mode: overlay`.
- Cream `--paper` surfaces: grain overlay at ~3% opacity, `mix-blend-mode: multiply` (reads as newsprint/kraft paper).
- Applied globally via `body::before` and surface-local pseudo-elements where needed.

---

## 5. Pages

### 5.1 Landing (`/`)

**Composition** (mobile-first, scales up):

```
┌──────────────────────────────────────────┐
│ बॉलीवुड स्पॉटल (word-mark)   ★ STREAK 4  │  ← utility strip
├──────────────────────────────────────────┤
│                                            │
│         ✦           ✦                       │ ← decorative star rails on wide screens
│      ┌─────────────────┐                   │
│      │                     │                   │
│      │   TITLE LOGO.PNG   │   (max-width 560px) │
│      │   SRK + tigers +    │                   │
│      │   बॉलीवुड स्पॉटल       │                   │
│      └─────────────────┘                   │
│                                            │
│      ★ Thu · 8 October 2026 ★              │ ← date pill
│                                            │
│      आज की फ़िल्म पहचानिए — दस                 │ ← tagline (Yatra One)
│          कोशिशों में                           │
│      Guess today's film in 10 tries         │ ← Anek sub
│                                            │
│         ┌──────────────────┐               │
│         │  ▶  PLAY · खेलें   │  ← mustard pill │
│         └──────────────────┘               │
│                                            │
│   Difficulty: [EASY] medium  hard          │ ← chip row below CTA
│                                            │
├──────────────────────────────────────────┤
│  How to play · Archive · Credits · v1.1   │ ← footer line
└──────────────────────────────────────────┘
```

**Backdrop:** `--ink-deep` with radial gradient toward `--ink` and a soft `--pink` glow at ~30% from top. Grain overlay. Zero other content on the viewport.

**Behavior:**
- `PLAY` → routes to the currently selected difficulty (default `easy`, remembered in cookie).
- Difficulty chips change the active state and persist choice.
- `How to play` opens the existing `HowToPlaySheet` modal (reskinned, see §5.5).
- `Archive` is a stub for v1.1 — link disabled unless archive route exists.
- No HowItWorks / GameAttributes / FaqAccordion sections on the landing — the sheet carries that content.

**What dies:** `src/components/home/HowItWorks.tsx`, `GameAttributes.tsx`, `FaqAccordion.tsx` are either deleted or absorbed into the How-to-play sheet. Decision deferred to implementation phase 4.

### 5.2 Puzzle screen (`/[difficulty]`)

**Composition:**

```
┌───────────────────────────────────────────┐
│ ← back        बॉलीवुड स्पॉटल        [≡]      │ ← slim header
├───────────────────────────────────────────┤
│                                             │
│   ╔══════════════════════════════════════╗ │
│   ║ ★ GUESS 3 of 10 · अनुमान ३         ★ ║ │ ← card header with stars
│   ║  ┌─────────────────────────────┐    ║ │
│   ║  │ [poster blur]  cast chips   │    ║ │ ← guess card body
│   ║  │                              │    ║ │
│   ║  │ [TEAL] [MUST] [RED] [RED]   │    ║ │ ← tiles
│   ║  │ director year  genre banner  │    ║ │
│   ║  └─────────────────────────────┘    ║ │
│   ╚══════════════════════════════════════╝ │
│                                             │
│   [autocomplete input: film name…]          │
│   [GUESS → ] [? HINT · 2 left]              │
│                                             │
│   previous guesses stacked below            │
└───────────────────────────────────────────┘
```

**Surface:** `--paper` background. Grain at 3% multiply. Card edges carry star borders + double-rule frames. Inside the card: zero decoration — just the tiles.

**Tiles:**
- Fill: `--teal` / `--mustard` / `--matchbox-red`.
- Label text: `--paper` on all three (always light type on saturated fill).
- Border: 2px `--charcoal` double-rule.
- Icon: tiny Devanagari numeral in corner (१/२/३/…) matching guess number, 10% opacity on fill.
- Flip animation on reveal unchanged from v1.

**Autocomplete:** input gets a thick `--charcoal` double-rule bottom border + mustard focus ring. Suggestions dropdown uses `--paper` with `--royal` hover.

**Hint button:** small pill, `--royal` outline, mustard star icon. Opens `HintSheet` modal.

### 5.3 Result screen (`ResultScreen.tsx`)

Win and loss variants.

**Win:**
- Full `--paper` surface with sunburst motif radiating from center behind the poster.
- Big Devanagari headline: **शाबाश! · WELL PLAYED**
- Film poster at hero size, revealed.
- "Share results" button in `--matchbox-red` pill.
- Streak badge updated.

**Loss:**
- `--ink` surface with grain (cinema-hall mournful).
- Headline: **फिर कल · TRY TOMORROW** in Yatra One.
- Film poster revealed below with mustard star-border frame.
- Share + streak reset messaging.

### 5.4 Difficulty picker

Lives on the landing as a chip row (§5.1). No separate screen. Active chip = `--matchbox-red` fill with `--paper` text. Inactive = `--paper` outline on `--ink` with hover `--mustard` border.

### 5.5 How-to-play sheet

Reskin the existing `HowToPlaySheet` modal:
- Full-screen sheet on mobile, centered modal on desktop.
- `--paper` surface with paisley-corner ornaments.
- Content: how guesses work, tile color legend (with the new teal/mustard/red), hint rules, difficulty differences, FAQ-style accordion at bottom (absorbs the retired FaqAccordion).
- Example tile mini-grid using real-looking content so players recognize the pattern.

### 5.6 Admin (`/admin/**`)

**Out of scope for the redesign.** Admin UI is utilitarian internal tooling. It keeps its current look. Only inherits the new font loading (so Anek Devanagari replaces Inter wherever `font-family` cascades), which is a harmless upgrade.

### 5.7 Auth (`/auth/callback`, admin login)

Minimal styling pass:
- Background: `--ink-deep` with grain.
- Form card: `--paper` with star-border corners.
- Submit CTA: mustard pill.

### 5.8 Error / 404

Lobby-card treatment:
- `--paper` surface, star-border frame.
- Big Yatra One headline: **गुम हो गए? · LOST?**
- "Back to today's puzzle" CTA in `--matchbox-red`.

---

## 6. Components to extract

The current codebase has no shared primitives. During implementation, extract these to `src/components/ui/` as the redesign lands:

- `<Surface variant="ink" | "paper">` — grain + base color.
- `<PosterFrame>` — star-border + double-rule panel wrapper. Wraps the game card and result poster.
- `<PillCTA color="mustard" | "red">` — primary buttons, consistent padding + shadow + hover.
- `<EyebrowLabel>` — uppercase tracked Devanagari + Latin pair.
- `<SectionDivider>` — double rule + optional centered star.
- `<StreakBadge>` — small star-prefixed chip.

Keeps future UI work consistent and dries up the duplicated inline styling flagged in the project snapshot.

---

## 7. Motion & interaction

- **Tile reveal:** keep v1 flip (CSS 3D transform). Stagger per tile 60ms.
- **PLAY hover:** slight translateY(-2px) + shadow lift. No scale.
- **Card entrance:** fade + translateY(8px) over 180ms on each new guess row.
- **Modal open:** backdrop fade 120ms, sheet slide-up 220ms with ease-out.
- **Prefers-reduced-motion:** respected — all transforms become opacity-only.

---

## 8. Phased implementation plan

Shipped on branch `bollywood-redesign`. Each phase ends with a localhost checkpoint before Om approves moving to the next.

| Phase | Deliverable | Risk |
|---|---|---|
| **1. Foundation** | Rewrite `globals.css` `@theme inline` with new tokens. Swap fonts in `layout.tsx`. Add `src/lib/design/motifs.tsx` with 5 SVG primitives. Add logo asset to `public/`. | Low — isolated to design layer. |
| **2. Hero** | Rewrite `src/app/page.tsx` to the minimal spotle.movie-style hero. Delete or deprecate `src/components/home/*`. Add `<PillCTA>`, `<EyebrowLabel>`, `<StreakBadge>`. | Medium — biggest visible change; need Om signoff on live render. |
| **3. Puzzle screen** | Refactor `src/components/PuzzleScreen.tsx` (currently 421 LOC) — extract tile grid, guess card, autocomplete, hint button into sub-components. Apply `<PosterFrame>` + `<Surface variant="paper">`. Update tile colors to teal/mustard/red. | Medium-high — most logic lives here. Risk of regressions; Playwright suite must pass. |
| **4. Secondary surfaces** | Reskin ResultScreen, HowToPlaySheet, HintSheet, auth, 404. Absorb FaqAccordion into the How-to-play sheet. | Low. |
| **5. Cleanup** | Remove ThemeToggle. Remove deprecated home components. Remove unused CSS vars. Run full test suite, lighthouse, cross-browser smoke. | Low. |

Each phase is one commit on `bollywood-redesign`. No push to origin without Om's explicit go-ahead. At phase 5 Om decides whether to merge to `main` → auto-deploy, or stage further.

---

## 9. Testing

- **Vitest (61 unit tests):** no API/logic changes expected — tests should pass unchanged.
- **Playwright (26 E2E, chromium + Pixel 7):** golden-path tests may need selector updates where class names shift. Visual regression intentionally expected.
- **Manual QA checklist** per phase:
  - Logo renders crisply at mobile + desktop.
  - Devanagari fonts load; no FOIT/FOUT flash.
  - Tiles maintain 4.5:1 contrast on all three fills (teal/mustard/red × paper text).
  - Puzzle screen scannable at 10 stacked guesses on 375px width.
  - Grain overlays don't tank Lighthouse performance.

---

## 10. Open questions

1. **Logo on cream?** The hero places the logo on `--ink`. If we ever need the logo on `--paper` (e.g. result share image), we may need a second variant with a cream-compatible frame. Defer until result screen phase.
2. **Devanagari in admin?** If curator-facing text (film titles, tags) is Latin-only, Anek Devanagari is overkill. Could stay with Anek Latin subset only. Decide at phase 1 when wiring fonts.
3. **Difficulty row above or below CTA?** Current spec: below. Spotle.movie puts no difficulty on landing. If Om wants PLAY to be the only CTA, difficulty moves to a one-step modal after click.
4. **Share-image generation:** result screen needs a shareable image. Open question: generate OG image server-side (Vercel OG) with the same visual language, or just screenshot the result card? Defer to phase 4.

---

## 11. Figma / Google Stitch prompt

A detailed external-facing design prompt covering the same visual language, written for Figma AI or Google Stitch, is at:

- `docs/superpowers/specs/2026-10-08-bollywood-redesign-figma-prompt.md`

Use that prompt to generate the comparator design artifacts (hero variants, puzzle variants, result, modal, share image). Treat whatever comes back as design options to validate against this spec — this doc remains the source of truth for tokens, type, and phased implementation.

---

## 12. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-08 | Full maximalism intensity | Om wants the product to visually commit to Indian print culture, not hedge. |
| 2026-10-08 | Matchbox + hand-painted anchor | Highest "iconic India" density; best legibility for game grid. |
| 2026-10-08 | Logo overrides matchbox palette | Custom logo (`assets/title-logo.png`) carries richer palette than matchbox alone; design should derive from the logo. |
| 2026-10-08 | Puzzle screen disciplined | Readability > ornament during 10 rapid guesses. |
| 2026-10-08 | Bilingual co-equal | Reads culturally rooted without alienating Latin-only readers. |
| 2026-10-08 | Minimal spotle.movie landing | Logo + CTA is the moment; dense sections dilute impact. |
| 2026-10-08 | Dark mode dropped | Single curated look matches reference institutions; halves QA surface. |
| 2026-10-08 | Free type stack only | Yatra One + Anek Devanagari + Baloo Bhai 2 covers brief at zero licensing cost. |
