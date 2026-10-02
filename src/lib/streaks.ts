import type { PlayOutcome, StreakRow } from "./supabase/types";

export type PlayResult = {
  outcome: Extract<PlayOutcome, "won" | "lost">;
  puzzleDate: string;
};

function parseIso(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(b) - parseIso(a)) / 86_400_000);
}

export function applyPlayResult(prev: StreakRow, result: PlayResult): StreakRow {
  if (prev.last_played_date && prev.last_played_date === result.puzzleDate) {
    return prev;
  }
  if (prev.last_played_date && daysBetween(prev.last_played_date, result.puzzleDate) < 0) {
    return prev;
  }

  const totalPlays = prev.total_plays + 1;
  const totalWins = prev.total_wins + (result.outcome === "won" ? 1 : 0);

  let currentStreak: number;
  if (result.outcome === "lost") {
    currentStreak = 0;
  } else {
    const gap = prev.last_played_date
      ? daysBetween(prev.last_played_date, result.puzzleDate)
      : null;
    if (gap === 1) {
      currentStreak = prev.current_streak + 1;
    } else {
      currentStreak = 1;
    }
  }

  const maxStreak = Math.max(prev.max_streak, currentStreak);

  return {
    ...prev,
    current_streak: currentStreak,
    max_streak: maxStreak,
    total_plays: totalPlays,
    total_wins: totalWins,
    last_played_date: result.puzzleDate,
  };
}

export function emptyStreak(player_id: string, difficulty: StreakRow["difficulty"]): StreakRow {
  return {
    player_id,
    difficulty,
    current_streak: 0,
    max_streak: 0,
    total_plays: 0,
    total_wins: 0,
    last_played_date: null,
  };
}
