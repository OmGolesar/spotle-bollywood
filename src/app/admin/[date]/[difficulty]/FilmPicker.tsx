"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Option = {
  id: string;
  title: string;
  year: number;
  dataQuality: "verified" | "tmdb_only" | "partial";
};

type Props = {
  pool: Option[];
  editHref: string;
};

const QUALITY_LABEL: Record<Option["dataQuality"], string> = {
  verified: "verified",
  tmdb_only: "tmdb only",
  partial: "needs data",
};

export function FilmPicker({ pool, editHref }: Props) {
  const [query, setQuery] = useState("");
  const [onlyNeedsData, setOnlyNeedsData] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((p) => {
      if (onlyNeedsData && p.dataQuality !== "partial") return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || String(p.year).includes(q);
    });
  }, [pool, query, onlyNeedsData]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title or year…"
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          autoComplete="off"
          spellCheck={false}
        />
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={onlyNeedsData}
            onChange={(e) => setOnlyNeedsData(e.target.checked)}
          />
          Only &ldquo;needs data&rdquo;
        </label>
      </div>

      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {filtered.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">No matches.</li>
        )}
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-foreground">{p.title}</span>
              <span className="text-xs text-muted">
                {p.year} · {QUALITY_LABEL[p.dataQuality]}
              </span>
            </div>
            <Link
              href={`${editHref}?pick=${p.id}`}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-muted"
            >
              Preview
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        {filtered.length} of {pool.length} films shown.
      </p>
    </div>
  );
}
