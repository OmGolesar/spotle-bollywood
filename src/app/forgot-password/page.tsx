import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

type SearchParams = {
  sent?: string;
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Spotle Bollywood
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="text-sm text-muted">
            {sent
              ? "Check your email for a password reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: "var(--tile-green)",
                background: "color-mix(in srgb, var(--tile-green) 10%, var(--surface))",
                color: "var(--foreground)",
              }}
            >
              <p className="font-medium">Reset link sent!</p>
              <p className="mt-1 text-muted">
                Check your inbox and click the link to set a new password. The link expires in 1
                hour.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <ForgotPasswordForm />
        )}
      </main>
    </div>
  );
}
