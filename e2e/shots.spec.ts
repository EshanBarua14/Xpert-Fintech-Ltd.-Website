import { test } from "@playwright/test";

/** Not a check: pictures of the maps in both themes, for a person to look at (CI saves them). */
const maps: [string, string, string][] = [
  ["/en/contact", "section:has(iframe.office-map)", "office"],
  ["/en/platform", "svg[viewBox='0 0 800 580']", "ecosystem"],
  ["/en/consortium", "main svg[role='group']", "consortium"],
  ["/en", "svg[viewBox='0 0 800 580']", "home-ecosystem"],
  ["/en", "main svg[role='group']", "home-consortium"],
];

for (const theme of ["dark", "light"] as const) {
  test.describe(`Map pictures (${theme})`, () => {
    test.use({ colorScheme: theme, viewport: { width: 1440, height: 1000 } });
    for (const [path, selector, name] of maps) {
      test(`${name} ${theme}`, async ({ page }) => {
        await page.goto(path);
        const el = page.locator(selector).first();
        if (!(await el.count())) return console.log(`SHOT none: ${name} (${selector}) on ${path}`);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(name === "office" ? 6000 : 2500);
        const target = name === "office" ? el : el.locator("xpath=ancestor::section[1]");
        await (await target.count() ? target : el).screenshot({ path: `map-shots/${name}-${theme}.png`, animations: "disabled" });
      });
    }
  });
}
