import Link from "next/link";
import type { Difficulty } from "@/lib/difficulty";
import { DIFFICULTY_META } from "@/lib/difficulty";

type Props = {
  difficulty: Difficulty;
  streak: number;
  playedToday: boolean;
};

export function ModeCard({ difficulty, streak, playedToday }: Props) {
  const meta = DIFFICULTY_META[difficulty];
  const isHard = difficulty === "hard";

  return (
    <Link
      href={`/${difficulty}`}
      className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-6"
    >
      {isHard && (
        <span
          aria-hidden="true"
          className="absolute -top-2 right-5 inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground/80 shadow-sm"
          style={{ color: "var(--hard-accent)" }}
        >
          🎬⭐ Hard
        </span>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]"
            style={isHard ? { color: "var(--hard-accent)" } : undefined}
          >
            {meta.label}
          </h3>
          {playedToday && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--tile-green)_18%,transparent)] px-2 py-0.5 text-[11px] font-medium"
              style={{ color: "var(--tile-green)" }}
            >
              ✓ played
            </span>
          )}
        </div>
        <p className="text-sm leading-5 text-muted">{meta.blurb}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Streak
          </span>
          <span className="font-display text-xl font-semibold tabular-nums text-foreground">
            {streak}
            <span className="ml-1 text-sm text-muted">days</span>
          </span>
        </div>
        <span
          className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
          style={{
            background: "var(--accent)",
            color: "var(--accent-ink)",
          }}
        >
          {playedToday ? "Replay" : "Play"} →
        </span>
      </div>

      <div className="text-[11px] text-muted">{meta.poolHint}</div>
    </Link>
  );
}
