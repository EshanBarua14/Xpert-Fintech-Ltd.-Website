import { expect, test } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

test.describe("Demo request", () => {
  test("a visitor's request arrives in Admin → Leads", async ({ page }) => {
    test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
    const stamp = Date.now();
    const email = `e2e+${stamp}@example.com`;
    const name = `E2E Tester ${stamp}`;

    await page.goto("/en/request-demo");
    // The demo form has three steps: organisation, interest, contact.
    await page.getByLabel(/^Organization/).fill("E2E Securities Ltd.");
    await page.locator("#designation").fill("E2E Head of IT");
    await page.getByRole("button", { name: "Continue" }).click();
    const product = page.locator("#interestedOfferingId");
    let productName = "";
    if (await product.count()) {
      const opt = product.locator("option:not([value=''])").first();
      productName = ((await opt.textContent()) ?? "").trim();
      await product.selectOption((await opt.getAttribute("value"))!);
    }
    await page.getByLabel("What do you need?").fill("Automated test — please ignore.");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Work email").fill(email);
    await page.locator("#phone").fill("+880 1711 000000");
    await page.locator("#message").fill("E2E message text.");
    await page.getByLabel(/I agree/).check();
    // Forms sent faster than a person could type are ignored as spam.
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

    await signIn(page);
    await page.goto(`/admin/leads?q=${encodeURIComponent(email)}`);
    await expect(page.getByRole("link", { name })).toBeVisible();

    // Every detail the visitor gave is on the lead's page.
    await page.getByRole("link", { name }).click();
    const enquiry = page.locator("section").filter({ has: page.getByRole("heading", { name: "Enquiry" }) });
    for (const text of [email, "+880 1711 000000", "E2E Securities Ltd.", "E2E Head of IT", "Automated test — please ignore.", "E2E message text.", ...(productName ? [productName] : [])]) {
      await expect(enquiry, `"${text}" missing on the lead page`).toContainText(text);
    }

    // Clean up: move the test lead to the trash.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Move to trash" }).click();
    await expect(page.getByText("Moved to trash.")).toBeVisible();
  });
});
