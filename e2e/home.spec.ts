import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("loads with headline, menu and demo call to action, without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    const res = await page.goto("/en");
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Brokerage technology");
    await expect(page.getByRole("link", { name: "Request a demo" }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /capital market/i })).toBeVisible();

    // The skip link is the first thing a keyboard user reaches.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("the root address sends visitors to a language", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(en|bn)$/);
  });

  test("unknown pages show the 404 screen", async ({ page }) => {
    const res = await page.goto("/en/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("health check reports the database", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", database: "ok" });
  });
});
