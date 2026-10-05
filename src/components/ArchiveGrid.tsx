"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";
import type { ArchiveCard } from "@/lib/server/archive";

type Filter = "all" | "unplayed" | "played";

type Props = {
  difficulty: Difficulty;
  cards: ArchiveCard[];
  playedCount: number;
};

function shortLabel(iso: string, isToday: boolean, isYesterday: boolean): string {
  if (isToday) return "TODAY";
  if (isYesterday) return "YESTERDAY";
  const d = new Date(`${iso}T00:00:00Z`);
  return d
    .toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    .toUpperCase();
}

function yesterdayDate(todayIso: string): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) - 86_400_000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function ArchiveGrid({ difficulty, cards, playedCount }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const total = cards.length;

  const todayCard = cards.find((c) => c.isToday);
  const yesterdayIso = todayCard ? yesterdayDate(todayCard.date) : null;

  const visibleCards = useMemo(() => {
    if (filter === "all") return cards;
    if (filter === "played") return cards.filter((c) => c.played || c.isToday);
    return cards.filter((c) => !c.played && !c.isToday);
  }, [filter, cards]);

  const pct = total === 0 ? 0 : Math.round((playedCount / total) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Difficulty tabs */}
      <div
        role="tablist"
        aria-label="Difficulty"
        className="flex gap-2 overflow-x-auto"
      >
        {DIFFICULTIES.map((d) => {
          const active = d === difficulty;
          const meta = DIFFICULTY_META[d];
          return (
            <Link
              key={d}
              role="tab"
              aria-selected={active}
              href={`/archive?difficulty=${d}`}
              className="inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition-colors"
              style={
                active
                  ? {
                      background: "var(--accent)",
                      color: "var(--accent-ink)",
                      borderColor: "var(--accent)",
                    }
                  : {
                      background: "var(--surface)",
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }
              }
            >
              {meta.label}
            </Link>
          );
        })}
      </div>

      {/* Filter chips + progress */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter"
          className="flex gap-2"
        >
          {(["all", "unplayed", "played"] as Filter[]).map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f)}
                className="inline-flex h-9 items-center rounded-full border px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        color: "var(--accent-ink)",
                        borderColor: "var(--accent)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--muted)",
                        borderColor: "var(--border)",
                      }
                }
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Played {playedCount}/{total}
          </span>
          <div
            aria-hidden="true"
            className="h-1.5 w-32 overflow-hidden rounded-full bg-border/60"
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {visibleCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing to show in this filter.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleCards.map((card) => {
            const isYesterday =
              yesterdayIso != null && card.date === yesterdayIso;
            const label = shortLabel(card.date, card.isToday, isYesterday);
            const reveal = card.played || card.isToday;
            const href = card.isToday
              ? `/${difficulty}`
              : `/archive/${card.date}/${difficulty}`;
            return (
              <li key={card.date} className="flex flex-col items-stretch gap-1.5">
                <Link
                  href={href}
                  aria-label={
                    reveal
                      ? `${card.title} — ${label}`
                      : `Puzzle #${card.number} — ${label}`
                  }
                  className="group relative block aspect-[2/3] overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5"
                  style={{
                    borderColor: card.isToday
                      ? "var(--accent)"
                      : "var(--border)",
                    background: "var(--surface-muted)",
                  }}
                >
                  {reveal ? (
                    <>
                      <Image
                        src={card.posterUrl}
                        alt={card.title}
                        fill
                        sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 40vw"
                        unoptimized
                        className="object-cover"
                      />
                      {card.isToday && (
                        <span
                          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: "var(--accent)",
                            color: "var(--accent-ink)",
                          }}
                        >
                          Today
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl font-bold tracking-tight text-muted sm:text-3xl">
                        #{card.number}
                      </span>
                    </div>
                  )}
                </Link>
                <span className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
