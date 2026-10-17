import type { TileState } from "@/lib/types";
import type { GuessedMovieBrief } from "@/components/GuessCard";
import type { DemoGuessCardProps } from "@/frontend/components/home/DemoGuessCard";

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

// Bollywood-redesign bilingual demo cards (used by HowItWorks via DemoGuessCard).
// Mirror the end-to-end.html mockup's partial + win demo blocks.
export const DEMO_PARTIAL_BW: DemoGuessCardProps = {
  title: "Lagaan",
  year: 2001,
  director: "A. Gowariker",
  posterLabel: "LAGAAN",
  posterBg: "#8b2b2b",
  tiles: [
    { label: "Director", value: "A. Gowariker", color: "mustard", devIndex: "१" },
    { label: "Cast", value: "A. Khan", color: "teal", devIndex: "२" },
    { label: "Year ↓", value: "2001", color: "red", devIndex: "३" },
    { label: "Box office ↑", value: "₹65 cr", color: "mustard", devIndex: "४" },
    { label: "Music", value: "A.R. Rahman", color: "teal", devIndex: "५" },
    { label: "Banner", value: "Aamir Khan Pr.", color: "red", devIndex: "६" },
    { label: "Genre", value: "Drama · Sport", color: "mustard", devIndex: "७" },
    { label: "IMDb ↓", value: "8.1", color: "red", devIndex: "८" },
  ],
};

export const DEMO_WIN_BW: DemoGuessCardProps = {
  title: "Dil Chahta Hai",
  year: 2001,
  director: "Farhan Akhtar",
  posterLabel: "DIL CHAHTA HAI",
  posterBg: "#2a6b4a",
  tiles: [
    { label: "Director", value: "F. Akhtar", color: "teal", devIndex: "१" },
    { label: "Cast", value: "A. Khan", color: "teal", devIndex: "२" },
    { label: "Year", value: "2001", color: "teal", devIndex: "३" },
    { label: "Box office", value: "₹28 cr", color: "teal", devIndex: "४" },
    { label: "Music", value: "Shankar-Ehsaan-Loy", color: "teal", devIndex: "५" },
    { label: "Banner", value: "Excel Entertainment", color: "teal", devIndex: "६" },
    { label: "Genre", value: "Drama · Romance", color: "teal", devIndex: "७" },
    { label: "IMDb", value: "8.1", color: "teal", devIndex: "८" },
  ],
};
