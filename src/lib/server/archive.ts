import "server-only";
import { istDateKey } from "../dateIst";
import type { Difficulty } from "../difficulty";
import { supabaseAdmin } from "./../supabase/admin";

export type ArchiveEntry = {
  date: string;
  difficulties: Difficulty[];
};

// Lists past daily puzzles grouped by date. We only surface dates whose
// IST puzzle_date is strictly before today — today's puzzle lives on the
// daily route. Capped at `limit` dates to keep the index light.
export async function listArchiveDates(limit = 60): Promise<ArchiveEntry[]> {
  const db = supabaseAdmin();
  const today = istDateKey();

  const { data, error } = await db
    .from("daily_puzzles")
    .select("puzzle_date, difficulty, status")
    .lt("puzzle_date", today)
    .in("status", ["live", "archived"])
    .order("puzzle_date", { ascending: false })
    .limit(limit * 3); // up to 3 difficulties per date

  if (error || !data) return [];

  const byDate = new Map<string, Set<Difficulty>>();
  for (const row of data) {
    const date = row.puzzle_date as string;
    const diff = row.difficulty as Difficulty;
    if (!byDate.has(date)) byDate.set(date, new Set());
    byDate.get(date)!.add(diff);
  }

  const order: Difficulty[] = ["easy", "medium", "hard"];
  return Array.from(byDate.entries())
    .slice(0, limit)
    .map(([date, diffs]) => ({
      date,
      difficulties: order.filter((d) => diffs.has(d)),
    }));
}
