import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { submitGuess } from "@/lib/server/puzzle";
import { badRequest, parseDifficulty, requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }
  const { difficulty: rawDiff, guessMovieId } = (body ?? {}) as {
    difficulty?: string;
    guessMovieId?: string;
  };
  const difficulty = parseDifficulty(rawDiff ?? null);
  if (!difficulty) return badRequest("difficulty required");
  if (!guessMovieId || typeof guessMovieId !== "string")
    return badRequest("guessMovieId required");

  const playerId = await getOrCreatePlayerId();
  const result = await submitGuess(playerId, difficulty, guessMovieId);

  switch (result.status) {
    case "ok":
      return NextResponse.json(result);
    case "already_finished":
      return NextResponse.json({ error: "already_finished" }, { status: 409 });
    case "not_in_pool":
      return NextResponse.json({ error: "not_in_pool" }, { status: 400 });
    case "no_puzzle":
      return NextResponse.json({ error: "no_puzzle_scheduled" }, { status: 404 });
  }
}
