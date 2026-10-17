'use client';
import Link from "next/link";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_META } from "@/lib/difficulty";
import { TOTAL_GUESSES } from "@/lib/types";
import "@/frontend/styles/puzzle.css";

type Props = {
  difficulty: Difficulty;
  guessesUsed: number;
  stillPlaying: boolean;
  hintsLeft: number;
  onOpenHints: () => void;
  onGiveUp: () => void;
  giveUpDisabled: boolean;
};

const DIFFICULTY_DEVANAGARI: Record<Difficulty, string> = {
  easy: "आसान",
  medium: "मध्यम",
  hard: "कठिन",
};

export function PuzzleStatusBar({
  difficulty,
  guessesUsed,
  stillPlaying,
  hintsLeft,
  onOpenHints,
  onGiveUp,
  giveUpDisabled,
}: Props) {
  const meta = DIFFICULTY_META[difficulty];
  const remaining = TOTAL_GUESSES - guessesUsed;
  const currentGuessNumber = Math.min(guessesUsed + (stillPlaying ? 1 : 0), TOTAL_GUESSES);
  const giveUpBlocked = !stillPlaying || giveUpDisabled;

  return (
    <header className="bw-puzzle-statusbar">
      <div className="left">
        <button
          type="button"
          onClick={onOpenHints}
          disabled={!stillPlaying}
          aria-label="Open hints"
          className="bw-hint-btn"
        >
          <span aria-hidden="true" className="icon">💡</span>
          <span className="label">Hints</span>
          {hintsLeft > 0 && (
            <span className="bw-hint-count" aria-hidden="true">{hintsLeft}</span>
          )}
        </button>
      </div>

      <div className="center">
        <Link href="/" aria-label="Back to home" className="back">
          <span aria-hidden="true">←</span>
          <span>
            {meta.label}
            <span className="hi" lang="hi"> · {DIFFICULTY_DEVANAGARI[difficulty]}</span>
          </span>
        </Link>
        <div
          className="counter"
          aria-label={`${remaining} guesses remaining`}
        >
          GUESS <span className="num">{currentGuessNumber}</span>
          <span className="hi" lang="hi"> · अनुमान</span>
          <span className="of"> of {TOTAL_GUESSES}</span>
        </div>
      </div>

      <div className="right">
        <button
          type="button"
          onClick={onGiveUp}
          disabled={giveUpBlocked}
          aria-label="Give up"
          className="bw-giveup-btn"
        >
          <span aria-hidden="true" className="icon">⚑</span>
          <span className="label">Give up</span>
        </button>
      </div>
    </header>
  );
}
