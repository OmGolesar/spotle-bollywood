import { NextResponse } from "next/server";
import { loadArchivePuzzle } from "@/lib/server/puzzle";
import { badRequest, parseDifficulty, requireBackend } from "../../_shared";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const difficulty = parseDifficulty(url.searchParams.get("difficulty"));
  if (!date || !DATE_RE.test(date)) return badRequest("date required (YYYY-MM-DD)");
  if (!difficulty) return badRequest("difficulty required");

  const header = await loadArchivePuzzle(date, difficulty);
  if (!header) {
    return NextResponse.json(
      { error: "no_puzzle_for_date", date, difficulty },
      { status: 404 }
    );
  }
  return NextResponse.json(header);
}
