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
  const isMiss = highlight === "gray";
  const ring =
    highlight === "green"
      ? "ring-2 ring-[var(--tile-green)]"
      : highlight === "yellow"
        ? "ring-2 ring-[var(--tile-yellow)]"
        : "ring-1 ring-border";
  const nameColor =
    highlight === "green"
      ? "text-[var(--tile-green)] font-semibold"
      : highlight === "yellow"
        ? "text-[var(--tile-yellow)] font-semibold"
        : "text-muted";
  const imageFilter = isMiss ? "grayscale(1) opacity(0.6)" : undefined;

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
            style={{ filter: imageFilter }}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted"
            style={{ opacity: isMiss ? 0.6 : 1 }}
          >
            {initials(name)}
          </span>
        )}
      </div>
      <span
        className={`max-w-[6rem] truncate text-center text-[11px] leading-tight sm:max-w-[7rem] ${nameColor}`}
      >
        {name}
      </span>
    </div>
  );
}

type Props = {
  movie: GuessedMovieBrief;
  tiles: TileState[];
  guessIndex?: number;
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
    ? "bg-[var(--tile-green)] text-white"
    : close
      ? "bg-[var(--tile-yellow)] text-black"
      : "bg-surface-muted text-foreground";

  return (
    <div
      className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg px-2 py-2 text-center ${bg}`}
      aria-label={`${tile.label}: ${tile.value}${tile.arrow ? (tile.arrow === "up" ? " higher" : " lower") : ""}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {tile.label}
      </span>
      <div className="flex w-full items-baseline justify-center gap-1 text-sm font-semibold leading-tight">
        <span className="min-w-0 truncate">{tile.value}</span>
        {tile.arrow && <ArrowGlyph dir={tile.arrow} />}
      </div>
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
  chipColors,
  peopleImages,
}: {
  label: string;
  names: string[];
  color: TileState["color"];
  chipColors?: TileState["color"][];
  peopleImages: Record<string, string>;
}) {
  const correct = color === "green";
  const close = color === "yellow";
  const borderCls = correct
    ? "border-[var(--tile-green)]"
    : close
      ? "border-[var(--tile-yellow)]"
      : "border-border";

  if (names.length === 0) return null;

  return (
    <div className={`rounded-lg border ${borderCls} bg-surface px-3 py-2.5`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2.5">
        {names.map((n, i) => (
          <PersonChip
            key={n}
            name={n}
            imagePath={peopleImages[n]}
            highlight={chipColors?.[i] ?? color}
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
      aria-label={
        guessIndex != null ? `Guess ${guessIndex + 1}: ${movie.title}` : movie.title
      }
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
            {guessIndex != null && (
              <span className="shrink-0 text-xs tabular-nums text-muted">
                Guess {guessIndex + 1}
              </span>
            )}
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
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
        <PeopleRow
          label="Director"
          names={movie.director}
          color={director?.color ?? "gray"}
          chipColors={director?.chipColors}
          peopleImages={movie.peopleImages}
        />
        <PeopleRow
          label="Lead cast"
          names={movie.castTop3}
          color={cast?.color ?? "gray"}
          chipColors={cast?.chipColors}
          peopleImages={movie.peopleImages}
        />
      </div>
    </article>
  );
}
