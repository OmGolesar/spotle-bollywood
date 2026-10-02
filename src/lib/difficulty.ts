export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; blurb: string; poolHint: string }
> = {
  easy: {
    label: "Easy",
    blurb: "Modern blockbusters. Great for casual fans.",
    poolHint: "~500 films",
  },
  medium: {
    label: "Medium",
    blurb: "Well-known hits across the decades.",
    poolHint: "~1,500 films",
  },
  hard: {
    label: "Hard",
    blurb: "Parallel, cult, and deep-cut cinema.",
    poolHint: "3,000+ films",
  },
};
