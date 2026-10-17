import { describe, it, expect } from "vitest";
import { TILE_COLOR_VAR } from "./tileColor";

describe("TILE_COLOR_VAR", () => {
  it("maps green to --teal", () => {
    expect(TILE_COLOR_VAR.green).toBe("var(--teal)");
  });
  it("maps yellow to --mustard", () => {
    expect(TILE_COLOR_VAR.yellow).toBe("var(--mustard)");
  });
  it("maps gray to --matchbox-red", () => {
    expect(TILE_COLOR_VAR.gray).toBe("var(--matchbox-red)");
  });
});
