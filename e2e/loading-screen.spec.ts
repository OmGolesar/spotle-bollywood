import { expect, test } from "@playwright/test";

/**
 * Loading-screen acceptance coverage. The gate shows:
 *  - a branded Yatra One Devanagari word-mark on desktop viewports
 *  - the mobile cinematic video on mobile viewports
 * and transitions to the hero afterwards. Session-scoped: not shown twice.
 *
 * Playwright projects wire the viewports: `chromium-desktop` (1280x800) and
 * `chromium-mobile` (Pixel 7). Each test asserts the project-appropriate
 * surface and skips the one it does not belong to.
 */

test.describe("Loading screen — desktop", () => {
  test("shows the branded title then transitions to the hero", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only");
    await page.context().clearCookies();
    await page.goto("/");
    const title = page.locator('h1.loading-title', { hasText: "बॉलीवुड स्पॉटल" });
    await expect(title).toBeVisible();
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator("main")).toBeVisible();
  });

  test("does NOT re-trigger on in-session navigation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only");
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 5000 });
    await page.goto("/easy");
    await expect(page.locator('h1.loading-title')).toHaveCount(0);
    await expect(page.locator('video.loading-video')).toHaveCount(0);
  });
});

test.describe("Loading screen — mobile", () => {
  test("shows the video overlay then transitions to the hero", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "mobile-only");
    await page.context().clearCookies();
    await page.goto("/");
    const video = page.locator('video.loading-video[aria-label="Loading"]');
    await expect(video).toBeVisible();
    // Either the 5s video ends naturally or the 7s hard-cap fires.
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
  });
});

/**
 * Regression guard: the LoadingGate must not break the existing game.
 * Runs on both desktop and mobile viewports.
 */
test.describe("Loading gate — game regression guard", () => {
  test("game search combobox is reachable after loading", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/easy");
    // Wait out any loading overlay
    await expect(page.locator('[aria-label="Loading"]')).toHaveCount(0, { timeout: 10_000 });
    // The existing puzzle UI should expose a combobox (used by GuessAutocomplete)
    await expect(page.getByRole("combobox")).toBeVisible({ timeout: 15_000 });
  });
});
