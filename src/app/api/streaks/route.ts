import { NextResponse } from "next/server";
import { getOrCreatePlayerId } from "@/lib/playerCookie";
import { readStreaks } from "@/lib/server/puzzle";
import { requireBackend } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = requireBackend();
  if (guard) return guard;
  const playerId = await getOrCreatePlayerId();
  const streaks = await readStreaks(playerId);
  return NextResponse.json({ streaks });
}
