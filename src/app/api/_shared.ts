import { NextResponse } from "next/server";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { hasSupabaseConfigured } from "@/lib/supabase/env";

export function badRequest(reason: string, status = 400) {
  return NextResponse.json({ error: reason }, { status });
}

export function backendUnavailable() {
  return NextResponse.json(
    { error: "backend_not_configured" },
    { status: 503 }
  );
}

export function requireBackend(): NextResponse | null {
  return hasSupabaseConfigured() ? null : backendUnavailable();
}

export function parseDifficulty(raw: string | null): Difficulty | null {
  if (!raw) return null;
  return (DIFFICULTIES as readonly string[]).includes(raw)
    ? (raw as Difficulty)
    : null;
}

export const dynamic = "force-dynamic";
