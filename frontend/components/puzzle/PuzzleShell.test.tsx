import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { PuzzleShell } from "./PuzzleShell";

describe("PuzzleShell", () => {
  afterEach(() => cleanup());

  it("renders its children inside .bw-puzzle-shell", () => {
    const { container, getByTestId } = render(
      <PuzzleShell>
        <div data-testid="x" />
      </PuzzleShell>,
    );
    expect(container.querySelector(".bw-puzzle-shell")).toBeTruthy();
    expect(getByTestId("x")).toBeTruthy();
  });

  it("applies the chrome-full class by default", () => {
    const { container } = render(<PuzzleShell>x</PuzzleShell>);
    expect(container.querySelector(".bw-puzzle-shell")?.classList.contains("chrome-full")).toBe(true);
  });

  it("applies the chrome-none class when chrome='none'", () => {
    const { container } = render(<PuzzleShell chrome="none">x</PuzzleShell>);
    expect(container.querySelector(".bw-puzzle-shell")?.classList.contains("chrome-none")).toBe(true);
  });

  it("renders a decorative grain overlay (aria-hidden)", () => {
    const { container } = render(<PuzzleShell>x</PuzzleShell>);
    const grain = container.querySelector(".bw-puzzle-grain");
    expect(grain).toBeTruthy();
    expect(grain?.getAttribute("aria-hidden")).toBe("true");
  });
});
