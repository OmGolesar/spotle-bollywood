"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Difficulty } from "@/lib/difficulty";
import type { Movie } from "@/lib/types";
import { searchCatalog } from "@/lib/mock";

type Props = {
  difficulty: Difficulty;
  disabled?: boolean;
  disabledIds?: Set<string>;
  onPick: (movie: Movie) => void;
};

export function GuessAutocomplete({ difficulty, disabled, disabledIds, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo<Movie[]>(() => {
    const r = searchCatalog(difficulty, debounced);
    return r;
  }, [difficulty, debounced]);

  useEffect(() => {
    setActive(0);
  }, [debounced]);

  function pick(m: Movie) {
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
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = results[active];
      if (m) pick(m);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && results.length > 0 && !disabled;

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Guess a Bollywood film
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${listId}-list`}
        aria-activedescendant={showList ? `${listId}-opt-${active}` : undefined}
        aria-autocomplete="list"
        value={query}
        placeholder={disabled ? "Game over" : "Type a Bollywood film…"}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground shadow-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      {showList && (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="absolute bottom-full z-40 mb-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          {results.map((m, i) => {
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
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  active === i ? "bg-surface-muted" : ""
                } ${used ? "text-muted line-through" : "text-foreground"}`}
              >
                <span className="truncate">{m.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {m.year}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
