import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, enterPassword, hasAdmin, signIn } from "./helpers/admin";
import { currentStep, nextStep, totp } from "./helpers/totp";

test.describe("Admin two-factor sign-in", () => {
  test("turn on, sign in with a code, turn off", async ({ page }) => {
    test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
    test.setTimeout(150_000);

    // 1. Set up with the "authenticator app" (computed here from the setup key).
    await signIn(page);
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "Set up two-factor sign-in" }).click();
    const secret = (await page.locator("code.select-all").innerText()).replace(/\s/g, "");
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    const setupStep = currentStep();
    await page.getByLabel("6-digit code").fill(totp(secret, setupStep));
    await page.getByRole("button", { name: "Turn on" }).click();
    await expect(page.getByText("Two-factor sign-in is on")).toBeVisible();

    try {
      // 2. Sign out and back in: password, then a fresh code.
      await page.getByRole("button", { name: "Sign out" }).click();
      await enterPassword(page);
      await expect(page.getByLabel("6-digit code")).toBeVisible();

      await page.getByLabel("6-digit code").fill("000000");
      await page.getByRole("button", { name: "Verify" }).click();
      await expect(page.getByRole("alert")).toContainText("not correct");

      const step = await nextStep(setupStep); // the setup code cannot be reused
      await page.getByLabel("6-digit code").fill(totp(secret, step));
      await page.getByRole("button", { name: "Verify" }).click();
      await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
    } finally {
      // 3. Clean up: switch two-factor off again so the account is as it was.
      await page.goto("/admin/users");
      const off = page.getByLabel("Password (to switch off)");
      if (await off.isVisible().catch(() => false)) {
        await off.fill(ADMIN_PASSWORD);
        await page.getByRole("button", { name: "Switch off" }).click();
        await expect(page.getByText("Two-factor sign-in is off")).toBeVisible();
      }
    }
  });
});
