import { sendMagicLink } from "./actions";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

type SearchParams = { sent?: string; error?: string };

const ERRORS: Record<string, string> = {
  missing_email: "Enter an email address.",
  not_allowed: "That email isn't on the curator allowlist.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const err = params.error ? (ERRORS[params.error] ?? params.error) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Curator access
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Sign in to admin
          </h1>
          <p className="text-sm text-muted">
            Enter your email. We&rsquo;ll send a one-time magic link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1 text-muted">
              Click the link to finish signing in. The link expires in an hour.
            </p>
          </div>
        ) : (
          <form action={sendMagicLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="curator@example.com"
              className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {err && (
              <p className="text-sm" style={{ color: "var(--tile-yellow)" }}>
                {err}
              </p>
            )}
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Send magic link
            </button>
          </form>
        )}

        <p className="text-xs text-muted">
          Only emails listed in <code className="font-mono">SPOTLE_ADMIN_EMAILS</code> can
          sign in. Set that env var in <code className="font-mono">.env.local</code>.
        </p>
      </main>
    </div>
  );
}
