const ATTRS = [
  { n: "01", label: "Director", desc: "Who helmed the film." },
  { n: "02", label: "Lead cast", desc: "Top three billed actors." },
  { n: "03", label: "Year", desc: "Theatrical release year." },
  { n: "04", label: "Box office", desc: "Lifetime India gross in ₹ crore." },
  { n: "05", label: "Music", desc: "Composer or music director." },
  { n: "06", label: "Banner", desc: "Primary production company." },
  { n: "07", label: "Genre", desc: "Up to two primary genres." },
  { n: "08", label: "IMDb score", desc: "Audience rating out of 10." },
] as const;

export function GameAttributes() {
  return (
    <section
      aria-label="Game attributes"
      className="flex flex-col gap-6 border-t border-border pt-10 sm:pt-14"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        What the eight tiles mean
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ATTRS.map((a) => (
          <div
            key={a.n}
            className="relative flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4"
          >
            <span className="absolute right-3 top-3 text-[10px] font-semibold tabular-nums text-muted">
              {a.n}
            </span>
            <div className="font-display text-base font-semibold text-accent">{a.label}</div>
            <div className="text-xs leading-5 text-muted">{a.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
