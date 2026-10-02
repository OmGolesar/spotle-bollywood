"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_META } from "@/lib/difficulty";
import { compareMovies } from "@/lib/tiles";
import { mysteryFor } from "@/lib/mock";
import type { GuessRow, Movie, PuzzleOutcome } from "@/lib/types";
import { HINT_UNLOCKS, MAX_HINTS, TOTAL_GUESSES } from "@/lib/types";
import { GuessAutocomplete } from "./GuessAutocomplete";
import { TileGrid } from "./TileGrid";
import { HintSheet } from "./HintSheet";

type Props = { difficulty: Difficulty };

const INITIAL_BLUR_PX = 36;

function blurFor(guessesUsed: number, outcome: PuzzleOutcome): number {
  if (outcome !== "in_progress") return 0;
  const stepsLeft = Math.max(0, TOTAL_GUESSES - guessesUsed);
  return (INITIAL_BLUR_PX * stepsLeft) / TOTAL_GUESSES;
}

export function PuzzleScreen({ difficulty }: Props) {
  const meta = DIFFICULTY_META[difficulty];
  const mystery = useMemo(() => mysteryFor(difficulty), [difficulty]);

  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [outcome, setOutcome] = useState<PuzzleOutcome>("in_progress");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);

  const guessesUsed = guesses.length;
  const guessesRemaining = TOTAL_GUESSES - guessesUsed;
  const blur = blurFor(guessesUsed, outcome);
  const disabledIds = useMemo(
    () => new Set(guesses.map((g) => g.movie.id)),
    [guesses]
  );

  const hintText = difficulty === "easy"
    ? mystery.hintEasy
    : difficulty === "medium"
    ? mystery.hintMedium
    : mystery.hintHard;

  const nextHintUnlocked =
    hintsRevealed.length < MAX_HINTS &&
    guessesUsed >= HINT_UNLOCKS[hintsRevealed.length];

  function handlePick(m: Movie) {
    if (outcome !== "in_progress") return;
    const tiles = compareMovies(m, mystery);
    const next = [...guesses, { movie: m, tiles }];
    setGuesses(next);
    if (m.id === mystery.id) {
      setOutcome("won");
    } else if (next.length >= TOTAL_GUESSES) {
      setOutcome("lost");
    }
  }

  function revealNextHint() {
    if (!nextHintUnlocked) return;
    setHintsRevealed((h) => [...h, hintText]);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <a
            href="/"
            aria-label="Back to home"
            className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            <span className="font-display text-base font-semibold text-foreground">
              {meta.label}
            </span>
          </a>

          <div className="flex items-center gap-4">
            <span
              className="text-sm font-medium tabular-nums"
              aria-label={`${guessesRemaining} guesses remaining`}
            >
              <span className="text-foreground">{guessesRemaining}</span>
              <span className="text-muted"> / {TOTAL_GUESSES}</span>
            </span>
            <button
              type="button"
              onClick={() => setHintsOpen(true)}
              aria-label="Open hints"
              className="relative inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted"
            >
              <span aria-hidden="true">💡</span>
              <span>Hints</span>
              <span className="rounded-full bg-surface-muted px-1.5 text-xs tabular-nums text-muted">
                {hintsRevealed.length}/{MAX_HINTS}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Poster */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-4 sm:px-8">
        <div
          className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-surface-muted sm:w-56"
          style={{ transition: "filter 400ms ease-out" }}
        >
          <Image
            src={mystery.posterUrl}
            alt={outcome === "in_progress" ? "Mystery poster, blurred" : `Poster for ${mystery.title}`}
            fill
            sizes="(min-width: 640px) 224px, 160px"
            style={{ filter: `blur(${blur}px)`, transition: "filter 400ms ease-out" }}
            unoptimized
            priority
          />
        </div>

        {outcome !== "in_progress" && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              {outcome === "won" ? "Solved" : "Answer"}
            </p>
            <p className="font-display text-xl font-semibold text-foreground">
              {mystery.title}{" "}
              <span className="font-sans text-base font-medium text-muted">
                ({mystery.year})
              </span>
            </p>
          </div>
        )}
      </section>

      {/* Guess input */}
      <section className="sticky bottom-0 z-20 mx-auto mt-5 w-full max-w-3xl border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-8 sm:pt-6">
        <GuessAutocomplete
          difficulty={difficulty}
          disabled={outcome !== "in_progress"}
          disabledIds={disabledIds}
          onPick={handlePick}
        />
        {outcome === "in_progress" && guessesUsed === 0 && (
          <p className="mt-2 text-xs text-muted">
            Pick any film. Each guess reveals tiles and un-blurs the poster.
          </p>
        )}
      </section>

      {/* Guesses history */}
      <section
        aria-label="Previous guesses"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pb-10 pt-6 sm:px-8"
      >
        {[...guesses].reverse().map((g, revIdx) => {
          const originalIdx = guesses.length - 1 - revIdx;
          const isLatest = revIdx === 0;
          return (
            <article key={originalIdx} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-foreground">
                  {g.movie.title}
                  <span className="ml-2 text-xs font-medium text-muted">
                    ({g.movie.year})
                  </span>
                </h3>
                <span className="text-xs tabular-nums text-muted">
                  Guess {originalIdx + 1}
                </span>
              </div>
              <TileGrid tiles={g.tiles} animate={isLatest} />
            </article>
          );
        })}

        {guesses.length === 0 && (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Your guesses and tiles will appear here.
          </div>
        )}
      </section>

      <HintSheet
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
        guessesUsed={guessesUsed}
        revealed={hintsRevealed}
        availableHint={nextHintUnlocked ? hintText : null}
        onReveal={revealNextHint}
      />
    </div>
  );
}
