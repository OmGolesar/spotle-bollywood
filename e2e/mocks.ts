import type { Page, Route } from "@playwright/test";

export type MockCatalogEntry = { id: string; title: string; year: number; posterThumb: string };

export type MockTile = {
  key: string;
  label: string;
  color: "green" | "yellow" | "gray";
  value: string;
  arrow?: "up" | "down";
};

export type MockHintState = {
  usesTotal: number;
  usesRemaining: number;
  unlocksRemaining: number[];
  nextUnlockAtGuess: number | null;
  items: {
    category: "tagline" | "filmography" | "cast";
    available: boolean;
    revealed: boolean;
    text: string | null;
  }[];
};

const DEFAULT_POSTER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='750'%3E%3Crect width='500' height='750' fill='%235ba85a'/%3E%3Ctext x='250' y='400' text-anchor='middle' font-size='48' fill='white'%3EMOCK%3C/text%3E%3C/svg%3E";

const DEFAULT_TILES: MockTile[] = [
  { key: "director", label: "Director", color: "gray", value: "Someone Else" },
  { key: "cast", label: "Lead cast", color: "gray", value: "A, B, C" },
  { key: "year", label: "Year", color: "yellow", value: "2005", arrow: "up" },
  { key: "boxOffice", label: "Box office", color: "gray", value: "—" },
  { key: "music", label: "Music", color: "gray", value: "Someone" },
  { key: "banner", label: "Banner", color: "gray", value: "X Films" },
  { key: "genre", label: "Genre", color: "yellow", value: "Drama" },
  { key: "imdb", label: "IMDb", color: "yellow", value: "7.5", arrow: "up" },
];

const DEFAULT_WIN_TILES: MockTile[] = DEFAULT_TILES.map((t) => ({
  ...t,
  color: "green",
  arrow: undefined,
}));

export type Scenario = {
  catalog?: MockCatalogEntry[];
  initialHintState?: MockHintState;
  correctMovieId?: string;
};

const DEFAULT_CATALOG: MockCatalogEntry[] = [
  { id: "mock-a", title: "Lagaan", year: 2001, posterThumb: DEFAULT_POSTER },
  { id: "mock-b", title: "3 Idiots", year: 2009, posterThumb: DEFAULT_POSTER },
  { id: "mock-c", title: "Dangal", year: 2016, posterThumb: DEFAULT_POSTER },
];

const MOCK_GUESS_MOVIE = {
  posterUrl: DEFAULT_POSTER,
  genres: ["Drama"],
  director: ["Someone Else"],
  castTop3: ["A", "B", "C"],
};

export async function installApiMocks(page: Page, scenario: Scenario = {}) {
  const catalog = scenario.catalog ?? DEFAULT_CATALOG;
  const correctId = scenario.correctMovieId ?? "mock-b";
  let hintState: MockHintState =
    scenario.initialHintState ?? {
      usesTotal: 2,
      usesRemaining: 0,
      unlocksRemaining: [3, 6],
      nextUnlockAtGuess: 3,
      items: [
        { category: "tagline", available: true, revealed: false, text: null },
        { category: "filmography", available: true, revealed: false, text: null },
        { category: "cast", available: true, revealed: false, text: null },
      ],
    };

  const guessesMade: { id: string; correct: boolean }[] = [];

  await page.route("**/api/puzzle*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        puzzleDate: "2026-10-03",
        difficulty: "easy",
        totalGuesses: 10,
        hintsAvailable: 2,
        hintsUsed: 0,
        hintUnlocks: [3, 6],
        hintState,
        posterUrl: DEFAULT_POSTER,
        posterBlurPx: 32,
        outcome: "in_progress",
        existingGuesses: [],
      }),
    });
  });

  await page.route("**/api/catalog*", async (route: Route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const results = catalog.filter((m) => m.title.toLowerCase().includes(q)).slice(0, 8);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results }),
    });
  });

  await page.route("**/api/guess", async (route: Route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as { guessMovieId: string };
    const correct = body.guessMovieId === correctId;
    guessesMade.push({ id: body.guessMovieId, correct });
    const usesUnlocked = [3, 6].filter((g) => guessesMade.length >= g).length;
    const revealedCount = hintState.items.filter((i) => i.revealed).length;
    hintState = {
      ...hintState,
      usesRemaining: Math.max(0, usesUnlocked - revealedCount),
      nextUnlockAtGuess: [3, 6].find((g) => guessesMade.length < g) ?? null,
    };
    const picked = catalog.find((m) => m.id === body.guessMovieId);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        tiles: correct ? DEFAULT_WIN_TILES : DEFAULT_TILES,
        movie: {
          id: body.guessMovieId,
          title: picked?.title ?? "Unknown",
          year: picked?.year ?? 2000,
          ...MOCK_GUESS_MOVIE,
        },
        correct,
        outcome: correct ? "won" : "in_progress",
        guessesRemaining: 10 - guessesMade.length,
        posterBlurPx: correct ? 0 : 32 - guessesMade.length * 3,
        hintState,
      }),
    });
  });

  await page.route("**/api/giveup", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("**/api/hint", async (route: Route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as { category: "tagline" | "filmography" | "cast" };
    const item = hintState.items.find((i) => i.category === body.category);
    if (!item || !item.available) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "unavailable" }),
      });
      return;
    }
    if (hintState.usesRemaining <= 0) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "locked" }),
      });
      return;
    }
    item.revealed = true;
    item.text = `Mock reveal for ${body.category}`;
    hintState = { ...hintState, usesRemaining: hintState.usesRemaining - 1 };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        reveal: { category: body.category, text: item.text },
        state: hintState,
      }),
    });
  });

  await page.route("**/api/finish", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        answer: {
          id: correctId,
          title: "3 Idiots",
          year: 2009,
          director: ["Rajkumar Hirani"],
          castTop3: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
          trivia: "Mock trivia for the result screen.",
          whereToWatchUrl: "https://example.com",
          posterUrl: DEFAULT_POSTER,
        },
        streak: {
          player_id: "test",
          difficulty: "easy",
          current_streak: 1,
          max_streak: 1,
          total_plays: 1,
          total_wins: 1,
          last_played_date: "2026-10-03",
        },
      }),
    });
  });

  await page.route("**/api/streaks", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        streaks: {
          easy: { current_streak: 0, last_played_date: null },
          medium: { current_streak: 0, last_played_date: null },
          hard: { current_streak: 0, last_played_date: null },
        },
      }),
    });
  });
}
