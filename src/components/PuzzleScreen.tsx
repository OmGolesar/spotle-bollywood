"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_META } from "@/lib/difficulty";
import type { PuzzleOutcome, TileState } from "@/lib/types";
import { MAX_HINTS, TOTAL_GUESSES } from "@/lib/types";
import type { HintCategory } from "@/lib/hintCategories";
import { GuessAutocomplete, type AutocompleteOption } from "./GuessAutocomplete";
import { GuessCard, type GuessedMovieBrief } from "./GuessCard";
import { HintSheet, type HintStateClient } from "./HintSheet";
import { ResultScreen, type ResultAnswer } from "./ResultScreen";

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
  const meta = DIFFICULTY_META[difficulty];

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
  }, [difficulty]);

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

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const guessesUsed = guesses.length;
  const guessesRemaining = TOTAL_GUESSES - guessesUsed;
  const outcome = state?.outcome ?? "in_progress";
  const nextHintAt = hintState?.nextUnlockAtGuess ?? null;
  const hintsLeft = (hintState?.usesRemaining ?? 0);
  const hintsRevealed = hintState?.items.filter((i) => i.revealed).length ?? 0;

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
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted">
        Loading puzzle…
      </div>
    );
  }

  if (error === "no_puzzle") {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">No puzzle today</h1>
        <p className="text-sm text-muted">
          Today&rsquo;s {meta.label} puzzle hasn&rsquo;t been scheduled yet. Try again after
          midnight IST, or run <code className="font-mono">npm run seed</code> in dev.
        </p>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-muted"
        >
          Back to home
        </a>
      </div>
    );
  }

  if (error === "backend_not_configured") {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">Backend not configured</h1>
        <p className="text-sm text-muted">
          Set up Supabase and run migrations + <code className="font-mono">npm run seed</code>.
          See <code className="font-mono">SETUP.md</code>.
        </p>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-muted"
        >
          Back to home
        </a>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted">{error ?? "unknown"}</p>
        <button
          type="button"
          onClick={loadInitial}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-muted"
        >
          Retry
        </button>
      </div>
    );
  }

  const blur = state.posterBlurPx;
  const disabledIds = new Set(guesses.map((g) => g.movie.id));
  const stillPlaying = outcome === "in_progress";

  const hintBtnLabel = (() => {
    if (hintsLeft > 0) return `${hintsLeft} hint${hintsLeft === 1 ? "" : "s"} ready`;
    if (nextHintAt != null) return `Hint in ${nextHintAt - guessesUsed}`;
    if (hintsRevealed >= MAX_HINTS) return "Hints used";
    return "Hints";
  })();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-3 items-center gap-2 px-3 py-3 sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setHintsOpen(true)}
              aria-label="Open hints"
              disabled={!stillPlaying}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
            >
              <span aria-hidden="true">💡</span>
              <span className="hidden sm:inline">{hintBtnLabel}</span>
              <span className="sm:hidden">Hints</span>
              {hintsLeft > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-ink">
                  {hintsLeft}
                </span>
              )}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/"
              aria-label="Back to home"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
            >
              <span aria-hidden="true">←</span>
              <span>{meta.label}</span>
            </a>
            <div
              className="text-sm font-semibold tabular-nums"
              aria-label={`${guessesRemaining} guesses remaining`}
            >
              Guess <span className="text-accent">{Math.min(guessesUsed + (stillPlaying ? 1 : 0), TOTAL_GUESSES)}</span>{" "}
              <span className="text-muted">of {TOTAL_GUESSES}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmGiveUp(true)}
              disabled={!stillPlaying || giveUpBusy}
              aria-label="Give up"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
            >
              <span aria-hidden="true">⚑</span>
              <span className="hidden sm:inline">Give up</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-4 sm:px-8">
        <div
          className="relative mx-auto aspect-[2/3] w-32 overflow-hidden rounded-xl border border-border bg-surface-muted sm:w-44"
          style={{ transition: "filter 400ms ease-out" }}
        >
          <Image
            src={state.posterUrl}
            alt={stillPlaying ? "Mystery poster, blurred" : "Today's poster"}
            fill
            sizes="(min-width: 640px) 176px, 128px"
            style={{ filter: `blur(${blur}px)`, transition: "filter 400ms ease-out" }}
            unoptimized
            priority
          />
        </div>
      </section>

      <section className="mx-auto mt-4 w-full max-w-3xl px-4 sm:px-8">
        <GuessAutocomplete
          difficulty={difficulty}
          disabled={!stillPlaying || submitting}
          disabledIds={disabledIds}
          onPick={handlePick}
        />
        {stillPlaying && guessesUsed === 0 && (
          <p className="mt-2 text-xs text-muted">
            Pick any film. Each guess reveals comparison tiles and un-blurs the poster.
          </p>
        )}
      </section>

      {outcome !== "in_progress" && answer && (
        <section className="mx-auto mt-4 w-full max-w-3xl px-4 sm:px-8">
          <div
            className="flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            style={{
              borderColor:
                outcome === "won" ? "var(--tile-green)" : "var(--border)",
              background:
                outcome === "won"
                  ? "color-mix(in oklab, var(--tile-green) 10%, var(--surface))"
                  : "var(--surface)",
            }}
          >
            <div className="flex flex-col gap-0.5">
              <p className="font-display text-lg font-semibold text-foreground">
                {outcome === "won"
                  ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
                  : "Out of guesses"}
              </p>
              <p className="text-sm text-muted">
                Today&rsquo;s film: <span className="font-medium text-foreground">{answer.title}</span>
                {" "}({answer.year}). Review your guesses below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResultOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:brightness-105"
            >
              View summary →
            </button>
          </div>
        </section>
      )}

      <section
        aria-label="Previous guesses"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pb-10 pt-5 sm:px-8"
      >
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
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Your guesses will appear here.
          </div>
        )}
      </section>

      <HintSheet
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
        state={hintState}
        onPick={handleHintPick}
        busyCategory={hintBusy}
      />

      {confirmGiveUp && stillPlaying && (
        <div
          role="dialog"
          aria-label="Confirm give up"
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 sm:items-center"
          onClick={() => setConfirmGiveUp(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl"
          >
            <h2 className="font-display text-lg font-semibold">Give up this puzzle?</h2>
            <p className="mt-1 text-sm text-muted">
              You&rsquo;ll see today&rsquo;s answer and your streak will reset.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmGiveUp(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-medium hover:bg-surface-muted"
              >
                Keep guessing
              </button>
              <button
                type="button"
                onClick={handleGiveUp}
                disabled={giveUpBusy}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-60"
              >
                {giveUpBusy ? "Giving up…" : "Give up"}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
