"use client";

import { useEffect, useState } from "react";

const TILE_ROWS: {
  color: "green" | "yellow" | "gray";
  label: string;
  text: string;
}[] = [
  { color: "green", label: "✓", text: "This attribute matches today's film exactly." },
  { color: "yellow", label: "~", text: "Partial match — close, but not quite." },
  { color: "gray", label: "✕", text: "No overlap." },
];

export function HowToPlaySheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-muted underline underline-offset-4 decoration-border transition-colors hover:text-foreground hover:decoration-accent"
      >
        How to play
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="htp-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl border border-border">
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <h2 id="htp-title" className="font-display text-2xl font-semibold tracking-tight">
                How to play
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm leading-6 text-foreground/90">
              <p>
                Guess today&rsquo;s mystery Hindi film in <strong>10 tries</strong>. Each guess
                reveals 8 color-coded tiles comparing your pick to the answer — director,
                cast, year, box office, music, banner, genre, IMDb score.
              </p>
              <ul className="space-y-2">
                {TILE_ROWS.map((row) => (
                  <li key={row.color} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white text-sm font-bold"
                      style={{
                        background:
                          row.color === "green"
                            ? "var(--tile-green)"
                            : row.color === "yellow"
                            ? "var(--tile-yellow)"
                            : "var(--tile-gray)",
                      }}
                    >
                      {row.label}
                    </span>
                    <span>{row.text}</span>
                  </li>
                ))}
              </ul>
              <p>
                The poster un-blurs with every guess. Use up to <strong>2 hints</strong> per
                play (unlocked after guess 3 and guess 6). Three difficulty modes refresh
                daily at midnight IST.
              </p>
              <p className="text-xs text-muted">Movie data from TMDB.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
