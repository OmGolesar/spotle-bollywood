"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseUrl, requireAnonKey } from "../supabase/env";

/**
 * Create a Supabase client for use in client components.
 * This handles session management and refreshing automatically.
 */
export function createClient() {
  return createBrowserClient(requireSupabaseUrl(), requireAnonKey());
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}
