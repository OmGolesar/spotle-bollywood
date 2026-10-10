# Figma / Google Stitch Prompt — Spotle Bollywood v2 Redesign

Copy and paste the block below into Figma AI, Google Stitch, Galileo, Uizard, or similar AI design tool. Attach `assets/title-logo.png` as a reference image. The prompt is written for an AI design generator; if you're briefing a human designer instead, treat it as a creative brief.

---

## The Prompt

You are a senior product designer. Generate a complete, high-fidelity, multi-page UI design for **Spotle Bollywood**, a daily "guess today's mystery Hindi film" web game. The live v1 is already shipped at spotle-bollywood.vercel.app with a quiet, understated look; this redesign commits fully to the visual language of Indian print and pop culture — Bollywood lobby cards, matchbox labels, hand-painted film posters, truck art, wedding cards, vintage advertisements. The product must feel like a love letter to Hindi cinema translated into a modern web interface — bold, bilingual, confident, never kitsch.

### Design pillars

1. **Loud on the landing, disciplined on the puzzle screen.** The home page can be a full lobby card. The game surface where players make 10 rapid guesses must stay fast to scan.
2. **Devanagari and Latin are co-equal.** Headlines, taglines, CTAs, and tile labels appear in both scripts where natural. Chrome stays Latin for speed.
3. **One designed look.** No dark/light toggle. Dark cinematic hero + cream paper game surface — both are intentional modes of the same system.
4. **The custom logo is the design authority.** The attached `title-logo.png` already defines the vibe (SRK + tigers + Red Fort + Devanagari title + paisley border + sunburst + grain). All tokens, type, and motifs derive from it.

### Visual references

- Matchbox labels (Nazar, Jalne Wale Jale, Rang Baazi) — flat saturated color, star borders, stencil Devanagari.
- 70s/80s Bollywood lobby cards and hand-painted posters.
- Truck art and wedding card ornament (sparingly — only on surface edges).
- MAP Museum Bangalore (map-india.org) for discipline and typographic restraint.
- Cinemaazi archive (artsandculture.google.com/partner/cinemaazi) for archival-content handling.
- spotle.movie for the minimal hero-first landing structure.

### Palette (locked)

| Role | Token | Hex |
|---|---|---|
| Hero backdrop (dark surfaces) | `--ink` | `#2B2250` |
| Lower-canvas gradient target | `--ink-deep` | `#1C1639` |
| Game surface, cards, result | `--paper` | `#F5EDD9` |
| Primary CTA, "wrong" tile | `--matchbox-red` | `#D63024` |
| PLAY pill, "close" tile, highlights | `--mustard` | `#F2B01E` |
| Paisley accents, hover, decorative | `--pink` | `#E8328A` |
| Tile frames, hover underline | `--royal` | `#2E52A6` |
| "Exact" tile, success | `--teal` | `#0E7E7E` |
| Body type on cream | `--charcoal` | `#1A1612` |
| Muted type on cream | `--paper-dim` | `#857C65` |
| Muted type on ink | `--paper-mute` | `#C9BFA5` |

**Tile semantics:** teal = exact match, mustard = close/partial, matchbox-red = wrong.

### Typography (locked — free via Google Fonts)

- **Yatra One** — display headlines, taglines, section eyebrows, PLAY CTA. Devanagari + Latin.
- **Anek Devanagari** — body copy, UI chrome, buttons, forms, tile labels. Variable, multi-script.
- **Baloo Bhai 2** — playful accents, streak badge, small eyebrow labels, date pills.

Do not substitute. Pair Yatra One + Anek Devanagari in bilingual displays, with Devanagari set at the same optical weight as Latin.

### Motifs (use sparingly, on surface edges only — never inside tile grids or forms)

- Star-border corners (matchbox-label style).
- Double-rule horizontal panels.
- Mango/paisley flourishes echoing the logo border.
- 8-ray sunburst echoing the logo center.
- Grain overlay on all surfaces: 6% opacity on dark, 3% on cream.

### Pages to deliver

Generate each as a separate frame at **1440×900 desktop** and **390×844 mobile (iPhone 14 Pro)**.

#### 1. Landing (`/`)
- Dark `--ink-deep` backdrop with grain and a soft `--pink` glow radial from top center.
- Top utility strip: bilingual word-mark "बॉलीवुड स्पॉटल" top-left, streak chip top-right ("★ STREAK 4" in matchbox-red pill).
- Centered large logo (use the attached `title-logo.png`, max 560px wide).
- Below logo: date pill with star bookends ("★ Thu · 8 October 2026 ★").
- Tagline: Yatra One Devanagari headline "आज की फ़िल्म पहचानिए — दस कोशिशों में" with Anek Devanagari sub "Guess today's film in 10 tries".
- Primary CTA: large mustard pill button "▶ PLAY · खेलें" with a small matchbox-red arrow bullet.
- Difficulty chip row below CTA: Easy (active, matchbox-red fill), Medium, Hard (outlined paper on ink).
- Footer line: "How to play · Archive · Credits · v1.1 Bollywood Edition" in muted paper type.
- Decorative star rails flanking the hero on wide screens (optional on mobile).
- No scrolling sections. The hero IS the landing.

#### 2. Puzzle screen (`/easy`, `/medium`, `/hard`)
- `--paper` cream background with 3% grain, multiply blend.
- Slim header: back arrow left, bilingual word-mark center, menu icon right.
- Main card wrapped in a **PosterFrame** component: star-border corners + double-rule panel edges in matchbox-red.
- Card header: "★ GUESS 3 of 10 · अनुमान ३ ★" in Yatra One.
- Guess card body: blurred poster thumbnail left, cast portrait chips right.
- Tile row: 4–8 tiles in teal / mustard / matchbox-red with Devanagari numeral in corner at 10% opacity. Tile labels in Anek Devanagari (director / cast / year / genre / banner / music / box office / IMDb) — bilingual below the color fill.
- Autocomplete input: thick charcoal double-rule bottom border + mustard focus ring. Film-name suggestions below with royal hover.
- Primary action: "GUESS →" mustard pill. Secondary: "? HINT · 2 left" royal outline.
- Previous guesses stack below in collapsed rows.
- No ornament inside the card body — tiles must read instantly.

#### 3. Result screen — Win
- Full `--paper` surface with faint sunburst motif radiating behind the revealed poster.
- Headline: "शाबाश! · WELL PLAYED" (Yatra One, both scripts large).
- Film poster revealed at hero size with star-border frame.
- Stats row: "Guessed in 4 · Streak 5 · Avg 3.8" in Baloo Bhai 2 chips.
- "Share results" matchbox-red pill, "Play tomorrow" mustard pill.
- Next-puzzle countdown in Baloo Bhai 2.

#### 4. Result screen — Loss
- `--ink` surface with grain (cinema-hall mournful mode).
- Headline: "फिर कल · TRY TOMORROW" in Yatra One, paper on ink.
- Film poster revealed below with mustard star-border frame.
- Message: "The film was [TITLE] (year) · [DIRECTOR]" in Anek Devanagari.
- "Share results" mustard outline pill, "See archive" royal outline.

#### 5. How-to-play sheet (modal)
- Full-screen sheet on mobile, centered 640px modal on desktop.
- `--paper` surface with paisley-corner ornaments at four corners.
- Content sections: (1) How guesses work, (2) Tile color legend with real-looking example mini-grid, (3) Hint rules, (4) Difficulty differences, (5) FAQ accordion.
- Each section has a double-rule divider with a centered star.
- Close button: matchbox-red circular with mustard X.

#### 6. Hint sheet (modal)
- Smaller modal (480px desktop).
- `--paper` with star-border corners.
- Reveals one hint tier at a time (release year hint → genre hint). Each hint in a mustard-filled card with Devanagari + Latin labels.
- "Use hint (2 left)" matchbox-red pill.

#### 7. Auth / magic-link page (`/auth/callback` style)
- `--ink-deep` background with grain.
- Centered 420px form card on `--paper` with star-border corners.
- Small word-mark "बॉलीवुड स्पॉटल" above the form.
- Email input with double-rule bottom border, mustard focus ring.
- "Send magic link" mustard pill.

#### 8. 404 / error
- `--paper` surface, star-border full-page frame.
- Headline: "गुम हो गए? · LOST?" Yatra One, centered.
- Illustration slot: small decorative sunburst with paisley corners.
- "Back to today's puzzle" matchbox-red pill.

#### 9. Share image (OG card, 1200×630)
- `--ink` background with grain and a radial pink glow.
- Centered mini version of the title logo.
- Below: "I guessed today's film in 4/10 · बॉलीवुड स्पॉटल" in Yatra One.
- Tile emoji row showing the player's attempts.
- Date in mustard pill at bottom.

### Component system to deliver as reusable Figma components / variants

- **Surface** — variants: ink, paper. Includes grain overlay as a mask.
- **PosterFrame** — card wrapper with star-border corners and double-rule panel edges. Variants by border color.
- **PillCTA** — variants: mustard (primary), matchbox-red (secondary), royal outline (tertiary). Sizes: lg, md, sm.
- **TileChip** — variants: teal (exact), mustard (close), matchbox-red (wrong). States: idle, revealing, revealed.
- **EyebrowLabel** — small uppercase bilingual pair.
- **SectionDivider** — double rule with optional centered star.
- **StreakBadge** — star-prefixed chip in matchbox-red.
- **DatePill** — Baloo Bhai 2 chip with mustard star bookends.
- **BilingualHeadline** — Yatra One Devanagari primary + Anek Latin sub, with vertical rhythm locked.
- **MotifCorner** — four rotation variants of mango/paisley corner.
- **Sunburst** — background decorative element with adjustable ray count and opacity.

### Interaction + motion notes (annotate on frames)

- Tile reveal: CSS 3D flip, 400ms, 60ms stagger between tiles in a row.
- PLAY hover: translateY(-2px) with shadow lift. No scale.
- Card entrance: fade + translateY(8px), 180ms on each new guess row.
- Modal open: backdrop fade 120ms, sheet slide-up 220ms ease-out.
- Prefers-reduced-motion: respected everywhere — reduces to opacity-only.

### What to avoid

- Do not use ornament inside tile grids or form controls.
- Do not substitute "Noto Sans Devanagari" for Anek or "Inter" for Anek — the type stack is locked.
- Do not include a light/dark toggle. The design IS the design.
- Do not revive the dense landing structure (hero + mode cards + how-it-works + attributes + FAQ). The landing is one hero + CTA.
- Do not render decorative paisley on CTA buttons themselves — buttons stay clean so they feel clickable.
- Do not use real actor photos beyond the logo (SRK) and poster thumbnails. All decorative portraits should be stock/illustrated or inherited from the TMDB poster library in game.

### Deliverable

A Figma file with:
- A **Pages** page listing all 9 screens at desktop + mobile.
- A **Components** page with all reusable primitives above as Auto Layout components with variants.
- A **Tokens** page with the palette swatches, type specimens (Yatra One / Anek Devanagari / Baloo Bhai 2 at display, headline, body, caption sizes), and spacing scale.
- A **Motifs** page with the 5 SVG primitives (StarBorder, DoubleRule, PaisleyCorner, Sunburst, Grain) as vector assets.

Match every token hex exactly. Match every font name exactly. Return a single Figma file link.
