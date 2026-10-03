"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";

export type AutocompleteOption = {
  id: string;
  title: string;
  year: number;
  posterThumb?: string;
};

type Props = {
  difficulty: Difficulty;
  disabled?: boolean;
  disabledIds?: Set<string>;
  onPick: (movie: AutocompleteOption) => void;
};

export function GuessAutocomplete({ difficulty, disabled, disabledIds, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      fetch(`/api/catalog?difficulty=${difficulty}&q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((body: { results: AutocompleteOption[] }) => {
          setResults(body.results);
          setActive(0);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 150);
    return () => clearTimeout(t);
  }, [query, difficulty]);

  const filtered = useMemo(() => results, [results]);

  function pick(m: AutocompleteOption) {
    if (disabledIds?.has(m.id)) return;
    onPick(m);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = filtered[active];
      if (m) pick(m);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && filtered.length > 0 && !disabled;

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Guess a Bollywood film
      </label>
      <div className="relative">
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-activedescendant={showList ? `${listId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          aria-busy={loading}
          value={query}
          placeholder={disabled ? "Game over" : "Search for a film…"}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (blurTimerRef.current) {
              clearTimeout(blurTimerRef.current);
              blurTimerRef.current = null;
            }
            setOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => {
              setOpen(false);
              blurTimerRef.current = null;
            }, 120);
          }}
          onKeyDown={onKeyDown}
          className="h-14 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-base text-foreground shadow-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          🔍
        </span>
      </div>

      {showList && (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="absolute top-full z-40 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          {filtered.map((m, i) => {
            const used = disabledIds?.has(m.id) ?? false;
            return (
              <li
                key={m.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={active === i}
                aria-disabled={used}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                  active === i ? "bg-surface-muted" : ""
                } ${used ? "text-muted line-through" : "text-foreground"}`}
              >
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                  {m.posterThumb ? (
                    <Image
                      src={m.posterThumb}
                      alt=""
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.title}</div>
                  <div className="text-xs tabular-nums text-muted">{m.year}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
