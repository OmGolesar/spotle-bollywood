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
      className={`bw-mode-card${isHard ? " hard" : ""}`}
    >
      {isHard && (
        <span className="bw-mode-badge" aria-hidden="true">
          🎬⭐ Hard
        </span>
      )}
      <div className="bw-mode-top">
        <div className={`bw-mode-title${isHard ? " hard" : ""}`}>{meta.label}</div>
        {playedToday && <span className="bw-mode-pt">✓ played</span>}
      </div>
      <p className="bw-mode-blurb">{meta.blurb}</p>
      <div className="bw-mode-foot">
        <div>
          <div className="bw-mode-streak-label">Streak</div>
          <div className="bw-mode-streak-num">
            {streak}
            <span>days</span>
          </div>
        </div>
        <span className="bw-mode-cta">{playedToday ? "Replay →" : "Play →"}</span>
      </div>
      <div className="bw-mode-pool">Pool · {meta.poolHint}</div>
    </Link>
  );
}
