import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automated accessibility scan (WCAG 2.2 A/AA) of the main pages in both themes. */
const PAGES = ["/en", "/bn", "/en/platform", "/en/products", "/en/consortium", "/en/events", "/en/request-demo", "/en/contact", "/en/this-page-does-not-exist", "/admin/login"];

for (const theme of ["dark", "light"] as const) {
  test.describe(`Accessibility (${theme})`, () => {
    test.use({ colorScheme: theme });
    for (const path of PAGES) {
      test(`${path} has no serious or critical issues`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        const summary = serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}×) e.g. ${v.nodes[0]?.target.join(" ")}`).join("\n");
        expect(serious, summary).toEqual([]);
      });
    }
  });
}
