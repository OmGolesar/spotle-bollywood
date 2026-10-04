import "server-only";
import { istDateKey } from "../dateIst";
import { compareMovies } from "../tiles";
import type { Difficulty } from "../difficulty";
import { supabaseAdmin } from "../supabase/admin";
import type {
  DailyPuzzleRow,
  GuessLogEntry,
  MovieRow,
  PlayRow,
  StreakRow,
} from "../supabase/types";
import type { Movie, TileState } from "../types";
import { HINT_UNLOCKS, MAX_HINTS, TOTAL_GUESSES } from "../types";
import { applyPlayResult, emptyStreak } from "../streaks";
import { loadEdgeIndex } from "./edges";
import { HINT_CATEGORIES, type HintCategory } from "../hintCategories";
import { availabilityFor, revealFor } from "./hintCategories";

const INITIAL_BLUR_PX = 36;

export function blurFor(guessesUsed: number, outcome: PlayRow["outcome"]): number {
  if (outcome !== "in_progress") return 0;
  const stepsLeft = Math.max(0, TOTAL_GUESSES - guessesUsed);
  return (INITIAL_BLUR_PX * stepsLeft) / TOTAL_GUESSES;
}

function rowToMovie(r: MovieRow): Movie {
  return {
    id: r.id,
    title: r.title,
    year: r.year,
    director: r.director,
    castTop3: r.cast_top3,
    musicDirectors: r.music_directors,
    banner: r.banner,
    bannerParent: r.banner_parent,
    genres: r.genres,
    boxOfficeCr: r.box_office_cr,
    boxOfficeAmount: r.box_office_amount ?? null,
    boxOfficeCurrency: r.box_office_currency ?? null,
    imdbScore: r.imdb_score,
    posterUrl: r.poster_url,
    trivia: r.trivia,
    whereToWatchUrl: r.where_to_watch_url,
    hintEasy: r.hint_easy,
    hintMedium: r.hint_medium,
    hintHard: r.hint_hard,
    peopleImages: r.people_images ?? {},
    bannerLogoPath: r.banner_logo_path ?? null,
  };
}

export async function resolveTodayPuzzle(
  difficulty: Difficulty
): Promise<{ puzzle: DailyPuzzleRow; mystery: MovieRow } | null> {
  const db = supabaseAdmin();
  const today = istDateKey();

  const { data: puzzle, error } = await db
    .from("daily_puzzles")
    .select("puzzle_date, difficulty, movie_id, status")
    .eq("puzzle_date", today)
    .eq("difficulty", difficulty)
    .maybeSingle();

  if (error || !puzzle) return null;

  const { data: movie, error: mErr } = await db
    .from("movies")
    .select("*")
    .eq("id", puzzle.movie_id)
    .single();

  if (mErr || !movie) return null;
  return { puzzle: puzzle as DailyPuzzleRow, mystery: movie as MovieRow };
}

export async function loadOrCreatePlay(
  playerId: string,
  difficulty: Difficulty,
  puzzleDate: string
): Promise<PlayRow> {
  const db = supabaseAdmin();

  const existing = await db
    .from("plays")
    .select("*")
    .eq("player_id", playerId)
    .eq("puzzle_date", puzzleDate)
    .eq("difficulty", difficulty)
    .maybeSingle();

  if (existing.data) return existing.data as PlayRow;

  const insert = await db
    .from("plays")
    .insert({
      player_id: playerId,
      puzzle_date: puzzleDate,
      difficulty,
      guesses: [],
      hints_used: 0,
      outcome: "in_progress",
    })
    .select("*")
    .single();

  if (insert.error || !insert.data) {
    throw new Error(`loadOrCreatePlay insert failed: ${insert.error?.message}`);
  }
  return insert.data as PlayRow;
}

export async function hydrateTiles(
  guessLog: GuessLogEntry[],
  mystery: MovieRow
): Promise<{ movie: Movie; tiles: TileState[] }[]> {
  if (guessLog.length === 0) return [];
  const ids = guessLog.map((g) => g.movieId);
  const db = supabaseAdmin();
  const { data } = await db.from("movies").select("*").in("id", ids);
  const byId = new Map<string, MovieRow>((data ?? []).map((m) => [m.id as string, m as MovieRow]));
  const edges = await loadEdgeIndex();
  const mysteryMovie = rowToMovie(mystery);
  return guessLog
    .map((g) => byId.get(g.movieId))
    .filter((r): r is MovieRow => r != null)
    .map((r) => {
      const guess = rowToMovie(r);
      return { movie: guess, tiles: compareMovies(guess, mysteryMovie, edges) };
    });
}

export type GuessedMovieBrief = {
  id: string;
  title: string;
  year: number;
  posterUrl: string;
  genres: string[];
  director: string[];
  castTop3: string[];
  peopleImages: Record<string, string>;
  bannerLogoPath: string | null;
};

export type SubmitGuessResult =
  | {
      status: "ok";
      tiles: TileState[];
      movie: GuessedMovieBrief;
      correct: boolean;
      outcome: PlayRow["outcome"];
      guessesRemaining: number;
      posterBlurPx: number;
      hintState: HintState;
    }
  | { status: "already_finished" }
  | { status: "no_puzzle" }
  | { status: "not_in_pool" };

export async function submitGuess(
  playerId: string,
  difficulty: Difficulty,
  guessMovieId: string
): Promise<SubmitGuessResult> {
  const db = supabaseAdmin();
  const today = istDateKey();

  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) return { status: "no_puzzle" };

  const play = await loadOrCreatePlay(playerId, difficulty, today);
  if (play.outcome !== "in_progress") return { status: "already_finished" };

  // Any movie in the catalogue is a valid guess, regardless of difficulty.
  // Difficulty controls the mystery pool, not the search pool.
  const guessRow = await db
    .from("movies")
    .select("*")
    .eq("id", guessMovieId)
    .single();
  if (guessRow.error || !guessRow.data) return { status: "not_in_pool" };

  const edges = await loadEdgeIndex();
  const guess = rowToMovie(guessRow.data as MovieRow);
  const mystery = rowToMovie(resolved.mystery);
  const tiles = compareMovies(guess, mystery, edges);

  const correct = guessMovieId === resolved.mystery.id;
  const nextGuesses: GuessLogEntry[] = [
    ...play.guesses,
    { movieId: guessMovieId, correct, at: new Date().toISOString() },
  ];
  let newOutcome: PlayRow["outcome"] = "in_progress";
  let wonOn: number | null = null;
  if (correct) {
    newOutcome = "won";
    wonOn = nextGuesses.length;
  } else if (nextGuesses.length >= TOTAL_GUESSES) {
    newOutcome = "lost";
  }

  const update = await db
    .from("plays")
    .update({
      guesses: nextGuesses,
      outcome: newOutcome,
      won_on_guess: wonOn,
      completed_at: newOutcome === "in_progress" ? null : new Date().toISOString(),
    })
    .eq("id", play.id)
    .select("*")
    .single();

  if (update.error) {
    throw new Error(`submitGuess update failed: ${update.error.message}`);
  }

  if (newOutcome !== "in_progress") {
    await updateStreakFor(playerId, difficulty, today, newOutcome);
  }

  const nextPlay = update.data as PlayRow;
  const hintState = await buildHintState(resolved.mystery, nextPlay);

  return {
    status: "ok",
    tiles,
    movie: {
      id: guess.id,
      title: guess.title,
      year: guess.year,
      posterUrl: guess.posterUrl,
      genres: guess.genres,
      director: guess.director,
      castTop3: guess.castTop3,
      peopleImages: guess.peopleImages ?? {},
      bannerLogoPath: guess.bannerLogoPath ?? null,
    },
    correct,
    outcome: newOutcome,
    guessesRemaining: TOTAL_GUESSES - nextGuesses.length,
    posterBlurPx: blurFor(nextGuesses.length, newOutcome),
    hintState,
  };
}

export async function giveUp(
  playerId: string,
  difficulty: Difficulty
): Promise<
  | { status: "ok" }
  | { status: "already_finished" }
  | { status: "no_puzzle" }
> {
  const db = supabaseAdmin();
  const today = istDateKey();
  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) return { status: "no_puzzle" };

  const play = await loadOrCreatePlay(playerId, difficulty, today);
  if (play.outcome !== "in_progress") return { status: "already_finished" };

  const update = await db
    .from("plays")
    .update({
      outcome: "lost",
      completed_at: new Date().toISOString(),
    })
    .eq("id", play.id);
  if (update.error) throw new Error(`giveUp update failed: ${update.error.message}`);

  await updateStreakFor(playerId, difficulty, today, "lost");
  return { status: "ok" };
}

async function updateStreakFor(
  playerId: string,
  difficulty: Difficulty,
  puzzleDate: string,
  outcome: Extract<PlayRow["outcome"], "won" | "lost">
): Promise<void> {
  const db = supabaseAdmin();
  const existing = await db
    .from("streaks")
    .select("*")
    .eq("player_id", playerId)
    .eq("difficulty", difficulty)
    .maybeSingle();
  const prev = (existing.data as StreakRow | null) ?? emptyStreak(playerId, difficulty);
  const next = applyPlayResult(prev, { outcome, puzzleDate });
  await db.from("streaks").upsert(next, { onConflict: "player_id,difficulty" });
}

export async function readStreaks(
  playerId: string
): Promise<Record<Difficulty, StreakRow>> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("streaks")
    .select("*")
    .eq("player_id", playerId);
  const rows = (data ?? []) as StreakRow[];
  const result: Record<Difficulty, StreakRow> = {
    easy: emptyStreak(playerId, "easy"),
    medium: emptyStreak(playerId, "medium"),
    hard: emptyStreak(playerId, "hard"),
  };
  for (const r of rows) result[r.difficulty] = r;
  return result;
}

export type HintStateItem = {
  category: HintCategory;
  available: boolean;
  revealed: boolean;
  text: string | null;
};

export type HintState = {
  usesTotal: number;
  usesRemaining: number;
  unlocksRemaining: number[];
  nextUnlockAtGuess: number | null;
  items: HintStateItem[];
};

async function buildHintState(
  mystery: MovieRow,
  play: PlayRow
): Promise<HintState> {
  const availability = await availabilityFor(mystery);
  const revealedCats = new Set(play.hints_revealed_categories ?? []);
  const unlocks = HINT_UNLOCKS.filter((g) => play.guesses.length < g);
  const nextUnlock = unlocks[0] ?? null;
  const usesUnlocked = HINT_UNLOCKS.filter((g) => play.guesses.length >= g).length;
  const usesRemaining = Math.max(0, usesUnlocked - revealedCats.size);

  const items: HintStateItem[] = [];
  for (const cat of HINT_CATEGORIES) {
    const avail = availability.find((a) => a.category === cat)?.available ?? false;
    const revealed = revealedCats.has(cat);
    let text: string | null = null;
    if (revealed) {
      const r = await revealFor(mystery, cat);
      text = r?.text ?? null;
    }
    items.push({ category: cat, available: avail, revealed, text });
  }

  return {
    usesTotal: MAX_HINTS,
    usesRemaining,
    unlocksRemaining: unlocks,
    nextUnlockAtGuess: nextUnlock,
    items,
  };
}

export async function loadHintStateFor(
  playerId: string,
  difficulty: Difficulty
): Promise<HintState | null> {
  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) return null;
  const play = await loadOrCreatePlay(playerId, difficulty, istDateKey());
  return buildHintState(resolved.mystery, play);
}

export async function revealHint(
  playerId: string,
  difficulty: Difficulty,
  category: HintCategory
): Promise<
  | { status: "ok"; reveal: { category: HintCategory; text: string }; state: HintState }
  | { status: "locked" }
  | { status: "exhausted" }
  | { status: "no_puzzle" }
  | { status: "already_finished" }
  | { status: "already_revealed" }
  | { status: "unavailable" }
> {
  const today = istDateKey();
  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) return { status: "no_puzzle" };

  const play = await loadOrCreatePlay(playerId, difficulty, today);
  if (play.outcome !== "in_progress") return { status: "already_finished" };

  const revealedCats = new Set(play.hints_revealed_categories ?? []);
  if (revealedCats.has(category)) return { status: "already_revealed" };

  const usesUnlocked = HINT_UNLOCKS.filter((g) => play.guesses.length >= g).length;
  if (revealedCats.size >= usesUnlocked) {
    return usesUnlocked >= MAX_HINTS ? { status: "exhausted" } : { status: "locked" };
  }

  const reveal = await revealFor(resolved.mystery, category);
  if (!reveal) return { status: "unavailable" };

  const nextCats = [...revealedCats, category];
  const db = supabaseAdmin();
  const { error } = await db
    .from("plays")
    .update({
      hints_revealed_categories: nextCats,
      hints_used: nextCats.length,
    })
    .eq("id", play.id);
  if (error) throw new Error(error.message);

  const nextPlay: PlayRow = {
    ...play,
    hints_revealed_categories: nextCats,
    hints_used: nextCats.length,
  };
  const state = await buildHintState(resolved.mystery, nextPlay);
  return { status: "ok", reveal, state };
}

export async function finish(
  playerId: string,
  difficulty: Difficulty
): Promise<
  | {
      status: "ok";
      answer: {
        id: string;
        title: string;
        year: number;
        director: string[];
        castTop3: string[];
        trivia: string;
        whereToWatchUrl: string | null;
        posterUrl: string;
      };
      streak: StreakRow;
    }
  | { status: "not_finished" }
  | { status: "no_puzzle" }
> {
  const today = istDateKey();
  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) return { status: "no_puzzle" };

  const play = await loadOrCreatePlay(playerId, difficulty, today);
  if (play.outcome === "in_progress") return { status: "not_finished" };

  const streaks = await readStreaks(playerId);
  return {
    status: "ok",
    answer: {
      id: resolved.mystery.id,
      title: resolved.mystery.title,
      year: resolved.mystery.year,
      director: resolved.mystery.director,
      castTop3: resolved.mystery.cast_top3,
      trivia: resolved.mystery.trivia,
      whereToWatchUrl: resolved.mystery.where_to_watch_url,
      posterUrl: resolved.mystery.poster_url,
    },
    streak: streaks[difficulty],
  };
}
