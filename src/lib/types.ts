export type Movie = {
  id: string;
  title: string;
  year: number;
  director: string[];
  castTop3: string[];
  musicDirectors: string[];
  banner: string;
  bannerParent: string | null;
  genres: string[];
  boxOfficeCr: number | null;
  imdbScore: number | null;
  posterUrl: string;
  trivia: string;
  whereToWatchUrl: string | null;
  hintEasy: string;
  hintMedium: string;
  hintHard: string;
};

export type TileColor = "green" | "yellow" | "gray";
export type TileArrow = "up" | "down" | null;

export type TileKey =
  | "director"
  | "cast"
  | "year"
  | "boxOffice"
  | "music"
  | "banner"
  | "genre"
  | "imdb";

export type TileState = {
  key: TileKey;
  label: string;
  color: TileColor;
  arrow?: TileArrow;
  value: string;
};

export type GuessRow = {
  movie: Movie;
  tiles: TileState[];
};

export type PuzzleOutcome = "in_progress" | "won" | "lost";

export const TOTAL_GUESSES = 10;
export const MAX_HINTS = 2;
export const HINT_UNLOCKS: readonly number[] = [3, 6];
