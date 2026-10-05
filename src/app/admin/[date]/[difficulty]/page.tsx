import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";
import {
  loadPool,
  loadSchedule,
  recentOverlapWarnings,
} from "@/lib/server/schedule";
import { schedulePuzzle, unschedulePuzzle } from "./actions";
import { FilmPicker } from "./FilmPicker";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function EditDay({
  params,
  searchParams,
}: {
  params: Promise<{ date: string; difficulty: string }>;
  searchParams: Promise<{ pick?: string }>;
}) {
  await requireAdmin();
  const { date, difficulty: diffRaw } = await params;
  const sp = await searchParams;

  if (!DATE_RE.test(date)) notFound();
  if (!(DIFFICULTIES as readonly string[]).includes(diffRaw)) notFound();
  const difficulty = diffRaw as Difficulty;

  // Load past + future so this page can edit any date the admin index can
  // reach. The old 30-future-only range made past dates look empty even
  // when something was scheduled, which confused the archive backfill flow.
  const [schedule, pool] = await Promise.all([
    loadSchedule({ pastDays: 60, futureDays: 30 }),
    loadPool(difficulty),
  ]);
  const current = schedule.find((r) => r.dateKey === date)?.cells[difficulty] ?? null;

  const previewId = sp.pick;
  const preview = previewId ? pool.find((p) => p.id === previewId) ?? null : null;
  const warnings = preview
    ? await recentOverlapWarnings(date, difficulty, preview)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
      <nav className="text-xs text-muted">
        <Link href="/admin" className="hover:text-foreground">
          ← Schedule
        </Link>
      </nav>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {DIFFICULTY_META[difficulty].label} · {date}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Edit puzzle
        </h1>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Currently scheduled
            </p>
            {current ? (
              <p className="font-display text-xl font-semibold text-foreground">
                <Link href={`/admin/films/${current.movieId}`} className="hover:text-accent">
                  {current.title}
                </Link>
                <span className="ml-2 text-sm font-normal text-muted">
                  ({current.year}) · {current.status}
                </span>
              </p>
            ) : (
              <p className="text-muted">Nothing scheduled yet.</p>
            )}
          </div>
          {current && (
            <form action={unschedulePuzzle}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="difficulty" value={difficulty} />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold hover:bg-surface-muted"
              >
                Unschedule
              </button>
            </form>
          )}
        </div>
      </section>

      {preview && (
        <section
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
          aria-labelledby="preview-title"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Pending change
          </p>
          <p id="preview-title" className="font-display text-xl font-semibold text-foreground">
            {preview.title}{" "}
            <span className="font-sans text-sm font-normal text-muted">
              ({preview.year})
            </span>
          </p>
          <p className="text-xs text-muted">
            {preview.director.join(" & ")} · {preview.castTop3.slice(0, 3).join(", ")}
          </p>
          {warnings.length > 0 && (
            <ul
              className="rounded-lg border border-border p-3 text-xs"
              style={{ background: "color-mix(in srgb, var(--tile-yellow) 10%, transparent)" }}
            >
              <li className="mb-1 font-semibold" style={{ color: "var(--tile-yellow)" }}>
                Recent-use warnings
              </li>
              {warnings.map((w, i) => (
                <li key={i} className="text-foreground/90">
                  {w.kind === "director" ? "Director" : "Lead actor"} <b>{w.name}</b> was
                  used on {w.onDate} ({w.title}).
                </li>
              ))}
            </ul>
          )}
          <form action={schedulePuzzle} className="flex justify-end gap-2">
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="difficulty" value={difficulty} />
            <input type="hidden" name="movieId" value={preview.id} />
            <Link
              href={`/admin/${date}/${difficulty}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold hover:bg-surface-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Confirm &amp; schedule
            </button>
          </form>
        </section>
      )}

      {!preview && (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Pick a film from the {DIFFICULTY_META[difficulty].label} pool
          </p>
          <FilmPicker
            pool={pool.map((p) => ({ id: p.id, title: p.title, year: p.year, dataQuality: p.dataQuality }))}
            editHref={`/admin/${date}/${difficulty}`}
          />
        </section>
      )}
    </main>
  );
}
