import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { revealHint } from "@/lib/server/puzzle";
import { HINT_CATEGORIES, type HintCategory } from "@/lib/hintCategories";
import { badRequest, parseDifficulty, requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

function parseCategory(raw: unknown): HintCategory | null {
  if (typeof raw !== "string") return null;
  return (HINT_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as HintCategory)
    : null;
}

export async function POST(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }
  const { difficulty: rawDiff, category: rawCat } = (body ?? {}) as {
    difficulty?: string;
    category?: string;
  };
  const difficulty = parseDifficulty(rawDiff ?? null);
  if (!difficulty) return badRequest("difficulty required");
  const category = parseCategory(rawCat);
  if (!category) return badRequest("category required");

  const playerId = await getOrCreatePlayerId();
  const result = await revealHint(playerId, difficulty, category);

  switch (result.status) {
    case "ok":
      return NextResponse.json(result);
    case "locked":
      return NextResponse.json({ error: "locked" }, { status: 409 });
    case "exhausted":
      return NextResponse.json({ error: "exhausted" }, { status: 409 });
    case "already_revealed":
      return NextResponse.json({ error: "already_revealed" }, { status: 409 });
    case "unavailable":
      return NextResponse.json({ error: "unavailable" }, { status: 409 });
    case "no_puzzle":
      return NextResponse.json({ error: "no_puzzle_scheduled" }, { status: 404 });
    case "already_finished":
      return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }
}
