import type { TileColor } from "@/lib/types";

/**
 * Component-local mapping from the game-logic tile color names to the
 * Bollywood design-token CSS variables. Keeps TileState.color's existing
 * "green" | "yellow" | "gray" vocabulary intact in src/lib/tiles.ts and
 * src/lib/types.ts so game logic is untouched.
 */
export const TILE_COLOR_VAR: Record<TileColor, string> = {
  green: "var(--teal)",
  yellow: "var(--mustard)",
  gray: "var(--matchbox-red)",
};
