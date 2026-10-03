import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("renders wordmark, headline, three mode cards, and the how-to-play link", async ({ page }) => {
    await page.goto("/");

    // Wordmark
    await expect(page.getByRole("link", { name: /Spotle Bollywood/i })).toBeVisible();

    // Headline (regex matches the split-span text)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/mystery/i);

    // Three mode cards, each a link to its difficulty route
    for (const diff of ["easy", "medium", "hard"] as const) {
      const card = page.locator(`a[href='/${diff}']`);
      await expect(card).toBeVisible();
    }

    // Hard mode has the gold badge
    await expect(page.getByText(/🎬⭐ Hard/i)).toBeVisible();

    // How to play opens a dialog
    await page.getByRole("button", { name: /^how to play$/i }).click();
    await expect(page.getByRole("dialog", { name: /how to play/i })).toBeVisible();
    await expect(page.getByText(/8 color-coded tiles/i)).toBeVisible();
    await page.getByRole("button", { name: /close dialog/i }).click();
    await expect(page.getByRole("dialog", { name: /how to play/i })).not.toBeVisible();
  });

  test("shows an IST date label", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("p", { hasText: "· IST" }).first()).toBeVisible();
  });
});
