"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServerAuth } from "@/lib/supabase/serverAuth";
import { isAdminEmail } from "@/lib/admin";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    redirect("/admin/login?error=missing_email");
  }
  if (!isAdminEmail(email)) {
    redirect("/admin/login?error=not_allowed");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const redirectTo = `${proto}://${host}/auth/callback?next=/admin`;

  const sb = await supabaseServerAuth();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/login?sent=1");
}

export async function signOut() {
  const sb = await supabaseServerAuth();
  await sb.auth.signOut();
  redirect("/admin/login");
}
