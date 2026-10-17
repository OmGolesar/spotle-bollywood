import { render, screen, cleanup, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { ConfirmGiveUpSheet } from "./ConfirmGiveUpSheet";

afterEach(() => cleanup());

describe("ConfirmGiveUpSheet", () => {
  it("does not render when open is false", () => {
    render(
      <ConfirmGiveUpSheet
        open={false}
        busy={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders with aria-label='Confirm give up' when open (E2E dependency)", () => {
    render(
      <ConfirmGiveUpSheet
        open
        busy={false}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByRole("dialog", { name: /Confirm give up/i })).toBeTruthy();
  });

  it("calls onCancel on Keep guessing click", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmGiveUpSheet
        open
        busy={false}
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    screen.getByRole("button", { name: /Keep guessing/i }).click();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm on Give up click (name '^Give up$' per E2E)", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmGiveUpSheet
        open
        busy={false}
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );
    screen.getByRole("button", { name: /^Give up$/i }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables Give up when busy", () => {
    render(
      <ConfirmGiveUpSheet
        open
        busy
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(
      (screen.getByRole("button", { name: /^Give up/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("closes on Escape", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmGiveUpSheet
        open
        busy={false}
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
