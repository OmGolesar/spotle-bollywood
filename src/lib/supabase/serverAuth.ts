import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requireAnonKey, requireSupabaseUrl } from "./env";

/**
 * Supabase client that reads the end-user's session from cookies.
 * Used by the /admin pages to resolve the signed-in user and gate
 * access via SPOTLE_ADMIN_EMAILS.
 *
 * This client runs with the user's session (anon or authenticated),
 * NOT the service role — do not use it for puzzle authority writes.
 * For those keep using supabaseAdmin() from ./admin.
 */
export async function supabaseServerAuth() {
  const jar = await cookies();
  return createServerClient(requireSupabaseUrl(), requireAnonKey(), {
    cookies: {
      getAll() {
        return jar.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(items) {
        for (const { name, value, options } of items) {
          try {
            jar.set({ name, value, ...(options as CookieOptions) });
          } catch {
            // called from a Server Component where set is not allowed; ignore
          }
        }
      },
    },
  });
}

export async function currentUserEmail(): Promise<string | null> {
  const sb = await supabaseServerAuth();
  const { data } = await sb.auth.getUser();
  return data.user?.email ?? null;
}
