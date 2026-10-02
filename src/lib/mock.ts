import type { Difficulty } from "./difficulty";
import type { Movie } from "./types";

function placeholderPoster(seed: string): string {
  const hue = Math.abs(hash(seed)) % 360;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue},70%,45%)"/><stop offset="100%" stop-color="hsl(${(hue + 40) % 360},65%,25%)"/></linearGradient></defs><rect width="500" height="750" fill="url(#g)"/><text x="250" y="400" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="rgba(255,255,255,0.85)">${seed}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const MOVIES: Movie[] = [
  {
    id: "dilwale-dulhania-le-jayenge",
    title: "Dilwale Dulhania Le Jayenge",
    year: 1995,
    director: ["Aditya Chopra"],
    castTop3: ["Shah Rukh Khan", "Kajol", "Amrish Puri"],
    musicDirectors: ["Jatin-Lalit"],
    banner: "Yash Raj Films",
    bannerParent: "YRF",
    genres: ["Romance", "Drama"],
    boxOfficeCr: 102,
    imdbScore: 8.1,
    posterUrl: placeholderPoster("DDLJ"),
    trivia:
      "Still running at Mumbai's Maratha Mandir since 1995 — the longest theatrical run in Indian film history.",
    whereToWatchUrl: "https://www.primevideo.com",
    hintEasy: "Lead actor: Shah Rukh Khan.",
    hintMedium: "Lead actor's debut was in 1988.",
    hintHard: "The director's father produced Deewaar.",
  },
  {
    id: "3-idiots",
    title: "3 Idiots",
    year: 2009,
    director: ["Rajkumar Hirani"],
    castTop3: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
    musicDirectors: ["Shantanu Moitra"],
    banner: "Vinod Chopra Films",
    bannerParent: null,
    genres: ["Comedy", "Drama"],
    boxOfficeCr: 460,
    imdbScore: 8.4,
    posterUrl: placeholderPoster("3I"),
    trivia:
      "Loosely adapted from Chetan Bhagat's novel 'Five Point Someone'; the book was uncredited in early marketing, causing a public spat.",
    whereToWatchUrl: "https://www.primevideo.com",
    hintEasy: "Lead actor: Aamir Khan.",
    hintMedium: "Director also made PK.",
    hintHard: "The film's composer scored a Pradeep Sarkar debut feature.",
  },
  {
    id: "lagaan",
    title: "Lagaan",
    year: 2001,
    director: ["Ashutosh Gowariker"],
    castTop3: ["Aamir Khan", "Gracy Singh", "Rachel Shelley"],
    musicDirectors: ["A. R. Rahman"],
    banner: "Aamir Khan Productions",
    bannerParent: null,
    genres: ["Drama", "Sport"],
    boxOfficeCr: 65,
    imdbScore: 8.1,
    posterUrl: placeholderPoster("LGN"),
    trivia:
      "Only the third Indian film ever nominated for Best Foreign Language Film at the Oscars.",
    whereToWatchUrl: "https://www.netflix.com",
    hintEasy: "A village plays cricket against the British.",
    hintMedium: "Composer: A. R. Rahman.",
    hintHard: "Shot entirely in a reconstructed Kutch village over six months.",
  },
  {
    id: "zindagi-na-milegi-dobara",
    title: "Zindagi Na Milegi Dobara",
    year: 2011,
    director: ["Zoya Akhtar"],
    castTop3: ["Hrithik Roshan", "Farhan Akhtar", "Abhay Deol"],
    musicDirectors: ["Shankar-Ehsaan-Loy"],
    banner: "Excel Entertainment",
    bannerParent: null,
    genres: ["Drama", "Adventure"],
    boxOfficeCr: 153,
    imdbScore: 8.1,
    posterUrl: placeholderPoster("ZNMD"),
    trivia:
      "Shot across Spain in 60 days; running of the bulls was captured guerrilla-style with real festival crowds.",
    whereToWatchUrl: "https://www.primevideo.com",
    hintEasy: "Three friends on a road trip in Spain.",
    hintMedium: "Director's brother co-stars.",
    hintHard: "Soundtrack trio also scored Dil Chahta Hai.",
  },
  {
    id: "gully-boy",
    title: "Gully Boy",
    year: 2019,
    director: ["Zoya Akhtar"],
    castTop3: ["Ranveer Singh", "Alia Bhatt", "Siddhant Chaturvedi"],
    musicDirectors: ["Various"],
    banner: "Excel Entertainment",
    bannerParent: null,
    genres: ["Drama", "Music"],
    boxOfficeCr: 238,
    imdbScore: 7.9,
    posterUrl: placeholderPoster("GB"),
    trivia:
      "India's official entry for the 92nd Academy Awards; inspired by Mumbai street rappers Divine and Naezy.",
    whereToWatchUrl: "https://www.primevideo.com",
    hintEasy: "A Mumbai rapper's rise.",
    hintMedium: "Director previously made ZNMD.",
    hintHard: "Composed by a collective of 54 musicians.",
  },
  {
    id: "andaz-apna-apna",
    title: "Andaz Apna Apna",
    year: 1994,
    director: ["Rajkumar Santoshi"],
    castTop3: ["Aamir Khan", "Salman Khan", "Raveena Tandon"],
    musicDirectors: ["Tushar Bhatia"],
    banner: "Vinay Pictures",
    bannerParent: null,
    genres: ["Comedy"],
    boxOfficeCr: 7,
    imdbScore: 8.6,
    posterUrl: placeholderPoster("AAA"),
    trivia:
      "A box-office flop on release that became an all-time cult classic through TV reruns in the 2000s.",
    whereToWatchUrl: null,
    hintEasy: "Aamir and Salman share top billing in a comedy.",
    hintMedium: "Director also made Ghayal.",
    hintHard: "The composer never scored another feature.",
  },
  {
    id: "pyaasa",
    title: "Pyaasa",
    year: 1957,
    director: ["Guru Dutt"],
    castTop3: ["Guru Dutt", "Waheeda Rehman", "Mala Sinha"],
    musicDirectors: ["S. D. Burman"],
    banner: "Guru Dutt Films",
    bannerParent: null,
    genres: ["Drama", "Musical"],
    boxOfficeCr: null,
    imdbScore: 8.3,
    posterUrl: placeholderPoster("PY"),
    trivia:
      "Named by Time magazine as one of the 100 greatest films of all time.",
    whereToWatchUrl: null,
    hintEasy: "A struggling poet in 1950s Calcutta.",
    hintMedium: "Director also starred.",
    hintHard: "Lyricist was a founding member of the Progressive Writers' Association.",
  },
  {
    id: "jaane-bhi-do-yaaro",
    title: "Jaane Bhi Do Yaaro",
    year: 1983,
    director: ["Kundan Shah"],
    castTop3: ["Naseeruddin Shah", "Ravi Baswani", "Om Puri"],
    musicDirectors: ["Vanraj Bhatia"],
    banner: "NFDC",
    bannerParent: null,
    genres: ["Comedy", "Satire"],
    boxOfficeCr: null,
    imdbScore: 8.9,
    posterUrl: placeholderPoster("JBDY"),
    trivia:
      "The Mahabharata climax scene was improvised over three days when the planned ending was abandoned.",
    whereToWatchUrl: null,
    hintEasy: "A dark comedy about Mumbai photographers.",
    hintMedium: "The producer, NFDC, backed Shyam Benegal's Ankur.",
    hintHard: "Composer also scored Mandi.",
  },
];

const POOLS: Record<Difficulty, string[]> = {
  easy: ["3-idiots", "zindagi-na-milegi-dobara", "gully-boy", "lagaan"],
  medium: [
    "3-idiots",
    "zindagi-na-milegi-dobara",
    "gully-boy",
    "lagaan",
    "dilwale-dulhania-le-jayenge",
    "andaz-apna-apna",
  ],
  hard: [
    "3-idiots",
    "zindagi-na-milegi-dobara",
    "gully-boy",
    "lagaan",
    "dilwale-dulhania-le-jayenge",
    "andaz-apna-apna",
    "pyaasa",
    "jaane-bhi-do-yaaro",
  ],
};

const MYSTERY_PER_DIFFICULTY: Record<Difficulty, string> = {
  easy: "3-idiots",
  medium: "dilwale-dulhania-le-jayenge",
  hard: "jaane-bhi-do-yaaro",
};

export function moviesForDifficulty(d: Difficulty): Movie[] {
  const ids = new Set(POOLS[d]);
  return MOVIES.filter((m) => ids.has(m.id)).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function mysteryFor(d: Difficulty): Movie {
  const id = MYSTERY_PER_DIFFICULTY[d];
  const m = MOVIES.find((x) => x.id === id);
  if (!m) throw new Error(`No mystery for ${d}`);
  return m;
}

export function searchCatalog(d: Difficulty, query: string, limit = 8): Movie[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = moviesForDifficulty(d);
  const scored = pool
    .map((m) => {
      const t = m.title.toLowerCase();
      let score = 0;
      if (t.startsWith(q)) score = 3;
      else if (t.includes(q)) score = 2;
      else {
        const tokens = t.split(/\s+/);
        if (tokens.some((tok) => tok.startsWith(q))) score = 1;
      }
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.m.title.localeCompare(b.m.title));
  return scored.slice(0, limit).map((x) => x.m);
}
