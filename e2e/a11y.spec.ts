import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automated accessibility scan (WCAG 2.2 A/AA) of the main pages in both themes. */
const PAGES = [
  "/en", "/bn", "/en/platform", "/en/products", "/en/products/trading-platform", "/bn/products/rms", "/en/consortium",
  "/en/company/about", "/en/company/board", "/en/company/management", "/en/company/consultants", "/en/company/team",
  "/en/success-stories", "/en/markets", "/en/news", "/en/events", "/en/gallery", "/en/careers", "/en/resources",
  "/en/search?q=trading", "/en/request-demo", "/en/contact", "/bn/contact", "/en/this-page-does-not-exist", "/admin/login",
];

for (const theme of ["dark", "light"] as const) {
  test.describe(`Accessibility (${theme})`, () => {
    // Reduced motion: colours are checked as they end up, not half-way through a fade-in.
    test.use({ colorScheme: theme, reducedMotion: "reduce" });
    for (const path of PAGES) {
      test(`${path} has no serious or critical issues`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        const summary = serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}×) at ${path}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " " + n.html.slice(0, 120)).join(" ; ")}`).join("\n");
        expect(serious, summary).toEqual([]);
      });
    }
  });
}
