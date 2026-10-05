import { NextResponse } from "next/server";
import { evaluateArchiveGuess } from "@/lib/server/puzzle";
import { badRequest, parseDifficulty, requireBackend } from "../../_shared";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;

  let body: {
    date?: unknown;
    difficulty?: unknown;
    guessMovieId?: unknown;
    priorGuessIds?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("invalid json");
  }

  const date = typeof body.date === "string" ? body.date : null;
  const difficulty = parseDifficulty(
    typeof body.difficulty === "string" ? body.difficulty : null
  );
  const guessMovieId = typeof body.guessMovieId === "string" ? body.guessMovieId : null;
  const priorGuessIds = Array.isArray(body.priorGuessIds)
    ? body.priorGuessIds.filter((x): x is string => typeof x === "string")
    : [];

  if (!date || !DATE_RE.test(date)) return badRequest("date required (YYYY-MM-DD)");
  if (!difficulty) return badRequest("difficulty required");
  if (!guessMovieId) return badRequest("guessMovieId required");

  const result = await evaluateArchiveGuess(
    date,
    difficulty,
    guessMovieId,
    priorGuessIds
  );
  if (result.status === "no_puzzle") {
    return NextResponse.json({ error: "no_puzzle_for_date" }, { status: 404 });
  }
  if (result.status === "not_in_pool") {
    return NextResponse.json({ error: "not_in_pool" }, { status: 400 });
  }
  if (result.status === "already_finished") {
    return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }
  return NextResponse.json(result);
}
