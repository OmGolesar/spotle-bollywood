import { NextResponse } from "next/server";
import { supabaseServerAuth } from "@/lib/supabase/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";

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
      return NextResponse.redirect(
        new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
