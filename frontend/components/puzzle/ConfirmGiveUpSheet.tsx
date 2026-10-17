'use client';
import { useEffect } from "react";
import "@/frontend/styles/puzzle.css";

type Props = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmGiveUpSheet({ open, busy, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm give up"
      className="bw-confirm-sheet-wrap"
    >
      <button
        type="button"
        aria-label="Dismiss confirmation"
        className="bw-confirm-sheet-backdrop"
        onClick={onCancel}
      />
      <div className="bw-confirm-sheet">
        <span className="corner tl" aria-hidden="true">★</span>
        <span className="corner tr" aria-hidden="true">★</span>
        <span className="corner bl" aria-hidden="true">★</span>
        <span className="corner br" aria-hidden="true">★</span>
        <h2 className="headline">
          Give up this puzzle?
          <span className="hi" lang="hi">छोड़ देंगे?</span>
        </h2>
        <p className="body">
          You&rsquo;ll see today&rsquo;s answer and your <strong>streak will reset</strong>.
          The next puzzle unlocks at midnight IST.
        </p>
        <div className="cta-row">
          <button
            type="button"
            onClick={onCancel}
            className="bw-confirm-keep"
          >
            Keep guessing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-label="Give up"
            className="bw-confirm-giveup"
          >
            {busy ? "Giving up…" : "Give up"}
          </button>
        </div>
      </div>
    </div>
  );
}
