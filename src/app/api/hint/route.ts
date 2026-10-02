import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { revealHint } from "@/lib/server/puzzle";
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
  const result = await revealHint(playerId, difficulty);

  switch (result.status) {
    case "ok":
      return NextResponse.json(result);
    case "locked":
      return NextResponse.json({ error: "locked" }, { status: 409 });
    case "exhausted":
      return NextResponse.json({ error: "exhausted" }, { status: 409 });
    case "no_puzzle":
      return NextResponse.json({ error: "no_puzzle_scheduled" }, { status: 404 });
    case "already_finished":
      return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }
}
