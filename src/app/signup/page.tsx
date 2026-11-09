import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  next?: string;
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  email_exists: "An account with this email already exists",
  weak_password: "Password is too weak",
  oauth_cancelled: "Sign up was cancelled",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // If already logged in, redirect to home
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const nextUrl = params.next ?? "/";
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
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Create Your Account
          </h1>
          <p className="text-sm text-muted">
            Join Spotle Bollywood and save your progress!
          </p>
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
          </div>
        )}

        <SignupForm nextUrl={nextUrl} />

        <div className="text-center text-sm text-muted">
          Already have an account?{" "}
          <a
            href={`/login${nextUrl !== "/" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
            className="font-semibold text-foreground hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Sign In
          </a>
        </div>

        <div className="border-t border-border pt-4 text-center text-xs text-muted">
          <p>
            Or continue as a guest &mdash; no account needed.{" "}
            <Link href="/" className="underline hover:text-foreground">
              Start playing →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
