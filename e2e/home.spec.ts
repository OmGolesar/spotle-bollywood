import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("renders bilingual wordmark, hero tagline, three mode cards, and the Hard badge", async ({ page }) => {
    await page.goto("/");

    // Wait out the loading overlay
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });

    // Bilingual wordmark top-left
    await expect(page.locator(".brand-mini")).toHaveText("बॉलीवुड स्पॉटल");

    // Hero tagline (Devanagari H1 + English sub). First H1 is the hero;
    // the loading overlay briefly renders a second H1 during its fade-out.
    await expect(page.getByRole("heading", { level: 1, name: /आज की फ़िल्म/ })).toBeVisible();
    await expect(page.locator(".bw-tagline-en")).toContainText(/Guess today.s film in 10 tries/i);

    // Three mode cards, each a link to its difficulty route
    for (const diff of ["easy", "medium", "hard"] as const) {
      const card = page.locator(`a[href='/${diff}']`).first();
      await expect(card).toBeVisible();
    }

    // Hard mode has the badge
    await expect(page.locator(".bw-mode-badge")).toContainText(/🎬⭐ Hard/i);
  });

  test("shows an IST date pill", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator(".bw-date-pill")).toContainText(/· IST/);
  });

  test("renders the How it works + Attributes + FAQ sections and the final Play CTA", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });

    await expect(page.getByRole("heading", { level: 2, name: /How it works/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Pick any Hindi film/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Read the clues/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Zero in on the answer/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Every tile tells a story/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /^FAQ/i })).toBeVisible();
    // Final CTA
    await expect(page.getByRole("link", { name: /PLAY TODAY.S FILM/i })).toBeVisible();
  });

  test("FAQ accordion expands when a question is clicked", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
    const summary = page.getByText(/^When does the daily film reset\?$/i);
    await summary.scrollIntoViewIfNeeded();
    await summary.click();
    await expect(page.getByText(/Everyone playing on the same calendar day/i)).toBeVisible();
  });

  test("info-strip 'How to play' pill opens the HowToPlaySheet dialog", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
    // The info-strip pill — restyled trigger from HowToPlaySheet(triggerClassName=bw-pill-outline-ink)
    await page.locator(".bw-pill-outline-ink", { hasText: /how to play/i }).first().click();
    await expect(page.getByRole("dialog", { name: /how to play/i })).toBeVisible();
    await expect(page.getByText(/8 color-coded tiles/i)).toBeVisible();
    await page.getByRole("button", { name: /close dialog/i }).click();
    await expect(page.getByRole("dialog", { name: /how to play/i })).not.toBeVisible();
  });

  test("util-bar streak chip is hidden when all streaks are 0", async ({ page }) => {
    // Clear cookies so the server reads a fresh player with no streaks.
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
    // Util bar renders without the streak chip when all streaks are 0.
    await expect(page.locator(".brand-mini")).toBeVisible();
    await expect(page.locator(".streak-chip")).toHaveCount(0);
  });
});
