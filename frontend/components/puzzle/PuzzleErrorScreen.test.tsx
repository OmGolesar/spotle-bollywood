import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { PuzzleErrorScreen } from "./PuzzleErrorScreen";

afterEach(() => cleanup());

describe("PuzzleErrorScreen", () => {
  it("renders 'No puzzle today' for no_puzzle variant", () => {
    render(<PuzzleErrorScreen variant="no_puzzle" />);
    expect(screen.getByText(/No puzzle today/i)).toBeTruthy();
  });

  it("renders a retry button when onRetry provided (other variant)", () => {
    const onRetry = vi.fn();
    render(<PuzzleErrorScreen variant="other" onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: /Retry/i });
    btn.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders a loading state with no CTA", () => {
    render(<PuzzleErrorScreen variant="loading" />);
    expect(screen.getByText(/Loading puzzle/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders backend_not_configured copy", () => {
    render(<PuzzleErrorScreen variant="backend_not_configured" />);
    expect(screen.getByText(/Backend not configured/i)).toBeTruthy();
  });
});
