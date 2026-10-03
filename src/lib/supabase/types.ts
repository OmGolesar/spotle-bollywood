export type Difficulty = "easy" | "medium" | "hard";
export type PuzzleStatus = "scheduled" | "live" | "archived";
export type PlayOutcome = "in_progress" | "won" | "lost";
export type DataQuality = "verified" | "tmdb_only" | "partial";

export type MovieRow = {
  id: string;
  tmdb_id: number | null;
  title: string;
  title_alternates: string[];
  year: number;
  director: string[];
  cast_top3: string[];
  music_directors: string[];
  banner: string;
  banner_parent: string | null;
  genres: string[];
  box_office_cr: number | null;
  imdb_score: number | null;
  poster_url: string;
  trivia: string;
  where_to_watch_url: string | null;
  tagline: string;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
  data_quality: DataQuality;
  people_images: Record<string, string>;
};

export type MovieCatalogRow = Pick<
  MovieRow,
  "id" | "title" | "title_alternates" | "year" | "poster_url"
>;

export type DailyPuzzleRow = {
  puzzle_date: string;
  difficulty: Difficulty;
  movie_id: string;
  status: PuzzleStatus;
};

export type PlayRow = {
  id: string;
  player_id: string;
  puzzle_date: string;
  difficulty: Difficulty;
  guesses: GuessLogEntry[];
  hints_used: number;
  hints_revealed_categories: string[];
  outcome: PlayOutcome;
  won_on_guess: number | null;
  started_at: string;
  completed_at: string | null;
};

export type GuessLogEntry = {
  movieId: string;
  correct: boolean;
  at: string;
};

export type StreakRow = {
  player_id: string;
  difficulty: Difficulty;
  current_streak: number;
  max_streak: number;
  total_plays: number;
  total_wins: number;
  last_played_date: string | null;
};

export type EdgePairRow = { a: string; b: string };
