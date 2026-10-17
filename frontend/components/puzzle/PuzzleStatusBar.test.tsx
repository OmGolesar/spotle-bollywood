import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { PuzzleStatusBar } from "./PuzzleStatusBar";

afterEach(() => cleanup());

const base = {
  difficulty: "easy" as const,
  guessesUsed: 0,
  stillPlaying: true,
  hintsLeft: 0,
  onOpenHints: () => {},
  onGiveUp: () => {},
  giveUpDisabled: false,
};

describe("PuzzleStatusBar", () => {
  it("renders the counter with correct remaining-guess accessible name (10 of 10 at start)", () => {
    render(<PuzzleStatusBar {...base} />);
    expect(screen.getByLabelText(/10 guesses remaining/i)).toBeTruthy();
  });

  it("shows GUESS 1 as the visible counter after 0 guesses used (while still playing)", () => {
    const { container } = render(<PuzzleStatusBar {...base} guessesUsed={0} />);
    // Visible counter when stillPlaying should show the NEXT guess number (1), not 0.
    // Query textContent since the number is wrapped in a child span.
    expect(container.querySelector(".counter")?.textContent).toMatch(/GUESS\s*1/);
  });

  it("Hints button is reachable via aria-label 'Open hints'", () => {
    const onOpenHints = vi.fn();
    render(<PuzzleStatusBar {...base} onOpenHints={onOpenHints} />);
    const btn = screen.getByRole("button", { name: /Open hints/i });
    btn.click();
    expect(onOpenHints).toHaveBeenCalledOnce();
  });

  it("Give up button is reachable via aria-label 'Give up'", () => {
    const onGiveUp = vi.fn();
    render(<PuzzleStatusBar {...base} onGiveUp={onGiveUp} />);
    screen.getByRole("button", { name: /Give up/i }).click();
    expect(onGiveUp).toHaveBeenCalledOnce();
  });

  it("Give up is disabled when giveUpDisabled=true (ruling 6: race protection)", () => {
    render(<PuzzleStatusBar {...base} giveUpDisabled />);
    expect(
      (screen.getByRole("button", { name: /Give up/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("Give up is disabled when !stillPlaying", () => {
    render(<PuzzleStatusBar {...base} stillPlaying={false} />);
    expect(
      (screen.getByRole("button", { name: /Give up/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("renders the mustard count badge when hintsLeft > 0", () => {
    const { container } = render(<PuzzleStatusBar {...base} hintsLeft={2} />);
    expect(container.querySelector(".bw-hint-count")).toBeTruthy();
    expect(container.querySelector(".bw-hint-count")?.textContent).toBe("2");
  });

  it("hides the count badge when hintsLeft is 0", () => {
    const { container } = render(<PuzzleStatusBar {...base} hintsLeft={0} />);
    expect(container.querySelector(".bw-hint-count")).toBeNull();
  });
});
