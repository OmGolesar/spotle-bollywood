import type { Difficulty } from "./difficulty";
import { DIFFICULTY_META } from "./difficulty";
import type { GuessRow, PuzzleOutcome } from "./types";
import { TOTAL_GUESSES } from "./types";

const EMOJI: Record<"green" | "yellow" | "gray", string> = {
  green: "🟩",
  yellow: "🟨",
  gray: "⬛",
};

export function emojiGrid(guesses: GuessRow[]): string {
  return guesses.map((g) => g.tiles.map((t) => EMOJI[t.color]).join("")).join("\n");
}

export function shareTitle(
  difficulty: Difficulty,
  outcome: PuzzleOutcome,
  guessesUsed: number
): string {
  const label = DIFFICULTY_META[difficulty].label;
  const prestige = difficulty === "hard" ? " 🎬⭐" : "";
  if (outcome === "won") {
    return `Spotle Bollywood · ${label}${prestige}  ${guessesUsed}/${TOTAL_GUESSES}`;
  }
  return `Spotle Bollywood · ${label}${prestige}  X/${TOTAL_GUESSES}`;
}

export function buildShareText(opts: {
  difficulty: Difficulty;
  outcome: PuzzleOutcome;
  guesses: GuessRow[];
  dateLabel: string;
  siteUrl?: string;
}): string {
  const { difficulty, outcome, guesses, dateLabel, siteUrl } = opts;
  const title = shareTitle(difficulty, outcome, guesses.length);
  const grid = emojiGrid(guesses);
  const site = siteUrl ?? "spotle-bollywood";
  return `${title}  ·  ${dateLabel}\n\n${grid}\n\n${site}`;
}

export type ShareOutcome =
  | { via: "native" }
  | { via: "whatsapp" }
  | { via: "clipboard" }
  | { via: "fallback"; text: string };

export async function share(text: string, title?: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text, title });
      return { via: "native" };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { via: "fallback", text };
      }
    }
  }

  if (typeof window !== "undefined") {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const w = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (w) return { via: "whatsapp" };
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { via: "clipboard" };
    } catch {
      /* fall through */
    }
  }

  return { via: "fallback", text };
}
