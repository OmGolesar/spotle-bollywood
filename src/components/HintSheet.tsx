"use client";

import { useEffect } from "react";
import { HINT_UNLOCKS, MAX_HINTS } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  guessesUsed: number;
  revealed: string[];
  availableHint: string | null;
  onReveal: () => void;
};

export function HintSheet({
  open,
  onClose,
  guessesUsed,
  revealed,
  availableHint,
  onReveal,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const slots = Array.from({ length: MAX_HINTS }, (_, i) => {
    const unlockAt = HINT_UNLOCKS[i];
    const isRevealed = i < revealed.length;
    const unlocked = guessesUsed >= unlockAt;
    const canReveal = unlocked && !isRevealed && availableHint !== null && i === revealed.length;
    return { index: i, unlockAt, unlocked, isRevealed, canReveal };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hints-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-surface shadow-2xl border border-border sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 id="hints-title" className="font-display text-2xl font-semibold tracking-tight">
            Hints
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hints"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          {slots.map((s) => (
            <div
              key={s.index}
              className="rounded-xl border border-border p-4"
              style={
                s.isRevealed
                  ? { background: "color-mix(in srgb, var(--accent) 10%, transparent)" }
                  : undefined
              }
            >
              <div className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
                <span>Hint {s.index + 1}</span>
                {!s.unlocked && <span>Unlocks after guess {s.unlockAt}</span>}
              </div>
              {s.isRevealed ? (
                <p className="text-sm leading-6 text-foreground">{revealed[s.index]}</p>
              ) : s.canReveal ? (
                <button
                  type="button"
                  onClick={onReveal}
                  className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold"
                  style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                >
                  Reveal hint
                </button>
              ) : (
                <p className="text-sm text-muted">
                  {s.unlocked ? "Reveal the earlier hint first." : "Keep guessing…"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
