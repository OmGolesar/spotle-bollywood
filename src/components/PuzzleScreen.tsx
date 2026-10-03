"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_META } from "@/lib/difficulty";
import type { PuzzleOutcome, TileState } from "@/lib/types";
import { MAX_HINTS, TOTAL_GUESSES } from "@/lib/types";
import type { HintCategory } from "@/lib/hintCategories";
import { GuessAutocomplete, type AutocompleteOption } from "./GuessAutocomplete";
import { TileGrid } from "./TileGrid";
import { HintSheet, type HintStateClient } from "./HintSheet";
import { ResultScreen, type ResultAnswer } from "./ResultScreen";

type Props = { difficulty: Difficulty };

type GuessRowClient = {
  movie: { id: string; title: string; year: number };
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
  const [answer, setAnswer] = useState<ResultAnswer | null>(null);
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
        { movie: { id: opt.id, title: opt.title, year: opt.year }, tiles: g.tiles },
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

  return (
    <div className="flex min-h-[100dvh] flex-col">
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
                {(hintState?.items.filter((i) => i.revealed).length ?? 0)}/{MAX_HINTS}
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-4 sm:px-8">
        <div
          className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-surface-muted sm:w-56"
          style={{ transition: "filter 400ms ease-out" }}
        >
          <Image
            src={state.posterUrl}
            alt={outcome === "in_progress" ? "Mystery poster, blurred" : "Today's poster"}
            fill
            sizes="(min-width: 640px) 224px, 160px"
            style={{ filter: `blur(${blur}px)`, transition: "filter 400ms ease-out" }}
            unoptimized
            priority
          />
        </div>
      </section>

      <section className="sticky bottom-0 z-20 mx-auto mt-5 w-full max-w-3xl border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-8 sm:pt-6">
        <GuessAutocomplete
          difficulty={difficulty}
          disabled={outcome !== "in_progress" || submitting}
          disabledIds={disabledIds}
          onPick={handlePick}
        />
        {outcome === "in_progress" && guessesUsed === 0 && (
          <p className="mt-2 text-xs text-muted">
            Pick any film. Each guess reveals tiles and un-blurs the poster.
          </p>
        )}
      </section>

      <section
        aria-label="Previous guesses"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pb-10 pt-6 sm:px-8"
      >
        {[...guesses].reverse().map((g, revIdx) => {
          const originalIdx = guesses.length - 1 - revIdx;
          const isLatest = originalIdx === latestGuessIdxRef.current;
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
        state={hintState}
        onPick={handleHintPick}
        busyCategory={hintBusy}
      />

      {outcome !== "in_progress" && answer && (
        <ResultScreen
          difficulty={difficulty}
          outcome={outcome as "won" | "lost"}
          answer={answer}
          guesses={guesses}
          streakAfter={streakAfter}
        />
      )}
    </div>
  );
}
