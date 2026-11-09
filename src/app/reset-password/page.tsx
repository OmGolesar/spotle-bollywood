import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

type SearchParams = {
  code?: string;
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  expired: "This reset link has expired. Please request a new one.",
  invalid: "This reset link is invalid. Please request a new one.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorCode = params.error;
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? errorCode : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Spotle Bollywood
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Set New Password
          </h1>
          <p className="text-sm text-muted">Enter your new password below.</p>
        </div>

        {errorMessage && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--tile-yellow)",
              background: "color-mix(in srgb, var(--tile-yellow) 10%, var(--surface))",
              color: "var(--foreground)",
            }}
          >
            {errorMessage}
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Request new reset link →
              </Link>
            </div>
          </div>
        )}

        <ResetPasswordForm />
      </main>
    </div>
  );
}
