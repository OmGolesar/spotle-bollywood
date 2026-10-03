import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { giveUp } from "@/lib/server/puzzle";
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
  const result = await giveUp(playerId, difficulty);
  switch (result.status) {
    case "ok":
      return NextResponse.json({ status: "ok" });
    case "already_finished":
      return NextResponse.json({ error: "already_finished" }, { status: 409 });
    case "no_puzzle":
      return NextResponse.json({ error: "no_puzzle_scheduled" }, { status: 404 });
  }
}
