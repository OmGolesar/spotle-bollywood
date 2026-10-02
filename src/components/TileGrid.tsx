import type { TileState } from "@/lib/types";

type Props = {
  tiles: TileState[];
  animate?: boolean;
};

const COLOR_VAR: Record<TileState["color"], string> = {
  green: "var(--tile-green)",
  yellow: "var(--tile-yellow)",
  gray: "var(--tile-gray)",
};

function ArrowGlyph({ dir }: { dir: "up" | "down" }) {
  return (
    <span aria-hidden="true" className="ml-1 inline-block leading-none">
      {dir === "up" ? "▲" : "▼"}
    </span>
  );
}

function tileAriaLabel(t: TileState): string {
  const color =
    t.color === "green" ? "match" : t.color === "yellow" ? "partial match" : "no match";
  const arrow = t.arrow === "up" ? ", higher" : t.arrow === "down" ? ", lower" : "";
  return `${t.label}: ${t.value} — ${color}${arrow}`;
}

export function TileGrid({ tiles, animate = false }: Props) {
  return (
    <ol
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-8"
      aria-label="Comparison tiles"
    >
      {tiles.map((t, i) => (
        <li
          key={t.key}
          aria-label={tileAriaLabel(t)}
          className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2 text-white tile-anim"
          style={
            {
              background: COLOR_VAR[t.color],
              animationDelay: animate ? `${i * 60}ms` : "0ms",
            } as React.CSSProperties
          }
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/85">
            {t.label}
          </span>
          <span className="flex items-baseline text-[13px] font-semibold leading-tight text-center">
            <span className="line-clamp-1">{t.value}</span>
            {t.arrow && <ArrowGlyph dir={t.arrow} />}
          </span>
        </li>
      ))}
    </ol>
  );
}
