"use client";

import { useState } from "react";

type Dot = { color: "green" | "yellow"; label: string; text: string };
type Tip = { title: string; body: string; dots?: Dot[] };

// Order roughly matches the attribute grid: Year, Box Office, IMDb, Banner, Music,
// then the per-person tiles, then transversal mechanics (arrows, hints).
const TIPS: Tip[] = [
  {
    title: "Year",
    body: "The theatrical release year of the film.",
    dots: [
      { color: "green", label: "Green", text: "Exact release year." },
      { color: "yellow", label: "Yellow", text: "Within 5 years. The arrow points to the answer." },
    ],
  },
  {
    title: "Box office",
    body: "Worldwide gross from TMDB, converted to a crore-scale number for easy comparison.",
    dots: [
      { color: "green", label: "Green", text: "Within 10% of the answer's gross." },
      { color: "yellow", label: "Yellow", text: "Within 50%. The arrow points higher or lower." },
    ],
  },
  {
    title: "IMDb score",
    body: "Audience rating on a 0–10 scale.",
    dots: [
      { color: "green", label: "Green", text: "Both films display the exact same tenth." },
      { color: "yellow", label: "Yellow", text: "Within 0.5. The arrow points to the answer." },
    ],
  },
  {
    title: "Banner",
    body: "The primary production company behind the film.",
    dots: [
      { color: "green", label: "Green", text: "Same banner on both cards." },
      { color: "yellow", label: "Yellow", text: "Sister label under the same parent (e.g. Dharma 2.0 vs Dharma)." },
    ],
  },
  {
    title: "Music",
    body: "The composer or music director credited for the soundtrack.",
    dots: [
      { color: "green", label: "Green", text: "Same composer." },
      { color: "yellow", label: "Yellow", text: "Frequent collaborator (same cluster across films)." },
    ],
  },
  {
    title: "Director",
    body: "Who helmed the film.",
    dots: [
      { color: "green", label: "Green", text: "Same director — the portrait shows in colour." },
      { color: "yellow", label: "Yellow", text: "Frequent collaborator with the answer's director." },
    ],
  },
  {
    title: "Lead cast",
    body: "Up to three billed actors, coloured individually.",
    dots: [
      { color: "green", label: "Green", text: "Same actor, same billing position (lead or supporting)." },
      { color: "yellow", label: "Yellow", text: "In the mystery film but at a different billing position." },
    ],
  },
  {
    title: "Genre pills",
    body: "Up to three genres per film, coloured per pill.",
    dots: [
      { color: "green", label: "Green pill", text: "That genre is also in the answer." },
      { color: "yellow", label: "Outlined", text: "That genre isn't in the answer." },
    ],
  },
  {
    title: "Direction arrows",
    body: "Yellow tiles on Year, Box office and IMDb carry an arrow.",
    dots: [
      { color: "yellow", label: "↑", text: "The answer is a higher number." },
      { color: "yellow", label: "↓", text: "The answer is a lower number." },
    ],
  },
  {
    title: "Hints",
    body: "Two hints become available after guesses 3 and 6. Each reveals one of: tagline, filmography, or a cast member — you choose. Hints don't burn a guess.",
  },
];

export function PuzzleTips() {
  const [idx, setIdx] = useState(0);
  const total = TIPS.length;
  const tip = TIPS[idx];
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <aside
      aria-label="Game tips"
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-10 sm:px-8"
    >
      <div
        className="flex gap-1"
        role="tablist"
        aria-label="Tip progress"
      >
        {TIPS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`Tip ${i + 1} of ${total}`}
            onClick={() => setIdx(i)}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background: i === idx ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      <div className="relative rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous tip"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <h3 className="flex items-baseline justify-center gap-2 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Tip
            </span>
            <span className="font-display text-lg font-semibold text-foreground sm:text-xl">
              {tip.title}
            </span>
          </h3>

          <button
            type="button"
            onClick={next}
            aria-label="Next tip"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted">{tip.body}</p>

        {tip.dots && tip.dots.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {tip.dots.map((d) => (
              <li key={d.label} className="flex items-start gap-2 text-sm leading-6">
                <span
                  aria-hidden="true"
                  className="mt-1.5 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: d.color === "green" ? "var(--tile-green)" : "var(--tile-yellow)",
                  }}
                />
                <span className="text-foreground/90">
                  <span className="font-semibold">{d.label}</span>
                  <span className="text-muted"> — {d.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
