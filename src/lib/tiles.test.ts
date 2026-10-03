import { describe, it, expect } from "vitest";
import { compareMovies, type EdgeIndex } from "./tiles";
import type { Movie } from "./types";

function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: "x",
    title: "Test",
    year: 2000,
    director: ["D1"],
    castTop3: ["A", "B", "C"],
    musicDirectors: ["M1"],
    banner: "B1",
    bannerParent: null,
    genres: ["Drama"],
    boxOfficeCr: 100,
    imdbScore: 7.5,
    posterUrl: "",
    trivia: "",
    whereToWatchUrl: null,
    hintEasy: "",
    hintMedium: "",
    hintHard: "",
    ...overrides,
  };
}

const noEdges: EdgeIndex = { directors: new Map(), music: new Map() };

function tileByKey(result: ReturnType<typeof compareMovies>, key: string) {
  const t = result.find((x) => x.key === key);
  if (!t) throw new Error(`missing ${key}`);
  return t;
}

describe("compareMovies — director tile", () => {
  it("green when director arrays intersect", () => {
    const guess = movie({ director: ["Zoya Akhtar", "Reema Kagti"] });
    const mystery = movie({ director: ["Zoya Akhtar"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "director").color).toBe("green");
  });

  it("gray with no overlap and no co-direction edge", () => {
    const guess = movie({ director: ["Guru Dutt"] });
    const mystery = movie({ director: ["Satyajit Ray"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "director").color).toBe("gray");
  });

  it("yellow when guess director co-directed with mystery director on another film", () => {
    const edges: EdgeIndex = {
      directors: new Map([["Abbas Alibhai Burmawalla", new Set(["Mastan Alibhai Burmawalla"])]]),
      music: new Map(),
    };
    const guess = movie({ director: ["Abbas Alibhai Burmawalla"] });
    const mystery = movie({ director: ["Mastan Alibhai Burmawalla"] });
    expect(tileByKey(compareMovies(guess, mystery, edges), "director").color).toBe("yellow");
  });

  it("green takes precedence over the yellow edge rule", () => {
    const edges: EdgeIndex = {
      directors: new Map([["A", new Set(["A"])]]),
      music: new Map(),
    };
    const guess = movie({ director: ["A"] });
    const mystery = movie({ director: ["A"] });
    expect(tileByKey(compareMovies(guess, mystery, edges), "director").color).toBe("green");
  });
});

describe("compareMovies — cast tile", () => {
  it("green when any cast member matches at the same billing position", () => {
    const guess = movie({ castTop3: ["Shah Rukh Khan", "Kajol", "Amrish Puri"] });
    const mystery = movie({ castTop3: ["Shah Rukh Khan", "Rani Mukerji", "Amrish Puri"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "cast").color).toBe("green");
  });

  it("yellow when a cast member appears but in a different position", () => {
    const guess = movie({ castTop3: ["Kajol", "Shah Rukh Khan", "X"] });
    const mystery = movie({ castTop3: ["Shah Rukh Khan", "Kajol", "Y"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "cast").color).toBe("yellow");
  });

  it("gray with no cast overlap", () => {
    const guess = movie({ castTop3: ["A", "B", "C"] });
    const mystery = movie({ castTop3: ["D", "E", "F"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "cast").color).toBe("gray");
  });

  it("prefers green over yellow when both would be possible", () => {
    const guess = movie({ castTop3: ["A", "B", "C"] });
    const mystery = movie({ castTop3: ["A", "C", "B"] });
    expect(tileByKey(compareMovies(guess, mystery, noEdges), "cast").color).toBe("green");
  });
});

describe("compareMovies — year tile", () => {
  it("green when years match exactly", () => {
    const t = tileByKey(compareMovies(movie({ year: 2001 }), movie({ year: 2001 }), noEdges), "year");
    expect(t.color).toBe("green");
    expect(t.arrow).toBeFalsy();
  });

  it("yellow within 5 years with up arrow when mystery is later", () => {
    const t = tileByKey(compareMovies(movie({ year: 2000 }), movie({ year: 2004 }), noEdges), "year");
    expect(t.color).toBe("yellow");
    expect(t.arrow).toBe("up");
  });

  it("yellow within 5 years with down arrow when mystery is earlier", () => {
    const t = tileByKey(compareMovies(movie({ year: 2010 }), movie({ year: 2008 }), noEdges), "year");
    expect(t.color).toBe("yellow");
    expect(t.arrow).toBe("down");
  });

  it("gray beyond 5 years", () => {
    const t = tileByKey(compareMovies(movie({ year: 2000 }), movie({ year: 2010 }), noEdges), "year");
    expect(t.color).toBe("gray");
  });

  it("boundary: 5 years diff is still yellow", () => {
    const t = tileByKey(compareMovies(movie({ year: 2000 }), movie({ year: 2005 }), noEdges), "year");
    expect(t.color).toBe("yellow");
  });

  it("boundary: 6 years diff is gray", () => {
    const t = tileByKey(compareMovies(movie({ year: 2000 }), movie({ year: 2006 }), noEdges), "year");
    expect(t.color).toBe("gray");
  });
});

describe("compareMovies — box office tile", () => {
  it("gray when either side is null", () => {
    expect(
      tileByKey(compareMovies(movie({ boxOfficeCr: null }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice").color
    ).toBe("gray");
    expect(
      tileByKey(compareMovies(movie({ boxOfficeCr: 100 }), movie({ boxOfficeCr: null }), noEdges), "boxOffice").color
    ).toBe("gray");
  });

  it("green within 10% of mystery", () => {
    const t = tileByKey(compareMovies(movie({ boxOfficeCr: 105 }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice");
    expect(t.color).toBe("green");
    expect(t.arrow).toBeFalsy();
  });

  it("yellow within 50% with up arrow when mystery is higher", () => {
    const t = tileByKey(compareMovies(movie({ boxOfficeCr: 60 }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice");
    expect(t.color).toBe("yellow");
    expect(t.arrow).toBe("up");
  });

  it("yellow within 50% with down arrow when mystery is lower", () => {
    const t = tileByKey(compareMovies(movie({ boxOfficeCr: 140 }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice");
    expect(t.color).toBe("yellow");
    expect(t.arrow).toBe("down");
  });

  it("gray beyond 50%", () => {
    const t = tileByKey(compareMovies(movie({ boxOfficeCr: 10 }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice");
    expect(t.color).toBe("gray");
  });

  it("displays '—' and gray when guess value is null", () => {
    const t = tileByKey(compareMovies(movie({ boxOfficeCr: null }), movie({ boxOfficeCr: 100 }), noEdges), "boxOffice");
    expect(t.value).toBe("—");
    expect(t.color).toBe("gray");
  });
});

describe("compareMovies — music director tile", () => {
  it("green when MDs intersect", () => {
    const g = movie({ musicDirectors: ["A. R. Rahman", "Clinton Cerejo"] });
    const m = movie({ musicDirectors: ["A. R. Rahman"] });
    expect(tileByKey(compareMovies(g, m, noEdges), "music").color).toBe("green");
  });

  it("yellow when guess MD co-composed with mystery MD", () => {
    const edges: EdgeIndex = {
      directors: new Map(),
      music: new Map([["Shankar", new Set(["Ehsaan"])]]),
    };
    const g = movie({ musicDirectors: ["Shankar"] });
    const m = movie({ musicDirectors: ["Ehsaan"] });
    expect(tileByKey(compareMovies(g, m, edges), "music").color).toBe("yellow");
  });

  it("gray with no overlap and no edge", () => {
    const g = movie({ musicDirectors: ["X"] });
    const m = movie({ musicDirectors: ["Y"] });
    expect(tileByKey(compareMovies(g, m, noEdges), "music").color).toBe("gray");
  });
});

describe("compareMovies — banner tile", () => {
  it("green when banner strings are identical", () => {
    const g = movie({ banner: "Yash Raj Films" });
    const m = movie({ banner: "Yash Raj Films" });
    expect(tileByKey(compareMovies(g, m, noEdges), "banner").color).toBe("green");
  });

  it("yellow when banner_parent matches (sister label)", () => {
    const g = movie({ banner: "YRF Entertainment", bannerParent: "YRF" });
    const m = movie({ banner: "Yash Raj Films", bannerParent: "YRF" });
    expect(tileByKey(compareMovies(g, m, noEdges), "banner").color).toBe("yellow");
  });

  it("gray with different banners and no shared parent", () => {
    const g = movie({ banner: "A", bannerParent: null });
    const m = movie({ banner: "B", bannerParent: null });
    expect(tileByKey(compareMovies(g, m, noEdges), "banner").color).toBe("gray");
  });

  it("gray when one side has a null bannerParent even if the other does not", () => {
    const g = movie({ banner: "A", bannerParent: null });
    const m = movie({ banner: "B", bannerParent: "P" });
    expect(tileByKey(compareMovies(g, m, noEdges), "banner").color).toBe("gray");
  });
});

describe("compareMovies — genre tile", () => {
  it("green when genre sets are equal regardless of order", () => {
    const g = movie({ genres: ["Drama", "Romance"] });
    const m = movie({ genres: ["Romance", "Drama"] });
    expect(tileByKey(compareMovies(g, m, noEdges), "genre").color).toBe("green");
  });

  it("yellow when at least one genre overlaps", () => {
    const g = movie({ genres: ["Drama", "Comedy"] });
    const m = movie({ genres: ["Drama", "Action"] });
    expect(tileByKey(compareMovies(g, m, noEdges), "genre").color).toBe("yellow");
  });

  it("gray with no genre overlap", () => {
    const g = movie({ genres: ["Comedy"] });
    const m = movie({ genres: ["Horror"] });
    expect(tileByKey(compareMovies(g, m, noEdges), "genre").color).toBe("gray");
  });
});

describe("compareMovies — IMDb tile", () => {
  it("green only when the displayed tenths are equal", () => {
    const t = tileByKey(compareMovies(movie({ imdbScore: 7.9 }), movie({ imdbScore: 7.9 }), noEdges), "imdb");
    expect(t.color).toBe("green");
    expect(t.arrow).toBeUndefined();
  });

  it("0.1 away is yellow with an arrow (not green)", () => {
    const higher = tileByKey(compareMovies(movie({ imdbScore: 6.9 }), movie({ imdbScore: 7.0 }), noEdges), "imdb");
    expect(higher.color).toBe("yellow");
    expect(higher.arrow).toBe("up");
    const lower = tileByKey(compareMovies(movie({ imdbScore: 7.1 }), movie({ imdbScore: 7.0 }), noEdges), "imdb");
    expect(lower.color).toBe("yellow");
    expect(lower.arrow).toBe("down");
  });

  it("yellow at the 0.5 edge with an arrow", () => {
    const t = tileByKey(compareMovies(movie({ imdbScore: 7.0 }), movie({ imdbScore: 7.5 }), noEdges), "imdb");
    expect(t.color).toBe("yellow");
    expect(t.arrow).toBe("up");
  });

  it("gray beyond 0.5 points", () => {
    const t = tileByKey(compareMovies(movie({ imdbScore: 7.0 }), movie({ imdbScore: 7.8 }), noEdges), "imdb");
    expect(t.color).toBe("gray");
    const far = tileByKey(compareMovies(movie({ imdbScore: 5.0 }), movie({ imdbScore: 8.0 }), noEdges), "imdb");
    expect(far.color).toBe("gray");
  });

  it("gray when either side is null and displays '—'", () => {
    const t = tileByKey(compareMovies(movie({ imdbScore: null }), movie({ imdbScore: 8.0 }), noEdges), "imdb");
    expect(t.color).toBe("gray");
    expect(t.value).toBe("—");
  });
});

describe("compareMovies — structural guarantees", () => {
  it("always returns 8 tiles in the canonical order", () => {
    const tiles = compareMovies(movie(), movie(), noEdges);
    expect(tiles.map((t) => t.key)).toEqual([
      "director",
      "cast",
      "year",
      "boxOffice",
      "music",
      "banner",
      "genre",
      "imdb",
    ]);
  });

  it("comparing a movie to itself yields all green", () => {
    const m = movie({
      director: ["D"],
      castTop3: ["A", "B", "C"],
      musicDirectors: ["M"],
      banner: "B",
      bannerParent: "P",
      genres: ["X", "Y"],
      boxOfficeCr: 50,
      imdbScore: 7.0,
      year: 1999,
    });
    const colors = compareMovies(m, m, noEdges).map((t) => t.color);
    expect(colors.every((c) => c === "green")).toBe(true);
  });

  it("color-symmetry: swapping guess and mystery yields the same color per tile (null-safe fields)", () => {
    const a = movie({
      director: ["D1"],
      castTop3: ["X", "Y", "Z"],
      musicDirectors: ["M1"],
      banner: "B1",
      bannerParent: "P1",
      genres: ["G1", "G2"],
      year: 2000,
      boxOfficeCr: 100,
      imdbScore: 7.0,
    });
    const b = movie({
      director: ["D1"],
      castTop3: ["X", "Y", "Z"],
      musicDirectors: ["M2"],
      banner: "B2",
      bannerParent: "P1",
      genres: ["G1", "G3"],
      year: 2000,
      boxOfficeCr: 100,
      imdbScore: 7.1,
    });
    const ab = compareMovies(a, b, noEdges).map((t) => t.color);
    const ba = compareMovies(b, a, noEdges).map((t) => t.color);
    expect(ab).toEqual(ba);
  });
});
