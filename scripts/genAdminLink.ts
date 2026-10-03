/**
 * Generate a one-use magic-link URL for an admin email using the
 * service-role key, bypassing Supabase's SMTP rate limits.
 *
 * Usage:
 *   npx tsx scripts/genAdminLink.ts
 *   npx tsx scripts/genAdminLink.ts someone@example.com
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }
  const email = process.argv[2] ?? "omgolesar99@gmail.com";
  const siteBase = process.argv[3] ?? "https://spotle-bollywood.vercel.app";
  const redirectTo = `${siteBase}/auth/callback?next=/admin`;

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }

  const hashedToken = data.properties?.hashed_token;
  if (!hashedToken) {
    console.error("ERROR: generateLink did not return a hashed_token");
    process.exit(1);
  }

  // Point directly at our own callback with token_hash + type so we can
  // use verifyOtp server-side. The default action_link uses PKCE which
  // requires a client-stored code verifier we don't have here.
  const directUrl =
    `${siteBase}/auth/callback` +
    `?token_hash=${encodeURIComponent(hashedToken)}` +
    `&type=magiclink` +
    `&next=/admin`;

  console.log("\n=== ONE-USE SIGN-IN URL ===");
  console.log(directUrl);
  console.log("\n(Click once in any browser — our /auth/callback runs verifyOtp and sets the session cookie.)");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
