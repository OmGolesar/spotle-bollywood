import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { PuzzleEmptyState } from "./PuzzleEmptyState";

afterEach(() => cleanup());

describe("PuzzleEmptyState", () => {
  it("renders the bilingual pick-any-film helper", () => {
    render(<PuzzleEmptyState />);
    expect(screen.getByText(/Pick any film/i)).toBeTruthy();
  });
});
