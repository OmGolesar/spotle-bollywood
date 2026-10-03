import Image from "next/image";
import type { TileState } from "@/lib/types";

export type GuessedMovieBrief = {
  id: string;
  title: string;
  year: number;
  posterUrl: string;
  genres: string[];
  director: string[];
  castTop3: string[];
  peopleImages: Record<string, string>;
};

const TMDB_PROFILE_PREFIX = "https://image.tmdb.org/t/p/w185";

function profileUrl(profilePath?: string): string | null {
  if (!profilePath) return null;
  return `${TMDB_PROFILE_PREFIX}${profilePath}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function PersonChip({
  name,
  imagePath,
  highlight,
}: {
  name: string;
  imagePath?: string;
  highlight: "green" | "yellow" | "gray";
}) {
  const url = profileUrl(imagePath);
  const ring =
    highlight === "green"
      ? "ring-2 ring-[var(--tile-yellow)]"
      : highlight === "yellow"
        ? "ring-1 ring-[color-mix(in_oklab,var(--tile-yellow)_60%,transparent)]"
        : "ring-1 ring-border";

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div
        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-muted sm:h-14 sm:w-14 ${ring}`}
      >
        {url ? (
          <Image
            src={url}
            alt=""
            fill
            sizes="56px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted">
            {initials(name)}
          </span>
        )}
      </div>
      <span className="max-w-[6rem] truncate text-center text-[11px] leading-tight text-foreground sm:max-w-[7rem]">
        {name}
      </span>
    </div>
  );
}

type Props = {
  movie: GuessedMovieBrief;
  tiles: TileState[];
  guessIndex: number;
  animate?: boolean;
};

function tileByKey(tiles: TileState[], key: TileState["key"]) {
  return tiles.find((t) => t.key === key);
}

function ArrowGlyph({ dir }: { dir: "up" | "down" }) {
  return (
    <span aria-hidden="true" className="ml-1 inline-block leading-none">
      {dir === "up" ? "↑" : "↓"}
    </span>
  );
}

function AttrBox({ tile }: { tile: TileState | undefined }) {
  if (!tile) return null;
  const correct = tile.color === "green";
  const close = tile.color === "yellow";
  const bg = correct
    ? "bg-[var(--tile-yellow)] text-black"
    : close
      ? "bg-[color-mix(in_oklab,var(--tile-yellow)_28%,var(--surface-muted))] text-foreground"
      : "bg-surface-muted text-foreground";

  return (
    <div
      className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center ${bg}`}
      aria-label={`${tile.label}: ${tile.value}${tile.arrow ? (tile.arrow === "up" ? " higher" : " lower") : ""}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {tile.label}
      </span>
      <span className="flex items-baseline justify-center text-sm font-semibold leading-tight">
        <span className="truncate max-w-[7.5rem] sm:max-w-[9rem]">{tile.value}</span>
        {tile.arrow && <ArrowGlyph dir={tile.arrow} />}
      </span>
    </div>
  );
}

function GenrePill({ label, matched }: { label: string; matched: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        matched
          ? "bg-[var(--tile-green)] text-white"
          : "bg-surface-muted text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function PeopleRow({
  label,
  names,
  color,
  peopleImages,
}: {
  label: string;
  names: string[];
  color: TileState["color"];
  peopleImages: Record<string, string>;
}) {
  const correct = color === "green";
  const close = color === "yellow";
  const borderCls = correct
    ? "border-[var(--tile-yellow)]"
    : close
      ? "border-[color-mix(in_oklab,var(--tile-yellow)_40%,var(--border))]"
      : "border-border";

  if (names.length === 0) return null;

  return (
    <div className={`rounded-lg border ${borderCls} bg-surface px-3 py-2.5`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2.5">
        {names.map((n) => (
          <PersonChip
            key={n}
            name={n}
            imagePath={peopleImages[n]}
            highlight={color}
          />
        ))}
      </div>
    </div>
  );
}

export function GuessCard({ movie, tiles, guessIndex, animate = false }: Props) {
  const year = tileByKey(tiles, "year");
  const boxOffice = tileByKey(tiles, "boxOffice");
  const music = tileByKey(tiles, "music");
  const banner = tileByKey(tiles, "banner");
  const imdb = tileByKey(tiles, "imdb");
  const genre = tileByKey(tiles, "genre");
  const director = tileByKey(tiles, "director");
  const cast = tileByKey(tiles, "cast");

  const genreMatchColor = genre?.color ?? "gray";

  return (
    <article
      className="guess-card-anim rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4"
      style={animate ? undefined : { animation: "none" }}
      aria-label={`Guess ${guessIndex + 1}: ${movie.title}`}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted sm:w-28">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt=""
              fill
              sizes="112px"
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">
              {movie.title}
              <span className="ml-1.5 text-sm font-medium text-muted">
                ({movie.year})
              </span>
            </h3>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              Guess {guessIndex + 1}
            </span>
          </div>

          {movie.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {movie.genres.map((g) => (
                <GenrePill
                  key={g}
                  label={g}
                  matched={genreMatchColor !== "gray"}
                />
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
            <AttrBox tile={year} />
            <AttrBox tile={boxOffice} />
            <AttrBox tile={imdb} />
            <AttrBox tile={banner} />
            <AttrBox tile={music} />
            <AttrBox tile={{ ...(genre ?? { key: "genre", label: "Genre", value: "—", color: "gray" }) }} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
        <PeopleRow
          label="Director"
          names={movie.director}
          color={director?.color ?? "gray"}
          peopleImages={movie.peopleImages}
        />
        <PeopleRow
          label="Lead cast"
          names={movie.castTop3}
          color={cast?.color ?? "gray"}
          peopleImages={movie.peopleImages}
        />
      </div>
    </article>
  );
}
