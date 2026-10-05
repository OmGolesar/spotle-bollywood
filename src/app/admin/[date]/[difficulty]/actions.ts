"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { istDateKey } from "@/lib/dateIst";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDiff(raw: FormDataEntryValue | null): Difficulty | null {
  if (typeof raw !== "string") return null;
  return (DIFFICULTIES as readonly string[]).includes(raw)
    ? (raw as Difficulty)
    : null;
}

export async function schedulePuzzle(formData: FormData) {
  await requireAdmin();

  const date = String(formData.get("date") ?? "");
  const difficulty = parseDiff(formData.get("difficulty"));
  const movieId = String(formData.get("movieId") ?? "").trim();
  if (!DATE_RE.test(date) || !difficulty || !movieId) {
    throw new Error("invalid_input");
  }

  const db = supabaseAdmin();

  // Belt-and-braces: confirm the film is in the given pool.
  const inPool = await db
    .from("movie_pools")
    .select("movie_id")
    .eq("difficulty", difficulty)
    .eq("movie_id", movieId)
    .maybeSingle();
  if (!inPool.data) throw new Error("not_in_pool");

  // Past or today → the puzzle has already 'gone live', so write `live`.
  // Only future-dated puzzles sit in `scheduled` until midnight IST
  // promotes them (today's reads treat scheduled + live as playable, but
  // the archive filters on live/archived — scheduled past dates were
  // silently dropped before this fix).
  const status: "scheduled" | "live" = date <= istDateKey() ? "live" : "scheduled";

  const upsert = await db
    .from("daily_puzzles")
    .upsert(
      { puzzle_date: date, difficulty, movie_id: movieId, status },
      { onConflict: "puzzle_date,difficulty" }
    );
  if (upsert.error) throw new Error(upsert.error.message);

  revalidatePath("/admin");
  revalidatePath(`/admin/${date}/${difficulty}`);
  redirect("/admin");
}

export async function unschedulePuzzle(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const difficulty = parseDiff(formData.get("difficulty"));
  if (!DATE_RE.test(date) || !difficulty) throw new Error("invalid_input");

  const db = supabaseAdmin();
  const del = await db
    .from("daily_puzzles")
    .delete()
    .eq("puzzle_date", date)
    .eq("difficulty", difficulty);
  if (del.error) throw new Error(del.error.message);

  revalidatePath("/admin");
  redirect("/admin");
}
