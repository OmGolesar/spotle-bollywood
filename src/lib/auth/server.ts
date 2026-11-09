import "server-only";
import { supabaseServerAuth } from "../supabase/serverAuth";
import { supabaseAdmin } from "../supabase/admin";
import { readPlayerId } from "../playerCookie";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Get the currently authenticated user, or null if not logged in.
 * This is safe to call from any server component or API route.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sb = await supabaseServerAuth();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    displayName: profile?.display_name ?? user.email!.split("@")[0],
    avatarUrl: profile?.avatar_url ?? null,
  };
}

/**
 * Get the current user's ID, or null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const sb = await supabaseServerAuth();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

/**
 * Link an anonymous player to a newly authenticated user.
 * This preserves their gameplay history, streaks, and progress.
 *
 * Security: Only links if:
 * 1. The player_id comes from a trusted HTTP-only cookie
 * 2. The player isn't already linked to another user
 * 3. The user isn't already linked to another player
 *
 * Returns true if linking succeeded, false otherwise.
 */
export async function linkAnonymousPlayerToUser(userId: string): Promise<boolean> {
  const playerId = await readPlayerId();
  if (!playerId) return false;

  const db = supabaseAdmin();

  // Use the database function we created in the migration
  const { data, error } = await db.rpc("link_player_to_user", {
    target_player_id: playerId,
    target_user_id: userId,
  });

  if (error) {
    console.error("linkAnonymousPlayerToUser failed", error);
    return false;
  }

  return data === true;
}

/**
 * Check if the current user has a linked player.
 * Returns the player ID if linked, null otherwise.
 */
export async function getUserPlayerId(userId: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("players").select("id").eq("user_id", userId).single();

  return data?.id ?? null;
}

/**
 * Check if a user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const sb = await supabaseServerAuth();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user !== null;
}
