"use client";

import { useEffect } from "react";
import { HINT_META, type HintCategory } from "@/lib/hintCategories";
import "@/frontend/styles/puzzle.css";

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
      className="bw-hint-wrap"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bw-hint-backdrop"
      />
      <div className="bw-hint-sheet">
        <span className="corner tl" aria-hidden="true">★</span>
        <span className="corner tr" aria-hidden="true">★</span>
        <span className="corner bl" aria-hidden="true">★</span>
        <span className="corner br" aria-hidden="true">★</span>

        <div className="bw-hint-header">
          <h2 id="hints-title" className="bw-hint-title">
            Choose a hint
            <span className="hi" lang="hi"> · एक संकेत चुनिए</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hints"
            className="bw-hint-close"
          >
            ✕
          </button>
        </div>

        <p className="bw-hint-status">
          {usesRemaining > 0 ? (
            <span className="active">
              {usesRemaining} {usesRemaining === 1 ? "use" : "uses"} remaining
            </span>
          ) : nextUnlock != null ? (
            <>Next hint unlocks after guess {nextUnlock}.</>
          ) : (
            <>All hints used.</>
          )}
        </p>

        <div className="bw-hint-grid">
          {state?.items.map((item) => {
            const meta = HINT_META[item.category];
            const disabled =
              !item.available ||
              item.revealed ||
              usesRemaining === 0 ||
              busyCategory !== null;
            const activeCta = item.available && !item.revealed && usesRemaining > 0;
            const stateClass = item.revealed
              ? " revealed"
              : activeCta
              ? " available"
              : " locked";
            return (
              <button
                key={item.category}
                type="button"
                disabled={disabled && !item.revealed}
                onClick={() => activeCta && onPick(item.category)}
                aria-pressed={item.revealed}
                className={`bw-hint-category${stateClass}`}
              >
                <span className="icon" aria-hidden="true">{meta.icon}</span>
                <span className="label">{meta.label}</span>
                {item.revealed && item.text ? (
                  <span className="revealed-text">{item.text}</span>
                ) : (
                  <span className="description">
                    {item.available ? meta.description : "Not available for this film"}
                  </span>
                )}
                {busyCategory === item.category && (
                  <span className="busy">Revealing…</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bw-hint-footer">
          <button
            type="button"
            onClick={onClose}
            className="bw-hint-dismiss"
          >
            Keep guessing
          </button>
        </div>
      </div>
    </div>
  );
}
