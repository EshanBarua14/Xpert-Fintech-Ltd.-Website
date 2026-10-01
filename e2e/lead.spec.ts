import { expect, test } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

test.describe("Demo request", () => {
  test("a visitor's request arrives in Admin → Leads", async ({ page }) => {
    test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
    const stamp = Date.now();
    const email = `e2e+${stamp}@example.com`;
    const name = `E2E Tester ${stamp}`;

    await page.goto("/en/request-demo");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel(/^Organization/).fill("E2E Securities Ltd.");
    await page.getByLabel("What do you need?").fill("Automated test — please ignore.");
    await page.getByLabel(/I agree/).check();
    // Forms sent faster than a person could type are ignored as spam.
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

    await signIn(page);
    await page.goto(`/admin/leads?q=${encodeURIComponent(email)}`);
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Clean up: move the test lead to the trash.
    await page.getByRole("link", { name }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Move to trash" }).click();
    await expect(page.getByText("Moved to trash.")).toBeVisible();
  });
});
