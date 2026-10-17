"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import type { PuzzleOutcome, TileState } from "@/lib/types";
import { TOTAL_GUESSES } from "@/lib/types";
import type { HintCategory } from "@/lib/hintCategories";
import { GuessAutocomplete, type AutocompleteOption } from "./GuessAutocomplete";
import { GuessCard, type GuessedMovieBrief } from "./GuessCard";
import { HintSheet, type HintStateClient } from "./HintSheet";
import { PuzzleTips } from "./PuzzleTips";
import { ResultScreen, type ResultAnswer } from "./ResultScreen";
import { PuzzleShell } from "@/frontend/components/puzzle/PuzzleShell";
import { PuzzleStatusBar } from "@/frontend/components/puzzle/PuzzleStatusBar";
import { MysteryPoster } from "@/frontend/components/puzzle/MysteryPoster";
import { EndOfRoundBanner } from "@/frontend/components/puzzle/EndOfRoundBanner";
import { PuzzleEmptyState } from "@/frontend/components/puzzle/PuzzleEmptyState";
import { PuzzleErrorScreen } from "@/frontend/components/puzzle/PuzzleErrorScreen";
import { ConfirmGiveUpSheet } from "@/frontend/components/puzzle/ConfirmGiveUpSheet";
import "@/frontend/styles/puzzle.css";

type Props = { difficulty: Difficulty };

type GuessRowClient = {
  movie: GuessedMovieBrief;
  tiles: TileState[];
};

type PuzzleStateResp = {
  puzzleDate: string;
  totalGuesses: number;
  hintsAvailable: number;
  hintsUsed: number;
  hintUnlocks: number[];
  hintState: HintStateClient | null;
  posterUrl: string;
  posterBlurPx: number;
  outcome: PuzzleOutcome;
  existingGuesses: GuessRowClient[];
};

type GuessOkResp = {
  status: "ok";
  tiles: TileState[];
  movie: GuessedMovieBrief;
  correct: boolean;
  outcome: PuzzleOutcome;
  guessesRemaining: number;
  posterBlurPx: number;
  hintState: HintStateClient;
};

export function PuzzleScreen({ difficulty }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PuzzleStateResp | null>(null);
  const [guesses, setGuesses] = useState<GuessRowClient[]>([]);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintState, setHintState] = useState<HintStateClient | null>(null);
  const [hintBusy, setHintBusy] = useState<HintCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [giveUpBusy, setGiveUpBusy] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [answer, setAnswer] = useState<ResultAnswer | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [streakAfter, setStreakAfter] = useState<number>(0);
  const latestGuessIdxRef = useRef<number>(-1);

  const loadFinish = useCallback(async () => {
    const res = await fetch("/api/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ difficulty }),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { answer: ResultAnswer; streak: { current_streak: number } };
    setAnswer(body.answer);
    setStreakAfter(body.streak.current_streak);
  }, [difficulty]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/puzzle?difficulty=${difficulty}`, { cache: "no-store" });
      if (res.status === 404) {
        setError("no_puzzle");
        setLoading(false);
        return;
      }
      if (res.status === 503) {
        setError("backend_not_configured");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as PuzzleStateResp;
      setState(body);
      setGuesses(body.existingGuesses);
      setHintState(body.hintState);
      latestGuessIdxRef.current = body.existingGuesses.length - 1;
      if (body.outcome !== "in_progress") {
        await loadFinish();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, [difficulty, loadFinish]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const guessesUsed = guesses.length;
  const outcome = state?.outcome ?? "in_progress";
  const hintsLeft = hintState?.usesRemaining ?? 0;

  // Ruling 5: when the outcome flips away from in_progress, auto-close the
  // hint sheet so it doesn't float above the end-of-round transition.
  useEffect(() => {
    if (outcome !== "in_progress" && hintsOpen) setHintsOpen(false);
  }, [outcome, hintsOpen]);

  async function handlePick(opt: AutocompleteOption) {
    if (!state || submitting || outcome !== "in_progress") return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ difficulty, guessMovieId: opt.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `guess_failed_${res.status}`);
        return;
      }
      const g = (await res.json()) as GuessOkResp;
      const nextGuesses: GuessRowClient[] = [
        ...guesses,
        { movie: g.movie, tiles: g.tiles },
      ];
      setGuesses(nextGuesses);
      latestGuessIdxRef.current = nextGuesses.length - 1;
      setState({ ...state, outcome: g.outcome, posterBlurPx: g.posterBlurPx, hintState: g.hintState });
      setHintState(g.hintState);
      if (g.outcome !== "in_progress") {
        await loadFinish();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHintPick(category: HintCategory) {
    if (hintBusy) return;
    setHintBusy(category);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ difficulty, category }),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { state: HintStateClient };
      setHintState(body.state);
    } finally {
      setHintBusy(null);
    }
  }

  async function handleGiveUp() {
    if (giveUpBusy || !state) return;
    setGiveUpBusy(true);
    try {
      const res = await fetch("/api/giveup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      if (!res.ok) return;
      setState({ ...state, outcome: "lost", posterBlurPx: 0 });
      await loadFinish();
    } finally {
      setGiveUpBusy(false);
      setConfirmGiveUp(false);
    }
  }

  if (loading) {
    return <PuzzleErrorScreen variant="loading" />;
  }

  if (error === "no_puzzle") {
    return <PuzzleErrorScreen variant="no_puzzle" />;
  }

  if (error === "backend_not_configured") {
    return <PuzzleErrorScreen variant="backend_not_configured" />;
  }

  if (error || !state) {
    return <PuzzleErrorScreen variant="other" message={error ?? "unknown"} onRetry={loadInitial} />;
  }

  const disabledIds = new Set(guesses.map((g) => g.movie.id));
  const stillPlaying = outcome === "in_progress";

  return (
    <PuzzleShell>
      <PuzzleStatusBar
        difficulty={difficulty}
        guessesUsed={guessesUsed}
        stillPlaying={stillPlaying}
        hintsLeft={hintsLeft}
        onOpenHints={() => setHintsOpen(true)}
        onGiveUp={() => setConfirmGiveUp(true)}
        giveUpDisabled={submitting}
      />

      <div className="bw-puzzle-body">
        <MysteryPoster
          posterUrl={state.posterUrl || null}
          blurPx={state.posterBlurPx}
          alt={stillPlaying ? "Mystery poster, blurred" : "Today's poster"}
        />

        <div className="bw-guess-input-wrap">
          <GuessAutocomplete
            difficulty={difficulty}
            disabled={!stillPlaying || submitting}
            disabledIds={disabledIds}
            onPick={handlePick}
          />
          {stillPlaying && guessesUsed === 0 && <PuzzleEmptyState />}
        </div>

        {outcome !== "in_progress" && answer && (
          <EndOfRoundBanner
            outcome={outcome as "won" | "lost"}
            guessCount={guesses.length}
            answerTitle={answer.title}
            answerYear={answer.year}
            onViewSummary={() => setResultOpen(true)}
          />
        )}

        <section aria-label="Previous guesses" className="bw-guesses-list">
          {[...guesses].reverse().map((g, revIdx) => {
            const originalIdx = guesses.length - 1 - revIdx;
            const isLatest = originalIdx === latestGuessIdxRef.current;
            return (
              <GuessCard
                key={originalIdx}
                movie={g.movie}
                tiles={g.tiles}
                guessIndex={originalIdx}
                animate={isLatest}
              />
            );
          })}
          {guesses.length === 0 && (
            <div className="bw-guesses-empty">Your guesses will appear here.</div>
          )}
        </section>

        <PuzzleTips />
      </div>

      <HintSheet
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
        state={hintState}
        onPick={handleHintPick}
        busyCategory={hintBusy}
      />

      <ConfirmGiveUpSheet
        open={confirmGiveUp && stillPlaying}
        busy={giveUpBusy}
        onCancel={() => setConfirmGiveUp(false)}
        onConfirm={handleGiveUp}
      />

      {outcome !== "in_progress" && answer && resultOpen && (
        <ResultScreen
          difficulty={difficulty}
          outcome={outcome as "won" | "lost"}
          answer={answer}
          guesses={guesses}
          streakAfter={streakAfter}
          onClose={() => setResultOpen(false)}
        />
      )}
    </PuzzleShell>
  );
}
