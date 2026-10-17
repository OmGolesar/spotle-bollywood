import type { Difficulty } from "./difficulty";

type StreakSummary = Record<Difficulty, { streak: number; playedToday: boolean }>;

/**
 * The number to show in the home-screen util-bar streak chip.
 * Returns the highest streak across all three difficulty modes, or `null`
 * when every mode is at zero (hide the chip).
 *
 * Why max() and not easy-specific: an earlier draft used `easy.streak` directly,
 * which rendered "★ 0" when a player had a non-zero streak only on medium or
 * hard. Showing their max is the honest signal.
 */
export function visibleStreak(streaks: StreakSummary): number | null {
  const max = Math.max(
    streaks.easy.streak,
    streaks.medium.streak,
    streaks.hard.streak,
  );
  return max > 0 ? max : null;
}
