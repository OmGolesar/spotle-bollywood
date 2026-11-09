import { NextResponse } from "next/server";
import { supabaseServerAuth } from "@/lib/supabase/serverAuth";
import { linkAnonymousPlayerToUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  let next = url.searchParams.get("next") ?? "/";

  // Validate next parameter to prevent open redirects
  // Only allow relative paths or same-origin URLs
  try {
    const nextUrl = new URL(next, url.origin);
    if (nextUrl.origin !== url.origin) {
      next = "/";
    }
  } catch {
    // If next is a relative path, that's fine
    if (next.startsWith("http://") || next.startsWith("https://")) {
      next = "/";
    }
  }

  const sb = await supabaseServerAuth();

  if (tokenHash && type) {
    // Admin-generated magic link (bypasses PKCE — uses token hash).
    const { error } = await sb.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "magiclink" | "signup" | "recovery" | "email_change" | "invite",
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  } else if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      // Determine where to redirect on error
      const errorRedirect =
        type === "recovery" ? "/reset-password" : next.includes("admin") ? "/admin/login" : "/login";

      return NextResponse.redirect(
        new URL(`${errorRedirect}?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  }

  // After successful authentication, check if we should link anonymous player data
  try {
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (user) {
      // Try to link anonymous player to this authenticated user
      // This preserves their gameplay history when they sign up/log in
      await linkAnonymousPlayerToUser(user.id);
    }
  } catch (err) {
    // Don't fail the auth flow if account linking fails
    // User can still use their account, they just won't have their anonymous history
    console.error("Account linking failed in callback:", err);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
