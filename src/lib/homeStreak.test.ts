import { describe, it, expect } from "vitest";
import { visibleStreak } from "./homeStreak";

const s = (easy: number, medium: number, hard: number) => ({
  easy: { streak: easy, playedToday: false },
  medium: { streak: medium, playedToday: false },
  hard: { streak: hard, playedToday: false },
});

describe("visibleStreak", () => {
  it("returns null when all three modes are zero", () => {
    expect(visibleStreak(s(0, 0, 0))).toBeNull();
  });

  it("returns the easy streak when only easy is non-zero", () => {
    expect(visibleStreak(s(3, 0, 0))).toBe(3);
  });

  it("returns the hard streak when easy is zero but hard is not", () => {
    // regression guard — the earlier implementation returned 0 here.
    expect(visibleStreak(s(0, 0, 5))).toBe(5);
  });

  it("returns the max when multiple modes have streaks", () => {
    expect(visibleStreak(s(2, 8, 4))).toBe(8);
  });
});
