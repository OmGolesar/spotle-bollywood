import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { listArchiveDates } from "@/lib/server/archive";
import { DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";
import { hasSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Spotle Bollywood — Archive",
  description: "Play past Spotle Bollywood puzzles. Practice mode, no streak impact.",
};

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export default async function ArchiveIndexPage() {
  const configured = hasSupabaseConfigured();
  const entries = configured ? await listArchiveDates(60) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Archive · practice mode
          </p>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Catch up on past puzzles
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Replay any previous day. These don&rsquo;t affect your streak and
            aren&rsquo;t saved — refresh and the puzzle starts over. Hints are
            disabled in archive mode.
          </p>
        </section>

        {!configured && (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
            Backend not configured.
          </div>
        )}

        {configured && entries.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No past puzzles yet. Check back tomorrow.
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {entries.map(({ date, difficulties }) => (
            <li
              key={date}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <span className="font-display text-base font-semibold text-foreground">
                  {formatDateLong(date)}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  {date}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_ORDER.map((d) => {
                  const available = difficulties.includes(d);
                  if (!available) {
                    return (
                      <span
                        key={d}
                        aria-disabled="true"
                        className="inline-flex h-10 min-w-20 items-center justify-center rounded-full border border-dashed border-border px-4 text-xs font-medium text-muted/60"
                      >
                        {DIFFICULTY_META[d].label}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={d}
                      href={`/archive/${date}/${d}`}
                      className="inline-flex h-10 min-w-20 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-surface-muted"
                    >
                      {DIFFICULTY_META[d].label} →
                    </Link>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
