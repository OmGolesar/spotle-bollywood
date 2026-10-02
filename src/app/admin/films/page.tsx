import Link from "next/link";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { loadFilmList, loadFilmStats, type FilmFilter } from "@/lib/server/films";

export const dynamic = "force-dynamic";

const QUALITY_LABEL: Record<string, string> = {
  verified: "verified",
  tmdb_only: "tmdb only",
  partial: "needs data",
};

type SearchParams = { filter?: string; q?: string; page?: string };

function parseFilter(raw?: string): FilmFilter {
  if (raw === "needs_data" || raw === "verified") return raw;
  return "all";
}

function hrefFor(opts: { filter?: FilmFilter; q?: string; page?: number }, current: SearchParams) {
  const sp = new URLSearchParams();
  const filter = opts.filter ?? parseFilter(current.filter);
  const q = opts.q ?? current.q ?? "";
  const page = opts.page ?? Number(current.page ?? "1");
  if (filter !== "all") sp.set("filter", filter);
  if (q) sp.set("q", q);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/films${qs ? `?${qs}` : ""}`;
}

export default async function FilmsIndex({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);
  const q = sp.q ?? "";
  const page = Number(sp.page ?? "1");

  const [list, stats] = await Promise.all([
    loadFilmList({ filter, q, page }),
    loadFilmStats(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
      <nav className="text-xs text-muted">
        <Link href="/admin" className="hover:text-foreground">
          ← Schedule
        </Link>
      </nav>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Catalog
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Films
        </h1>
        <p className="text-sm text-muted">
          Fill in trivia, hints, box office, banner family, and where-to-watch.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {(["all", "needs_data", "verified"] as const).map((f) => {
          const active = filter === f;
          const label = f === "all" ? `All (${stats.total})` : f === "needs_data" ? `Needs data (${stats.needs_data})` : `Verified (${stats.verified})`;
          return (
            <Link
              key={f}
              href={hrefFor({ filter: f, page: 1 }, sp)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-border px-3 text-xs font-medium"
              style={
                active
                  ? { background: "var(--accent)", color: "var(--accent-ink)", borderColor: "var(--accent)" }
                  : { background: "var(--surface)" }
              }
            >
              {label}
            </Link>
          );
        })}
        <form action="/admin/films" method="get" className="ml-auto flex items-center gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title…"
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-muted"
          >
            Search
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {list.items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">No films match.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted/60 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="w-20 px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Director</th>
                <th className="w-28 px-4 py-3 font-medium">Status</th>
                <th className="w-28 px-4 py-3 font-medium">Trivia / Hints</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/films/${m.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-muted tabular-nums">{m.year}</td>
                  <td className="px-4 py-3 align-top text-muted">
                    {m.director.slice(0, 2).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <span
                      className="inline-flex rounded-full border border-border px-2 py-0.5"
                      style={
                        m.data_quality === "verified"
                          ? { color: "var(--tile-green)" }
                          : m.data_quality === "partial"
                          ? { color: "var(--tile-yellow)" }
                          : { color: "var(--muted)" }
                      }
                    >
                      {QUALITY_LABEL[m.data_quality]}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted tabular-nums">
                    {m.trivia_set ? "✓" : "—"} · {m.hints_set}/3
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link
                      href={`/admin/films/${m.id}`}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {list.pageCount > 1 && (
        <nav
          className="flex items-center justify-between gap-3 text-xs text-muted"
          aria-label="Pagination"
        >
          <span>
            Page {list.page} of {list.pageCount} · {list.total} films
          </span>
          <div className="flex items-center gap-2">
            {list.page > 1 && (
              <Link
                href={hrefFor({ page: list.page - 1 }, sp)}
                className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-surface px-3 hover:bg-surface-muted"
              >
                ← Prev
              </Link>
            )}
            {list.page < list.pageCount && (
              <Link
                href={hrefFor({ page: list.page + 1 }, sp)}
                className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-surface px-3 hover:bg-surface-muted"
              >
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
