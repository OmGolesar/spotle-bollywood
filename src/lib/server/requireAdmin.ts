import "server-only";
import { redirect } from "next/navigation";
import { currentUserEmail } from "../supabase/serverAuth";
import { isAdminEmail } from "../admin";
import { hasSupabaseConfigured } from "../supabase/env";

/**
 * Call from any admin page/server-action. Redirects to /admin/login if the
 * user isn't signed in, or back there with an error if their email isn't on
 * the SPOTLE_ADMIN_EMAILS allowlist. Returns the verified email on success.
 */
export async function requireAdmin(): Promise<string> {
  if (!hasSupabaseConfigured()) {
    redirect("/admin/login?error=backend_not_configured");
  }
  const email = await currentUserEmail();
  if (!email) redirect("/admin/login");
  if (!isAdminEmail(email)) redirect("/admin/login?error=not_allowed");
  return email;
}
