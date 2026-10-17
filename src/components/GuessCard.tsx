import Image from "next/image";
import type { TileState, TileColor } from "@/lib/types";
import { TILE_COLOR_VAR } from "@/frontend/components/puzzle/tileColor";
import "@/frontend/styles/puzzle.css";

export type GuessedMovieBrief = {
  id: string;
  title: string;
  year: number;
  posterUrl: string;
  genres: string[];
  director: string[];
  castTop3: string[];
  peopleImages: Record<string, string>;
  bannerLogoPath?: string | null;
};

const DEVANAGARI_INDEX = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "१०"] as const;

function devNumeral(n: number): string {
  if (n < 0 || n >= DEVANAGARI_INDEX.length) return String(n);
  return DEVANAGARI_INDEX[n]!;
}

const TMDB_PROFILE_PREFIX = "https://image.tmdb.org/t/p/w185";

function profileUrl(path?: string): string | null {
  if (!path) return null;
  return `${TMDB_PROFILE_PREFIX}${path}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function tileByKey(tiles: TileState[], key: TileState["key"]) {
  return tiles.find((t) => t.key === key);
}

/** Order of tiles in the 1×8 (desktop) / 4×2 (mobile) grid. Matches the mockup. */
const TILE_ORDER: TileState["key"][] = [
  "director",
  "cast",
  "year",
  "boxOffice",
  "music",
  "banner",
  "genre",
  "imdb",
];

function Tile({
  tile,
  devHigh,
}: {
  tile: TileState | undefined;
  devHigh: string;
}) {
  if (!tile) return <div className="bw-guess-tile placeholder" aria-hidden="true" />;
  const arrowGlyph = tile.arrow === "up" ? "↑" : tile.arrow === "down" ? "↓" : "";
  const ariaLabel = `${tile.label}: ${tile.value}${tile.arrow ? (tile.arrow === "up" ? " higher" : " lower") : ""}`;
  return (
    <div
      className={`bw-guess-tile ${tile.color}`}
      style={{ background: TILE_COLOR_VAR[tile.color] }}
      aria-label={ariaLabel}
    >
      <span className="bw-guess-tile-numeral" aria-hidden="true">
        {devHigh}
      </span>
      <div className="label">{tile.label}</div>
      <div className="value">
        <span className="val-text">{tile.value}</span>
        {arrowGlyph && <span className="arrow" aria-hidden="true">{arrowGlyph}</span>}
      </div>
    </div>
  );
}

function GenrePill({ label, color }: { label: string; color: TileColor }) {
  return (
    <span
      className={`bw-genre-pill ${color}`}
      style={color === "gray" ? undefined : { background: TILE_COLOR_VAR[color] }}
    >
      {label}
    </span>
  );
}

function PersonPortrait({
  name,
  imagePath,
  highlight,
  devHigh,
}: {
  name: string;
  imagePath?: string;
  highlight: TileColor;
  devHigh: string;
}) {
  const url = profileUrl(imagePath);
  const isMiss = highlight === "gray";
  const ringColor =
    highlight === "green"
      ? "var(--teal)"
      : highlight === "yellow"
        ? "var(--mustard)"
        : "rgba(26,22,18,0.2)";
  const nameClass =
    highlight === "green"
      ? "match-green"
      : highlight === "yellow"
        ? "match-yellow"
        : "match-gray";
  return (
    <div className="bw-person">
      <div
        className="bw-person-portrait"
        style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
      >
        <span className="bw-person-devnum" aria-hidden="true">{devHigh}</span>
        {url ? (
          <Image
            src={url}
            alt=""
            fill
            sizes="56px"
            unoptimized
            className="object-cover"
            style={{ filter: isMiss ? "grayscale(1) opacity(0.6)" : undefined }}
          />
        ) : (
          <span className="bw-person-initials" style={{ opacity: isMiss ? 0.6 : 1 }}>
            {initials(name)}
          </span>
        )}
      </div>
      <span className={`bw-person-name ${nameClass}`}>{name}</span>
    </div>
  );
}

function PeopleRow({
  label,
  names,
  color,
  chipColors,
  peopleImages,
  rowDevHigh,
}: {
  label: string;
  names: string[];
  color: TileColor;
  chipColors?: TileColor[];
  peopleImages: Record<string, string>;
  rowDevHigh: string;
}) {
  if (names.length === 0) return null;
  const borderColor =
    color === "green"
      ? "var(--teal)"
      : color === "yellow"
        ? "var(--mustard)"
        : "rgba(26,22,18,0.14)";
  return (
    <div className="bw-people-row" style={{ borderColor }}>
      <div className="bw-people-label">{label}</div>
      <div className="bw-people-portraits">
        {names.map((n, i) => (
          <PersonPortrait
            key={n}
            name={n}
            imagePath={peopleImages[n]}
            highlight={chipColors?.[i] ?? color}
            devHigh={rowDevHigh}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  movie: GuessedMovieBrief;
  tiles: TileState[];
  guessIndex?: number;
  animate?: boolean;
};

export function GuessCard({ movie, tiles, guessIndex, animate = false }: Props) {
  const director = tileByKey(tiles, "director");
  const cast = tileByKey(tiles, "cast");
  const genre = tileByKey(tiles, "genre");
  const genreChipColors = genre?.chipColors;
  const idx = (guessIndex ?? 0) + 1;
  const devHigh = devNumeral(idx);

  return (
    <article
      className={`bw-guess-card${animate ? " is-latest" : ""}`}
      aria-label={
        guessIndex != null ? `Guess ${guessIndex + 1}: ${movie.title}` : movie.title
      }
    >
      <span className="corner tl" aria-hidden="true">★</span>
      <span className="corner tr" aria-hidden="true">★</span>
      <span className="corner bl" aria-hidden="true">★</span>
      <span className="corner br" aria-hidden="true">★</span>

      <header className="bw-guess-header">
        <div className="bw-guess-poster">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt=""
              fill
              sizes="56px"
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="bw-guess-meta">
          <h3 className="bw-guess-title">
            {movie.title}
            <span className="bw-guess-year">({movie.year})</span>
          </h3>
          {movie.genres.length > 0 && (
            <div className="bw-guess-genres">
              {movie.genres.map((g, i) => (
                <GenrePill
                  key={g}
                  label={g}
                  color={genreChipColors?.[i] ?? "gray"}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="bw-guess-tiles">
        {TILE_ORDER.map((key) => (
          <Tile key={key} tile={tileByKey(tiles, key)} devHigh={devHigh} />
        ))}
      </div>

      <div className="bw-guess-people">
        <PeopleRow
          label="Director"
          names={movie.director}
          color={director?.color ?? "gray"}
          chipColors={director?.chipColors}
          peopleImages={movie.peopleImages}
          rowDevHigh={devHigh}
        />
        <PeopleRow
          label="Lead cast"
          names={movie.castTop3}
          color={cast?.color ?? "gray"}
          chipColors={cast?.chipColors}
          peopleImages={movie.peopleImages}
          rowDevHigh={devHigh}
        />
      </div>
    </article>
  );
}
