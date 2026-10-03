import { expect, test } from "@playwright/test";
import { installApiMocks } from "./mocks";

test.describe("Puzzle flow", () => {
  test("loads the puzzle screen with top bar, poster, input, and empty-state helper", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/easy");

    await expect(page.getByRole("link", { name: /Back to home/i })).toBeVisible();
    await expect(page.getByLabel(/10 guesses remaining/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Open hints/i })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByText(/Pick any film/i)).toBeVisible();
  });

  test("autocomplete filters and submitting a wrong guess appends a tile row", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/easy");

    const input = page.getByRole("combobox");
    await input.fill("lag");
    const option = page.getByRole("option", { name: /Lagaan/i }).first();
    await expect(option).toBeVisible();
    await option.click();

    await expect(page.getByRole("heading", { level: 3, name: /Lagaan/i })).toBeVisible();
    await expect(page.getByText(/Guess 1$/)).toBeVisible();
    // Counter dropped
    await expect(page.getByLabel(/9 guesses remaining/i)).toBeVisible();
  });

  test("submitting the correct guess opens the result screen with the answer", async ({
    page,
  }) => {
    await installApiMocks(page, { correctMovieId: "mock-b" });
    await page.goto("/easy");

    const input = page.getByRole("combobox");
    await input.fill("3");
    await page.getByRole("option", { name: /3 Idiots/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Solved!/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/In 1 guess/i)).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /3 Idiots/i })).toBeVisible();
    await expect(dialog.getByText(/Mock trivia for the result screen/i)).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Where to watch/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Share result/i })).toBeVisible();
  });
});
