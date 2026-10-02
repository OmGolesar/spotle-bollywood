import { describe, it, expect } from "vitest";
import { applyPlayResult } from "./streaks";
import type { StreakRow } from "./supabase/types";

const empty: StreakRow = {
  player_id: "p1",
  difficulty: "easy",
  current_streak: 0,
  max_streak: 0,
  total_plays: 0,
  total_wins: 0,
  last_played_date: null,
};

describe("applyPlayResult", () => {
  it("first-ever win sets both streak counters to 1", () => {
    const r = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-02" });
    expect(r.current_streak).toBe(1);
    expect(r.max_streak).toBe(1);
    expect(r.total_wins).toBe(1);
    expect(r.total_plays).toBe(1);
    expect(r.last_played_date).toBe("2026-10-02");
  });

  it("consecutive-day win extends the streak", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-01" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2026-10-02" });
    expect(after2.current_streak).toBe(2);
    expect(after2.max_streak).toBe(2);
  });

  it("a gap of one day resets current_streak to 1 but preserves max_streak", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-01" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2026-10-02" });
    const after3 = applyPlayResult(after2, { outcome: "won", puzzleDate: "2026-10-05" });
    expect(after3.current_streak).toBe(1);
    expect(after3.max_streak).toBe(2);
  });

  it("losing resets current_streak to 0", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-01" });
    const after2 = applyPlayResult(after1, { outcome: "lost", puzzleDate: "2026-10-02" });
    expect(after2.current_streak).toBe(0);
    expect(after2.max_streak).toBe(1);
    expect(after2.total_plays).toBe(2);
    expect(after2.total_wins).toBe(1);
  });

  it("replaying the same puzzle_date is idempotent", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-01" });
    const dup = applyPlayResult(after1, { outcome: "won", puzzleDate: "2026-10-01" });
    expect(dup).toEqual(after1);
  });

  it("month boundary is treated as consecutive if days are adjacent", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-01-31" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2026-02-01" });
    expect(after2.current_streak).toBe(2);
  });

  it("leap-year Feb 28 → Feb 29 is consecutive in 2028", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2028-02-28" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2028-02-29" });
    expect(after2.current_streak).toBe(2);
  });

  it("non-leap year has no Feb 29 — Feb 28 → Mar 1 is still consecutive in 2027", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2027-02-28" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2027-03-01" });
    expect(after2.current_streak).toBe(2);
  });

  it("year boundary Dec 31 → Jan 1 is consecutive", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-12-31" });
    const after2 = applyPlayResult(after1, { outcome: "won", puzzleDate: "2027-01-01" });
    expect(after2.current_streak).toBe(2);
  });

  it("earlier puzzle date is rejected without mutating state", () => {
    const after1 = applyPlayResult(empty, { outcome: "won", puzzleDate: "2026-10-05" });
    const earlier = applyPlayResult(after1, { outcome: "won", puzzleDate: "2026-10-04" });
    expect(earlier).toEqual(after1);
  });
});
