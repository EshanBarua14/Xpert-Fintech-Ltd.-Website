import { test } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

/** Not a check: pictures of the admin for a person to look at (CI saves them). */
for (const theme of ["dark", "light"] as const) {
  test(`admin pictures ${theme}`, async ({ page }) => {
    test.skip(!hasAdmin);
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/admin/login");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `map-shots/admin-login-${theme}.png` });
    await signIn(page);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `map-shots/admin-dashboard-${theme}.png`, fullPage: true });
  });
}
