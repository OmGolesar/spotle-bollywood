"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import { istDisplayDate } from "@/lib/dateIst";
import { buildShareText, emojiGrid, share } from "@/lib/share";
import type { PuzzleOutcome, TileState } from "@/lib/types";
import { TOTAL_GUESSES } from "@/lib/types";
import { Countdown } from "./Countdown";
import "@/frontend/styles/puzzle.css";

export type ResultAnswer = {
  id: string;
  title: string;
  year: number;
  director: string[];
  castTop3: string[];
  trivia: string;
  whereToWatchUrl: string | null;
  posterUrl: string;
};

type GuessRowClient = {
  movie: { id: string; title: string; year: number };
  tiles: TileState[];
};

type Props = {
  difficulty: Difficulty;
  outcome: Extract<PuzzleOutcome, "won" | "lost">;
  answer: ResultAnswer;
  guesses: GuessRowClient[];
  streakAfter: number;
  onClose?: () => void;
};

export function ResultScreen({
  difficulty,
  outcome,
  answer: mystery,
  guesses,
  streakAfter,
  onClose,
}: Props) {
  const meta = DIFFICULTY_META[difficulty];
  const dateLabel = useMemo(() => istDisplayDate(), []);
  const grid = useMemo(() => emojiGrid(guesses), [guesses]);
  const otherModes = DIFFICULTIES.filter((d) => d !== difficulty);

  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onShare() {
    const siteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}`
        : undefined;
    const text = buildShareText({ difficulty, outcome, guesses, dateLabel, siteUrl });
    const title = `Spotle Bollywood · ${meta.label}`;
    const result = await share(text, title);
    if (result.via === "clipboard") setShareState("copied");
    else if (result.via === "native" || result.via === "whatsapp") setShareState("shared");
    else setShareState("copied");
    setTimeout(() => setShareState("idle"), 2000);
  }

  const kicker = outcome === "won" ? "शाबाश!" : "फिर कल";
  const headline = outcome === "won" ? "Solved!" : "Game over";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      className={`bw-result-screen ${outcome}`}
    >
      {outcome === "won" && <div className="bw-result-sunburst" aria-hidden="true" />}

      <div className="bw-result-inner">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            className="bw-result-close"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}

        <header className="bw-result-header">
          <p className="mode-eyebrow">★ {meta.label}{difficulty === "hard" ? " · 🎬⭐" : ""} ★</p>
          <h1 id="result-title" className="bw-result-headline">
            <span className="hi" lang="hi">{kicker}</span>
            <span className="en"> · {headline}</span>
          </h1>
          <p className="bw-result-sub">
            {outcome === "won"
              ? `In ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
              : `Out of ${TOTAL_GUESSES} guesses`}
          </p>
        </header>

        <section className="bw-result-poster-block">
          <div className="bw-result-poster">
            <span className="corner tl" aria-hidden="true">★</span>
            <span className="corner tr" aria-hidden="true">★</span>
            <span className="corner bl" aria-hidden="true">★</span>
            <span className="corner br" aria-hidden="true">★</span>
            <Image
              src={mystery.posterUrl}
              alt={`Poster for ${mystery.title}`}
              fill
              sizes="(min-width: 640px) 192px, 160px"
              unoptimized
              priority
            />
          </div>
          <div className="bw-result-film">
            <h2 className="film-title">{mystery.title}</h2>
            <p className="film-meta">{mystery.director.join(" & ")} · {mystery.year}</p>
          </div>
        </section>

        <section className="bw-result-card">
          <div className="head">
            <span>Your grid · आपका ग्रिड</span>
            <span>{dateLabel}</span>
          </div>
          <pre className="bw-result-emoji-grid">{grid}</pre>
        </section>

        <section className="bw-result-trivia">
          <div className="label">★ Trivia · रोचक तथ्य</div>
          <p>{mystery.trivia}</p>
        </section>

        {mystery.whereToWatchUrl && (
          <a
            href={mystery.whereToWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bw-result-watch"
          >
            Where to watch →
          </a>
        )}

        <section className="bw-result-streak-share">
          <div className="row">
            <div>
              <div className="label">{meta.label} streak</div>
              <div className="num">
                {streakAfter}
                <span>{streakAfter === 1 ? "day" : "days"}</span>
              </div>
            </div>
            <div className="right">
              <div className="label">Next puzzle</div>
              <Countdown />
            </div>
          </div>
          <button type="button" onClick={onShare} className="bw-result-share">
            ★ {shareState === "copied"
              ? "Copied to clipboard"
              : shareState === "shared"
              ? "Shared!"
              : "Share result"}
          </button>
        </section>

        <section className="bw-result-cross-sell">
          <div className="label">Try another mode</div>
          <div className="row">
            {otherModes.map((d) => {
              const m = DIFFICULTY_META[d];
              return (
                <Link key={d} href={`/${d}`} className="mode-link">
                  <span>{m.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
          <Link href="/archive" className="bw-result-archive">
            Play past puzzles →
          </Link>
          <Link href="/" className="bw-result-home">
            Back to home
          </Link>
        </section>
      </div>
    </div>
  );
}
