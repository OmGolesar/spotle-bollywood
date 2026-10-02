import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase/admin";

const COOKIE_NAME = "spb_pid";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type GetOrCreateOptions = {
  touchDb?: boolean;
};

export async function getOrCreatePlayerId(
  opts: GetOrCreateOptions = { touchDb: true }
): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;

  if (existing && UUID_RE.test(existing)) {
    if (opts.touchDb) {
      await ensurePlayerRow(existing);
    }
    return existing;
  }

  const fresh = crypto.randomUUID();
  jar.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  if (opts.touchDb) {
    await ensurePlayerRow(fresh);
  }

  return fresh;
}

async function ensurePlayerRow(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("players").upsert({ id }, { onConflict: "id" });
  if (error) {
    console.error("ensurePlayerRow failed", { id, error: error.message });
  }
}

export async function readPlayerId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing && UUID_RE.test(existing)) return existing;
  return null;
}
