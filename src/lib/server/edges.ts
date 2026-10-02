import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import { EMPTY_EDGE_INDEX, type EdgeIndex } from "../tiles";

let cache: { index: EdgeIndex; at: number } | null = null;
const TTL_MS = 60_000;

export async function loadEdgeIndex(): Promise<EdgeIndex> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.index;

  const db = supabaseAdmin();
  const [dir, mus] = await Promise.all([
    db.from("director_edges").select("director_a, director_b"),
    db.from("music_director_edges").select("md_a, md_b"),
  ]);

  if (dir.error || mus.error) {
    console.error("loadEdgeIndex query failed", {
      dir: dir.error?.message,
      mus: mus.error?.message,
    });
    return EMPTY_EDGE_INDEX;
  }

  const directors = new Map<string, Set<string>>();
  for (const row of dir.data ?? []) {
    const a = row.director_a as string;
    const b = row.director_b as string;
    if (!directors.has(a)) directors.set(a, new Set());
    directors.get(a)!.add(b);
  }

  const music = new Map<string, Set<string>>();
  for (const row of mus.data ?? []) {
    const a = row.md_a as string;
    const b = row.md_b as string;
    if (!music.has(a)) music.set(a, new Set());
    music.get(a)!.add(b);
  }

  const index = { directors, music };
  cache = { index, at: Date.now() };
  return index;
}
