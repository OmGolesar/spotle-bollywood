"use client";

import { useEffect } from "react";
import { HINT_META, type HintCategory } from "@/lib/hintCategories";

export type HintStateItem = {
  category: HintCategory;
  available: boolean;
  revealed: boolean;
  text: string | null;
};

export type HintStateClient = {
  usesTotal: number;
  usesRemaining: number;
  unlocksRemaining: number[];
  nextUnlockAtGuess: number | null;
  items: HintStateItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  state: HintStateClient | null;
  onPick: (category: HintCategory) => void;
  busyCategory: HintCategory | null;
};

export function HintSheet({ open, onClose, state, onPick, busyCategory }: Props) {
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

  const usesRemaining = state?.usesRemaining ?? 0;
  const nextUnlock = state?.nextUnlockAtGuess ?? null;

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
      <div className="relative z-10 w-full max-w-xl rounded-t-3xl bg-surface shadow-2xl border border-border sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 id="hints-title" className="font-display text-2xl font-semibold tracking-tight">
            Choose a hint
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

        <div className="px-6 pt-1 text-xs text-muted">
          {usesRemaining > 0 ? (
            <span className="font-medium" style={{ color: "var(--accent)" }}>
              {usesRemaining} {usesRemaining === 1 ? "use" : "uses"} remaining
            </span>
          ) : nextUnlock != null ? (
            <>Next hint unlocks after guess {nextUnlock}.</>
          ) : (
            <>All hints used.</>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
          {state?.items.map((item) => {
            const meta = HINT_META[item.category];
            const disabled =
              !item.available ||
              item.revealed ||
              usesRemaining === 0 ||
              busyCategory !== null;
            const activeCta = item.available && !item.revealed && usesRemaining > 0;
            return (
              <button
                key={item.category}
                type="button"
                disabled={disabled && !item.revealed}
                onClick={() => activeCta && onPick(item.category)}
                aria-pressed={item.revealed}
                className={`flex min-h-[9rem] flex-col items-center justify-start gap-2 rounded-2xl border p-4 text-center transition-colors ${
                  item.revealed
                    ? "border-border bg-surface-muted"
                    : activeCta
                    ? "border-border bg-surface hover:bg-surface-muted"
                    : "border-border bg-surface opacity-50"
                }`}
                style={
                  item.revealed
                    ? {
                        background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                      }
                    : undefined
                }
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {meta.label}
                </span>
                {item.revealed && item.text ? (
                  <span className="text-sm leading-5 text-foreground">{item.text}</span>
                ) : (
                  <span className="text-xs leading-4 text-muted">
                    {item.available ? meta.description : "Not available for this film"}
                  </span>
                )}
                {busyCategory === item.category && (
                  <span className="mt-1 text-[11px] text-muted">Revealing…</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-medium hover:bg-surface-muted"
          >
            Keep guessing
          </button>
        </div>
      </div>
    </div>
  );
}
