import Link from "next/link";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { istDateKey } from "@/lib/dateIst";
import { loadSchedule } from "@/lib/server/schedule";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const today = istDateKey();
  const rows = await loadSchedule(30);

  const scheduledCount = (d: Difficulty) =>
    rows.filter((r) => r.cells[d] != null).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-6 sm:px-8 sm:py-10">
      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Next 30 days · IST
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Schedule
        </h1>
        <p className="text-sm text-muted">
          Click any cell to pick or change the mystery film for that day and mode.
        </p>
      </section>

      <section
        aria-label="Pool coverage"
        className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-4"
      >
        {DIFFICULTIES.map((d) => (
          <div key={d} className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {DIFFICULTY_META[d].label}
            </span>
            <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
              {scheduledCount(d)}
              <span className="ml-1 text-sm text-muted">/ 30 scheduled</span>
            </span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted/60 text-left text-xs uppercase tracking-wider text-muted">
              <th className="w-32 px-4 py-3 font-medium">Date</th>
              {DIFFICULTIES.map((d) => (
                <th key={d} className="px-4 py-3 font-medium">
                  {DIFFICULTY_META[d].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isToday = row.dateKey === today;
              return (
                <tr
                  key={row.dateKey}
                  className="border-t border-border bg-surface"
                  style={isToday ? { background: "color-mix(in srgb, var(--accent) 10%, var(--surface))" } : undefined}
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-muted">{row.dowLabel}</span>
                      <span className="font-medium text-foreground">{row.dayLabel}</span>
                      {isToday && (
                        <span
                          className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--accent)" }}
                        >
                          Today
                        </span>
                      )}
                    </div>
                  </td>
                  {DIFFICULTIES.map((d) => {
                    const cell = row.cells[d];
                    return (
                      <td key={d} className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/${row.dateKey}/${d}`}
                          className="group inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-border hover:bg-surface-muted"
                        >
                          {cell ? (
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-foreground">{cell.title}</span>
                              <span className="text-xs text-muted">
                                {cell.year} · {cell.status}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-xs text-muted opacity-0 group-hover:opacity-100"
                          >
                            edit →
                          </span>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
