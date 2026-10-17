import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { ResultScreen, type ResultAnswer } from "./ResultScreen";

const answer: ResultAnswer = {
  id: "x",
  title: "Lagaan",
  year: 2001,
  director: ["Ashutosh Gowariker"],
  castTop3: ["Aamir Khan"],
  trivia: "Trivia text.",
  whereToWatchUrl: null,
  posterUrl: "/p.png",
};

afterEach(() => cleanup());

describe("ResultScreen Escape dismiss", () => {
  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <ResultScreen
        difficulty="easy"
        outcome="won"
        answer={answer}
        guesses={[]}
        streakAfter={1}
        onClose={onClose}
      />,
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
