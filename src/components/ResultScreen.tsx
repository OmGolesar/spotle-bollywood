"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import { istDisplayDate } from "@/lib/dateIst";
import { buildShareText, emojiGrid, share } from "@/lib/share";
import type { PuzzleOutcome, TileState } from "@/lib/types";
import { TOTAL_GUESSES } from "@/lib/types";
import { Countdown } from "./Countdown";

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
  const isHard = difficulty === "hard";
  const dateLabel = useMemo(() => istDisplayDate(), []);
  const grid = useMemo(() => emojiGrid(guesses), [guesses]);
  const otherModes = DIFFICULTIES.filter((d) => d !== difficulty);

  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      className="fixed inset-0 z-40 overflow-y-auto bg-background"
    >
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground sm:right-6 sm:top-6"
          >
            <span aria-hidden="true" className="text-lg">✕</span>
          </button>
        )}
        {/* Header */}
        <header className="flex flex-col items-center gap-1 text-center">
          <p
            className="text-xs font-medium uppercase tracking-[0.14em]"
            style={{ color: isHard ? "var(--hard-accent)" : "var(--accent)" }}
          >
            {meta.label}{isHard ? " · 🎬⭐" : ""}
          </p>
          <h1
            id="result-title"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {outcome === "won" ? "Solved!" : "Game over"}
          </h1>
          <p className="text-sm text-muted">
            {outcome === "won"
              ? `In ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
              : `Out of ${TOTAL_GUESSES} guesses`}
          </p>
        </header>

        {/* Poster + title block */}
        <section className="flex flex-col items-center gap-3">
          <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-surface-muted sm:w-48">
            <Image
              src={mystery.posterUrl}
              alt={`Poster for ${mystery.title}`}
              fill
              sizes="(min-width: 640px) 192px, 160px"
              unoptimized
              priority
            />
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {mystery.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mystery.director.join(" & ")} · {mystery.year}
            </p>
          </div>
        </section>

        {/* Emoji grid */}
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
            <span>Your grid</span>
            <span>{dateLabel}</span>
          </div>
          <pre className="whitespace-pre font-mono text-center text-lg leading-7 tracking-wider text-foreground">
            {grid}
          </pre>
        </section>

        {/* Trivia */}
        <section className="rounded-2xl bg-surface-muted p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Trivia
          </p>
          <p className="text-sm leading-6 text-foreground">{mystery.trivia}</p>
        </section>

        {/* Where to watch */}
        {mystery.whereToWatchUrl && (
          <a
            href={mystery.whereToWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            Where to watch →
          </a>
        )}

        {/* Streak + share */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {meta.label} streak
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
                {streakAfter}
                <span className="ml-1 text-sm font-medium text-muted">
                  {streakAfter === 1 ? "day" : "days"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Next puzzle
              </p>
              <Countdown />
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold shadow-sm transition-colors"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {shareState === "copied"
              ? "Copied to clipboard"
              : shareState === "shared"
              ? "Shared!"
              : "Share result"}
          </button>
        </section>

        {/* Cross-sell */}
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Try another mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            {otherModes.map((d) => {
              const m = DIFFICULTY_META[d];
              return (
                <Link
                  key={d}
                  href={`/${d}`}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  <span>{m.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/"
            className="mt-1 self-center text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </section>
      </div>
    </div>
  );
}
