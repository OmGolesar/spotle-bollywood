import { expect, test } from "@playwright/test";
import { installApiMocks } from "./mocks";

test.describe("Hints picker", () => {
  test("opens the picker, shows locked state before guess 3, dismisses with Keep guessing", async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.goto("/easy");
    // Wait for the puzzle to have hydrated
    await expect(page.getByRole("combobox")).toBeVisible();

    await page.getByRole("button", { name: /Open hints/i }).click();
    const sheet = page.getByRole("dialog", { name: /Choose a hint/i });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(/Next hint unlocks after guess 3/i)).toBeVisible();

    // Three category cards present (text is title-case in the DOM, uppercase via CSS)
    await expect(sheet.getByText(/^Tagline$/i)).toBeVisible();
    await expect(sheet.getByText(/^Filmography$/i)).toBeVisible();
    await expect(sheet.getByText(/^Cast$/i)).toBeVisible();

    await sheet.getByRole("button", { name: /Keep guessing/i }).click();
    await expect(sheet).not.toBeVisible();
  });

  test("after 3 wrong guesses, picking a category reveals its text and burns a use", async ({
    page,
  }) => {
    await installApiMocks(page, {
      catalog: [
        { id: "mock-a", title: "Lagaan", year: 2001, posterThumb: "" },
        { id: "mock-c", title: "Dangal", year: 2016, posterThumb: "" },
        { id: "mock-d", title: "Dilwale", year: 1994, posterThumb: "" },
      ],
    });
    await page.goto("/easy");
    await expect(page.getByRole("combobox")).toBeVisible();

    for (const name of ["Lagaan", "Dangal", "Dilwale"]) {
      const input = page.getByRole("combobox");
      await input.fill(name);
      const option = page.getByRole("option", { name: new RegExp(name) }).first();
      await expect(option).toBeVisible();
      await option.click();
      await expect(page.getByRole("heading", { level: 3, name: new RegExp(name) })).toBeVisible();
    }

    await page.getByRole("button", { name: /Open hints/i }).click();
    const sheet = page.getByRole("dialog", { name: /Choose a hint/i });
    await expect(sheet.getByText(/1 use remaining/i)).toBeVisible();

    // Pick Cast
    await sheet.getByRole("button", { name: /Cast/i }).click();
    await expect(sheet.getByText(/Mock reveal for cast/i)).toBeVisible();
    // Uses dropped to 0 → copy switches to the next-unlock line
    await expect(sheet.getByText(/Next hint unlocks after guess 6/i)).toBeVisible();
  });
});
