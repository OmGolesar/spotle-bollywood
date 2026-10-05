import { NextResponse } from "next/server";
import { getArchiveAnswer } from "@/lib/server/puzzle";
import { badRequest, parseDifficulty, requireBackend } from "../../_shared";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const guard = requireBackend();
  if (guard) return guard;

  let body: { date?: unknown; difficulty?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return badRequest("invalid json");
  }

  const date = typeof body.date === "string" ? body.date : null;
  const difficulty = parseDifficulty(
    typeof body.difficulty === "string" ? body.difficulty : null
  );
  if (!date || !DATE_RE.test(date)) return badRequest("date required (YYYY-MM-DD)");
  if (!difficulty) return badRequest("difficulty required");

  const answer = await getArchiveAnswer(date, difficulty);
  if (!answer) {
    return NextResponse.json({ error: "no_puzzle_for_date" }, { status: 404 });
  }
  return NextResponse.json({ answer });
}
