import { expect, test } from "@playwright/test";

test.describe("Admin gating", () => {
  test("/admin redirects anonymous users to /admin/login", async ({ page }) => {
    const res = await page.goto("/admin");
    // Could land directly on /admin/login or ...?error=backend_not_configured
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(res?.status()).toBeLessThan(500);
  });

  test("/admin/login renders the magic-link form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /Sign in to admin/i })).toBeVisible();
    await expect(page.getByPlaceholder(/curator@example.com/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send magic link/i })).toBeVisible();
  });
});
