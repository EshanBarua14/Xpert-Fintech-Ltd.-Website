import { expect, test } from "@playwright/test";

test.describe("Language and theme", () => {
  test("switching to বাংলা keeps the page and is remembered", async ({ page }) => {
    await page.goto("/en/platform");
    await page.getByRole("navigation", { name: "Language" }).first().getByRole("link", { name: "বাংলা" }).click();
    await expect(page).toHaveURL(/\/bn\/platform$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    // The choice is remembered: the root address now opens Bangla.
    await page.goto("/");
    await expect(page).toHaveURL(/\/bn$/);
  });

  test("the theme switch toggles light/dark and survives a reload", async ({ page }) => {
    await page.goto("/en");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark"); // follows the device (dark in this test)
    await page.getByRole("button", { name: "Switch to light mode" }).first().click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
});
