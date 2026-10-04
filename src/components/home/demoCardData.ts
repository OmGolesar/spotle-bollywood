import type { TileState } from "@/lib/types";
import type { GuessedMovieBrief } from "@/components/GuessCard";

// Real TMDB paths pulled from the live movies table (via the TMDB
// import pipeline). Dangal is used as the "partial match" row: some
// tiles are green, some gold, some grey — the educational mix. 3
// Idiots is used as the "all green" win-state row.

// Partial-match demo row ----------------------------------------------------
export const DEMO_PARTIAL_MOVIE: GuessedMovieBrief = {
  id: "demo-partial",
  title: "Dangal",
  year: 2016,
  posterUrl: "https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg",
  genres: ["Drama", "Family", "Comedy"],
  director: ["Nitesh Tiwari"],
  castTop3: ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
  peopleImages: {
    "Nitesh Tiwari": "/h80yPI8rDKlUk29dWFFl6Is8J0P.jpg",
    "Aamir Khan": "/6uiZSwi2kvd1jZ7X7Xz9W9VGuV4.jpg",
    "Fatima Sana Shaikh": "/eVOziSvi6PLL5vkROHO1sbsKUFW.jpg",
    "Sanya Malhotra": "/sQ0VIqGLecfpwYayO05Z7NC32yN.jpg",
  },
  bannerLogoPath: null,
};

export const DEMO_PARTIAL_TILES: TileState[] = [
  { key: "director", label: "Director", color: "gray", value: "Nitesh Tiwari" },
  { key: "cast", label: "Lead cast", color: "yellow", value: "Aamir Khan, Fatima Sana Shaikh, Sanya Malhotra" },
  { key: "year", label: "Year", color: "yellow", arrow: "down", value: "2016" },
  { key: "boxOffice", label: "Box office", color: "yellow", arrow: "down", value: "₹387 cr" },
  { key: "music", label: "Music", color: "gray", value: "Pritam Chakraborty" },
  { key: "banner", label: "Banner", color: "yellow", value: "Aamir Khan Productions" },
  { key: "genre", label: "Genre", color: "yellow", value: "Drama, Family", chipColors: ["green", "gray", "green"] },
  { key: "imdb", label: "IMDb", color: "yellow", arrow: "up", value: "7.9" },
];

// All-green win-state demo row ---------------------------------------------
export const DEMO_WIN_MOVIE: GuessedMovieBrief = {
  id: "demo-win",
  title: "3 Idiots",
  year: 2009,
  posterUrl: "https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg",
  genres: ["Drama", "Comedy"],
  director: ["Rajkumar Hirani"],
  castTop3: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
  peopleImages: {
    "Rajkumar Hirani": "/wNnmF3mzG7kyaTYuFr5uMpHIJSw.jpg",
    "Aamir Khan": "/6uiZSwi2kvd1jZ7X7Xz9W9VGuV4.jpg",
    "R. Madhavan": "/gaDrAdXxIrbBRCd9cX8YvJDEuLb.jpg",
    "Sharman Joshi": "/mQr8ynFFVq08qgQ4aSNl5B0ko8v.jpg",
  },
  bannerLogoPath: null,
};

export const DEMO_WIN_TILES: TileState[] = [
  { key: "director", label: "Director", color: "green", value: "Rajkumar Hirani" },
  { key: "cast", label: "Lead cast", color: "green", value: "Aamir Khan, R. Madhavan, Sharman Joshi" },
  { key: "year", label: "Year", color: "green", value: "2009" },
  { key: "boxOffice", label: "Box office", color: "green", value: "₹460 cr" },
  { key: "music", label: "Music", color: "green", value: "Shantanu Moitra" },
  { key: "banner", label: "Banner", color: "green", value: "Vidhu Vinod Chopra" },
  { key: "genre", label: "Genre", color: "green", value: "Drama, Comedy", chipColors: ["green", "green"] },
  { key: "imdb", label: "IMDb", color: "green", value: "8.0" },
];
