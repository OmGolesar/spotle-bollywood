import type { Movie, TileState, TileKey } from "./types";

export type EdgeIndex = {
  directors: Map<string, Set<string>>;
  music: Map<string, Set<string>>;
};

export const EMPTY_EDGE_INDEX: EdgeIndex = {
  directors: new Map(),
  music: new Map(),
};

function intersects<T>(a: T[], b: T[]): boolean {
  const set = new Set(a);
  for (const item of b) if (set.has(item)) return true;
  return false;
}

function edgeConnects(
  edges: Map<string, Set<string>>,
  xs: string[],
  ys: string[]
): boolean {
  for (const x of xs) {
    const neighbors = edges.get(x);
    if (!neighbors) continue;
    for (const y of ys) if (neighbors.has(y)) return true;
  }
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

function toCents(n: number): number {
  return Math.round(n * 100);
}

/**
 * Display the film's box office in whatever unit Wikipedia reported it:
 * '₹1,968 cr', '$2.8B', '$295M'. Falls back to the normalised crore
 * value if we only have the legacy column, and '—' when nothing is
 * known. Numbers are compact — no decimals once over 10.
 */
function formatBoxOfficeNative(m: Movie): string {
  const amount = m.boxOfficeAmount;
  const cur = m.boxOfficeCurrency;
  if (amount != null && cur) {
    const n = amount < 10 ? amount : Math.round(amount);
    const withCommas = n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
    if (cur === "INR_CR") return `₹${withCommas} cr`;
    if (cur === "USD_M") return `$${withCommas}M`;
    if (cur === "USD_B") return `$${withCommas}B`;
  }
  if (m.boxOfficeCr != null) return `₹${Math.round(m.boxOfficeCr)} cr`;
  return "—";
}

export function compareMovies(
  guess: Movie,
  mystery: Movie,
  edges: EdgeIndex = EMPTY_EDGE_INDEX
): TileState[] {
  const tiles: TileState[] = [];

  const mysteryDirectorSet = new Set(mystery.director);
  const directorEdges = edges.directors;
  const directorChipColors = guess.director.map((d): "green" | "yellow" | "gray" => {
    if (mysteryDirectorSet.has(d)) return "green";
    const neighbours = directorEdges.get(d);
    if (neighbours && mystery.director.some((md) => neighbours.has(md))) return "yellow";
    return "gray";
  });
  const directorOverall: "green" | "yellow" | "gray" = directorChipColors.includes("green")
    ? "green"
    : directorChipColors.includes("yellow")
      ? "yellow"
      : "gray";
  tiles.push({
    key: "director",
    label: "Director",
    color: directorOverall,
    value: fmtNumList(guess.director),
    chipColors: directorChipColors,
  });

  const castChipColors = guess.castTop3.map((name, i): "green" | "yellow" | "gray" => {
    const pos = mystery.castTop3.indexOf(name);
    if (pos === i) return "green";
    if (pos !== -1) return "yellow";
    return "gray";
  });
  const castOverall: "green" | "yellow" | "gray" = castChipColors.includes("green")
    ? "green"
    : castChipColors.includes("yellow")
      ? "yellow"
      : "gray";
  tiles.push({
    key: "cast",
    label: "Lead cast",
    color: castOverall,
    value: fmtNumList(guess.castTop3),
    chipColors: castChipColors,
  });

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
    value: formatBoxOfficeNative(guess),
  };
  if (
    guess.boxOfficeCr != null &&
    mystery.boxOfficeCr != null &&
    mystery.boxOfficeCr > 0
  ) {
    const diffCents = Math.abs(toCents(guess.boxOfficeCr) - toCents(mystery.boxOfficeCr));
    const mysteryCents = toCents(mystery.boxOfficeCr);
    if (diffCents * 10 <= mysteryCents) bo.color = "green";
    else if (diffCents * 2 <= mysteryCents) bo.color = "yellow";
    // Arrow is independent of color — a gray tile still tells the player
    // which direction to search in (same as the Year tile).
    if (guess.boxOfficeCr !== mystery.boxOfficeCr) {
      bo.arrow = guess.boxOfficeCr < mystery.boxOfficeCr ? "up" : "down";
    }
  }
  tiles.push(bo);

  const musicGreen = intersects(guess.musicDirectors, mystery.musicDirectors);
  const musicYellow =
    !musicGreen &&
    edgeConnects(edges.music, guess.musicDirectors, mystery.musicDirectors);
  tiles.push({
    key: "music",
    label: "Music",
    color: musicGreen ? "green" : musicYellow ? "yellow" : "gray",
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

  const guessGenreSet = new Set(guess.genres);
  const mysteryGenreSet = new Set(mystery.genres);
  const genreChipColors = guess.genres.map((g): "green" | "yellow" | "gray" =>
    mysteryGenreSet.has(g) ? "green" : "gray"
  );
  const genreOverlap = genreChipColors.includes("green");
  const genreEqual =
    guessGenreSet.size === mysteryGenreSet.size &&
    guess.genres.every((g) => mysteryGenreSet.has(g));
  tiles.push({
    key: "genre",
    label: "Genre",
    color: genreEqual ? "green" : genreOverlap ? "yellow" : "gray",
    value: fmtNumList(guess.genres, 2),
    chipColors: genreChipColors,
  });

  const imdb: TileState = {
    key: "imdb",
    label: "IMDb",
    color: "gray",
    value: guess.imdbScore != null ? guess.imdbScore.toFixed(1) : "—",
  };
  if (guess.imdbScore != null && mystery.imdbScore != null) {
    // Compare at display precision (one decimal). Green = both films
    // display the same rating; yellow = within 0.5 with an arrow;
    // gray otherwise. The previous threshold (within 0.3 = green) let
    // 6.9 and 7.1 both show green against a 7.0 answer, which read as
    // 'both correct' to players — same guess, two different ratings.
    const diffTenths = Math.abs(
      Math.round(guess.imdbScore * 10) - Math.round(mystery.imdbScore * 10)
    );
    if (diffTenths === 0) imdb.color = "green";
    else if (diffTenths <= 5) imdb.color = "yellow";
    // Arrow is independent of color — a gray IMDb tile still points the
    // player at a higher or lower rating.
    if (diffTenths !== 0) {
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
