import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { EndOfRoundBanner } from "./EndOfRoundBanner";

describe("EndOfRoundBanner", () => {
  afterEach(() => cleanup());

  it("renders won variant with 'Solved in N guesses'", () => {
    render(
      <EndOfRoundBanner
        outcome="won"
        guessCount={4}
        answerTitle="Lagaan"
        answerYear={2001}
        onViewSummary={() => {}}
      />,
    );
    expect(screen.getByText(/Solved in 4 guesses/i)).toBeTruthy();
  });

  it("uses singular 'guess' when guessCount is 1", () => {
    render(
      <EndOfRoundBanner
        outcome="won"
        guessCount={1}
        answerTitle="A"
        answerYear={2001}
        onViewSummary={() => {}}
      />,
    );
    expect(screen.getByText(/Solved in 1 guess\b/)).toBeTruthy();
  });

  it("renders lost variant with 'Out of guesses'", () => {
    render(
      <EndOfRoundBanner
        outcome="lost"
        guessCount={10}
        answerTitle="A"
        answerYear={2001}
        onViewSummary={() => {}}
      />,
    );
    expect(screen.getByText(/Out of guesses/i)).toBeTruthy();
  });

  it("calls onViewSummary when the View summary button is clicked", () => {
    const onClick = vi.fn();
    render(
      <EndOfRoundBanner
        outcome="won"
        guessCount={2}
        answerTitle="A"
        answerYear={2001}
        onViewSummary={onClick}
      />,
    );
    screen.getByRole("button", { name: /View summary/i }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies the won / lost class on the root", () => {
    const { container } = render(
      <EndOfRoundBanner
        outcome="won"
        guessCount={2}
        answerTitle="A"
        answerYear={2001}
        onViewSummary={() => {}}
      />,
    );
    expect(container.querySelector(".bw-end-banner.won")).toBeTruthy();
    cleanup();
    const { container: c2 } = render(
      <EndOfRoundBanner
        outcome="lost"
        guessCount={10}
        answerTitle="A"
        answerYear={2001}
        onViewSummary={() => {}}
      />,
    );
    expect(c2.querySelector(".bw-end-banner.lost")).toBeTruthy();
  });
});
