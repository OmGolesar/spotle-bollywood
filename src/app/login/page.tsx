import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  next?: string;
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password",
  email_not_confirmed: "Please verify your email address",
  too_many_requests: "Too many attempts. Please try again later",
  oauth_cancelled: "Sign in was cancelled",
};

export default async function LoginPage({
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
            Welcome Back!
          </h1>
          <p className="text-sm text-muted">
            Continue your Bollywood guessing journey.
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

        <LoginForm nextUrl={nextUrl} />

        <div className="text-center text-sm text-muted">
          Don&rsquo;t have an account?{" "}
          <a
            href={`/signup${nextUrl !== "/" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}
            className="font-semibold text-foreground hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Sign Up
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
