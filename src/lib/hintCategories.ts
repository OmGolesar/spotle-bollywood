export const HINT_CATEGORIES = ["tagline", "filmography", "cast"] as const;
export type HintCategory = (typeof HINT_CATEGORIES)[number];

export const HINT_META: Record<HintCategory, { label: string; description: string; icon: string }> = {
  tagline: { label: "Tagline", description: "The film's tagline", icon: "💬" },
  filmography: { label: "Filmography", description: "Another film by the same director", icon: "🎞" },
  cast: { label: "Cast", description: "A key cast member", icon: "⭐" },
};
