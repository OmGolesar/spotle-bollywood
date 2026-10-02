import Link from "next/link";
import { currentUserEmail } from "@/lib/supabase/serverAuth";
import { hasSupabaseConfigured } from "@/lib/supabase/env";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = hasSupabaseConfigured();
  const email = configured ? await currentUserEmail() : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-baseline gap-6">
            <Link
              href="/admin"
              className="flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                Spotle
              </span>
              <span
                className="font-display text-lg font-semibold tracking-tight"
                style={{ color: "var(--accent)" }}
              >
                Admin
              </span>
            </Link>
            {email && (
              <nav
                aria-label="Admin sections"
                className="hidden items-center gap-4 text-sm text-muted sm:flex"
              >
                <Link href="/admin" className="hover:text-foreground">
                  Schedule
                </Link>
                <Link href="/admin/films" className="hover:text-foreground">
                  Films
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <>
                <span className="hidden text-xs text-muted sm:inline">{email}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-muted"
                  >
                    Sign out
                  </button>
                </form>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
