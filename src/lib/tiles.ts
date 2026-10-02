import type { Movie, TileState, TileKey } from "./types";

function intersects<T>(a: T[], b: T[]): boolean {
  const set = new Set(a);
  for (const item of b) if (set.has(item)) return true;
  return false;
}

function fmtNumList(xs: string[], max = 3): string {
  if (xs.length === 0) return "—";
  return xs.slice(0, max).join(", ");
}

function arrow(from: number, to: number): "up" | "down" | null {
  if (from === to) return null;
  return from < to ? "up" : "down";
}

export function compareMovies(guess: Movie, mystery: Movie): TileState[] {
  const tiles: TileState[] = [];

  tiles.push({
    key: "director",
    label: "Director",
    color: intersects(guess.director, mystery.director) ? "green" : "gray",
    value: fmtNumList(guess.director),
  });

  const cast: TileState = {
    key: "cast",
    label: "Lead cast",
    color: "gray",
    value: fmtNumList(guess.castTop3),
  };
  let anyMatchPosition = false;
  let anyMatchDifferentPosition = false;
  for (let i = 0; i < guess.castTop3.length; i++) {
    const name = guess.castTop3[i];
    const pos = mystery.castTop3.indexOf(name);
    if (pos === i) anyMatchPosition = true;
    else if (pos !== -1) anyMatchDifferentPosition = true;
  }
  cast.color = anyMatchPosition
    ? "green"
    : anyMatchDifferentPosition
    ? "yellow"
    : "gray";
  tiles.push(cast);

  const dy = mystery.year - guess.year;
  tiles.push({
    key: "year",
    label: "Year",
    color: dy === 0 ? "green" : Math.abs(dy) <= 5 ? "yellow" : "gray",
    arrow: dy === 0 ? null : dy > 0 ? "up" : "down",
    value: String(guess.year),
  });

  const bo: TileState = {
    key: "boxOffice",
    label: "Box office",
    color: "gray",
    value:
      guess.boxOfficeCr != null ? `₹${guess.boxOfficeCr.toFixed(0)} cr` : "—",
  };
  if (guess.boxOfficeCr != null && mystery.boxOfficeCr != null && mystery.boxOfficeCr > 0) {
    const rel = Math.abs(guess.boxOfficeCr - mystery.boxOfficeCr) / mystery.boxOfficeCr;
    if (rel <= 0.1) bo.color = "green";
    else if (rel <= 0.5) {
      bo.color = "yellow";
      bo.arrow = guess.boxOfficeCr < mystery.boxOfficeCr ? "up" : "down";
    }
  }
  tiles.push(bo);

  tiles.push({
    key: "music",
    label: "Music",
    color: intersects(guess.musicDirectors, mystery.musicDirectors) ? "green" : "gray",
    value: fmtNumList(guess.musicDirectors),
  });

  let bannerColor: TileState["color"] = "gray";
  if (guess.banner === mystery.banner) bannerColor = "green";
  else if (
    guess.bannerParent &&
    mystery.bannerParent &&
    guess.bannerParent === mystery.bannerParent
  )
    bannerColor = "yellow";
  tiles.push({
    key: "banner",
    label: "Banner",
    color: bannerColor,
    value: guess.banner,
  });

  const genreOverlap = intersects(guess.genres, mystery.genres);
  const genreEqual =
    guess.genres.length === mystery.genres.length &&
    guess.genres.every((g) => mystery.genres.includes(g));
  tiles.push({
    key: "genre",
    label: "Genre",
    color: genreEqual ? "green" : genreOverlap ? "yellow" : "gray",
    value: fmtNumList(guess.genres, 2),
  });

  const imdb: TileState = {
    key: "imdb",
    label: "IMDb",
    color: "gray",
    value: guess.imdbScore != null ? guess.imdbScore.toFixed(1) : "—",
  };
  if (guess.imdbScore != null && mystery.imdbScore != null) {
    const d = Math.abs(guess.imdbScore - mystery.imdbScore);
    if (d <= 0.3) imdb.color = "green";
    else if (d <= 1.0) {
      imdb.color = "yellow";
      imdb.arrow = arrow(guess.imdbScore, mystery.imdbScore);
    }
  }
  tiles.push(imdb);

  return tiles;
}

export const TILE_ORDER: TileKey[] = [
  "director",
  "cast",
  "year",
  "boxOffice",
  "music",
  "banner",
  "genre",
  "imdb",
];
