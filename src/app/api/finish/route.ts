import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { finish } from "@/lib/server/puzzle";
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
  const { difficulty: rawDiff } = (body ?? {}) as { difficulty?: string };
  const difficulty = parseDifficulty(rawDiff ?? null);
  if (!difficulty) return badRequest("difficulty required");

  const playerId = await getOrCreatePlayerId();
  const result = await finish(playerId, difficulty);

  switch (result.status) {
    case "ok":
      return NextResponse.json(result);
    case "not_finished":
      return NextResponse.json({ error: "not_finished" }, { status: 409 });
    case "no_puzzle":
      return NextResponse.json({ error: "no_puzzle_scheduled" }, { status: 404 });
  }
}
