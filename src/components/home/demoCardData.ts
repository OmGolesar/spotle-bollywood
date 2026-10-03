import type { TileState } from "@/lib/types";
import type { GuessedMovieBrief } from "@/components/GuessCard";

const TMDB = "https://image.tmdb.org/t/p/w500";

// Educational demo — these aren't today's answers, just a visual example.
// Partial-match row: Dangal (2016) — shows a mix of green / yellow / gray.
export const DEMO_PARTIAL_MOVIE: GuessedMovieBrief = {
  id: "demo-partial",
  title: "Dangal",
  year: 2016,
  posterUrl: `${TMDB}/lymfdW5Imk5qH4hXyvv8pMoVfPx.jpg`,
  genres: ["Drama", "Sport", "Biography"],
  director: ["Nitesh Tiwari"],
  castTop3: ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
  peopleImages: {
    "Nitesh Tiwari": "/j80zq3yoAiKdbPt8rGxkRxWuERM.jpg",
    "Aamir Khan": "/8CsLBYm3W15RpjzVxLhCXfU9CM.jpg",
    "Fatima Sana Shaikh": "/tnmL0CfBXwIAlrZzVVk0GSYQcm2.jpg",
    "Sanya Malhotra": "/qV8EpXkWBYMEJTvGPwBqA4ArJYt.jpg",
  },
};

export const DEMO_PARTIAL_TILES: TileState[] = [
  { key: "director", label: "Director", color: "gray", value: "Nitesh Tiwari" },
  { key: "cast", label: "Lead cast", color: "yellow", value: "Aamir Khan, Fatima Sana Shaikh, Sanya Malhotra" },
  { key: "year", label: "Year", color: "yellow", arrow: "down", value: "2016" },
  { key: "boxOffice", label: "Box office", color: "yellow", arrow: "down", value: "₹800 cr" },
  { key: "music", label: "Music", color: "gray", value: "Pritam" },
  { key: "banner", label: "Banner", color: "yellow", value: "Aamir Khan Productions" },
  { key: "genre", label: "Genre", color: "yellow", value: "Drama, Sport" },
  { key: "imdb", label: "IMDb", color: "yellow", arrow: "up", value: "8.3" },
];

// Winning-row demo: 3 Idiots (2009) — everything green.
export const DEMO_WIN_MOVIE: GuessedMovieBrief = {
  id: "demo-win",
  title: "3 Idiots",
  year: 2009,
  posterUrl: `${TMDB}/66A9MqXOyVFCssoloscw79z8Tew.jpg`,
  genres: ["Comedy", "Drama"],
  director: ["Rajkumar Hirani"],
  castTop3: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
  peopleImages: {
    "Rajkumar Hirani": "/dzMaqy6YxBHj6LxrdYwTVf12rNY.jpg",
    "Aamir Khan": "/8CsLBYm3W15RpjzVxLhCXfU9CM.jpg",
    "R. Madhavan": "/gfbkEzeOhcl27TNVoBVvM0t8OWX.jpg",
    "Sharman Joshi": "/5wPkFJ8t6jVfhRvFyG3hM1z8ePy.jpg",
  },
};

export const DEMO_WIN_TILES: TileState[] = [
  { key: "director", label: "Director", color: "green", value: "Rajkumar Hirani" },
  { key: "cast", label: "Lead cast", color: "green", value: "Aamir Khan, R. Madhavan, Sharman Joshi" },
  { key: "year", label: "Year", color: "green", value: "2009" },
  { key: "boxOffice", label: "Box office", color: "green", value: "₹460 cr" },
  { key: "music", label: "Music", color: "green", value: "Shantanu Moitra" },
  { key: "banner", label: "Banner", color: "green", value: "Vinod Chopra Films" },
  { key: "genre", label: "Genre", color: "green", value: "Comedy, Drama" },
  { key: "imdb", label: "IMDb", color: "green", value: "8.4" },
];
