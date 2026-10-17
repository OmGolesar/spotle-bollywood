"use client";

import { useState } from "react";
import type { TileColor } from "@/lib/types";
import { TILE_COLOR_VAR } from "@/frontend/components/puzzle/tileColor";
import "@/frontend/styles/puzzle.css";

type Dot = { color: TileColor; label: string; text: string };
type Tip = { title: string; body: string; dots?: Dot[] };

// Order roughly matches the attribute grid: Year, Box Office, IMDb, Banner, Music,
// then per-person tiles, then transversal mechanics (arrows, hints).
// Color terms updated for the Bollywood palette: Teal (match), Mustard (close), Red (miss).
const TIPS: Tip[] = [
  {
    title: "Year",
    body: "The theatrical release year of the film.",
    dots: [
      { color: "green", label: "Teal", text: "Exact release year." },
      { color: "yellow", label: "Mustard", text: "Within 5 years. The arrow points to the answer." },
    ],
  },
  {
    title: "Box office",
    body: "Worldwide gross from TMDB, converted to a crore-scale number for easy comparison.",
    dots: [
      { color: "green", label: "Teal", text: "Within 10% of the answer's gross." },
      { color: "yellow", label: "Mustard", text: "Within 50%. The arrow points higher or lower." },
    ],
  },
  {
    title: "IMDb score",
    body: "Audience rating on a 0–10 scale.",
    dots: [
      { color: "green", label: "Teal", text: "Both films display the exact same tenth." },
      { color: "yellow", label: "Mustard", text: "Within 0.5. The arrow points to the answer." },
    ],
  },
  {
    title: "Banner",
    body: "The primary production company behind the film.",
    dots: [
      { color: "green", label: "Teal", text: "Same banner on both cards." },
      { color: "yellow", label: "Mustard", text: "Sister label under the same parent (e.g. Dharma 2.0 vs Dharma)." },
    ],
  },
  {
    title: "Music",
    body: "The composer or music director credited for the soundtrack.",
    dots: [
      { color: "green", label: "Teal", text: "Same composer." },
      { color: "yellow", label: "Mustard", text: "Frequent collaborator (same cluster across films)." },
    ],
  },
  {
    title: "Director",
    body: "Who helmed the film.",
    dots: [
      { color: "green", label: "Teal", text: "Same director — the portrait shows in colour." },
      { color: "yellow", label: "Mustard", text: "Frequent collaborator with the answer's director." },
    ],
  },
  {
    title: "Lead cast",
    body: "Up to three billed actors, coloured individually.",
    dots: [
      { color: "green", label: "Teal", text: "Same actor, same billing position (lead or supporting)." },
      { color: "yellow", label: "Mustard", text: "In the mystery film but at a different billing position." },
    ],
  },
  {
    title: "Genre pills",
    body: "Up to three genres per film, coloured per pill.",
    dots: [
      { color: "green", label: "Teal pill", text: "That genre is also in the answer." },
      { color: "yellow", label: "Outlined", text: "That genre isn't in the answer." },
    ],
  },
  {
    title: "Direction arrows",
    body: "Mustard tiles on Year, Box office and IMDb carry an arrow.",
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
  const jump = (i: number) => setIdx(i);

  if (!tip) return null;

  return (
    <aside aria-label="Game tips" className="bw-puzzle-tips">
      <div className="bw-puzzle-tips-progress" role="tablist" aria-label="Tip progress">
        {TIPS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`Tip ${i + 1} of ${total}`}
            onClick={() => jump(i)}
            className={`dot${i === idx ? " is-active" : ""}`}
          />
        ))}
      </div>

      <div className="bw-puzzle-tips-card">
        <div className="bw-puzzle-tips-head">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous tip"
            className="bw-puzzle-tips-nav"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <h3 className="bw-puzzle-tips-title">
            <span className="eyebrow">Tip</span>
            <span className="headline">{tip.title}</span>
          </h3>
          <button
            type="button"
            onClick={next}
            aria-label="Next tip"
            className="bw-puzzle-tips-nav"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <p className="bw-puzzle-tips-body">{tip.body}</p>

        {tip.dots && tip.dots.length > 0 && (
          <ul className="bw-puzzle-tips-dots">
            {tip.dots.map((d) => (
              <li key={d.label}>
                <span
                  aria-hidden="true"
                  className="dot-color"
                  style={{ background: TILE_COLOR_VAR[d.color] }}
                />
                <span>
                  <span className="dot-label">{d.label}</span>
                  <span className="dot-text"> — {d.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
