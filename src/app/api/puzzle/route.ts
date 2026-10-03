import { NextResponse } from "next/server";
import { istDateKey } from "@/lib/dateIst";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { HINT_UNLOCKS, MAX_HINTS, TOTAL_GUESSES } from "@/lib/types";
import {
  blurFor,
  hydrateTiles,
  loadOrCreatePlay,
  resolveTodayPuzzle,
  loadHintStateFor,
} from "@/lib/server/puzzle";
import { badRequest, parseDifficulty, requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;
  const url = new URL(req.url);
  const difficulty = parseDifficulty(url.searchParams.get("difficulty"));
  if (!difficulty) return badRequest("difficulty required");

  const resolved = await resolveTodayPuzzle(difficulty);
  if (!resolved) {
    return NextResponse.json(
      { error: "no_puzzle_scheduled", difficulty, date: istDateKey() },
      { status: 404 }
    );
  }

  const playerId = await getOrCreatePlayerId();
  const play = await loadOrCreatePlay(playerId, difficulty, istDateKey());
  const [existingGuesses, hintState] = await Promise.all([
    hydrateTiles(play.guesses, resolved.mystery),
    loadHintStateFor(playerId, difficulty),
  ]);

  return NextResponse.json({
    puzzleDate: resolved.puzzle.puzzle_date,
    difficulty,
    totalGuesses: TOTAL_GUESSES,
    hintsAvailable: MAX_HINTS,
    hintsUsed: play.hints_used,
    hintUnlocks: HINT_UNLOCKS,
    hintState,
    posterUrl: resolved.mystery.poster_url,
    posterBlurPx: blurFor(play.guesses.length, play.outcome),
    outcome: play.outcome,
    existingGuesses: existingGuesses.map((g) => ({
      movie: {
        id: g.movie.id,
        title: g.movie.title,
        year: g.movie.year,
        posterUrl: g.movie.posterUrl,
        genres: g.movie.genres,
        director: g.movie.director,
        castTop3: g.movie.castTop3,
      },
      tiles: g.tiles,
    })),
  });
}
