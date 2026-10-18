import { expect, test, type Page } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

/**
 * Admin console, end to end, against a throwaway database (never the live site):
 *  1. Every admin page and editor opens without an error.
 *  2. Every content type: create → edit → move to trash → restore → delete
 *     permanently, through the real forms (the same buttons an editor clicks).
 *  3. Single-page settings forms save without changes.
 * Forms are filled generically (required fields by type and name), so a new
 * required field shows up here as a failure with the form's own message.
 */

const STAMP = Date.now().toString(36);

/** Every admin page that lists or edits something. */
const PAGES = [
  "/admin",
  "/admin/albums",
  "/admin/applications",
  "/admin/audit",
  "/admin/backups",
  "/admin/careers",
  "/admin/case-studies",
  "/admin/credentials",
  "/admin/deployments",
  "/admin/design",
  "/admin/ecosystem",
  "/admin/events",
  "/admin/figures",
  "/admin/history",
  "/admin/leads",
  "/admin/leads/new",
  "/admin/market",
  "/admin/media",
  "/admin/messages",
  "/admin/navigation",
  "/admin/news",
  "/admin/news/categories",
  "/admin/news/tags",
  "/admin/organizations",
  "/admin/pages",
  "/admin/people",
  "/admin/people/new",
  "/admin/people/contacts",
  "/admin/products",
  "/admin/products/new",
  "/admin/redirects",
  "/admin/resources",
  "/admin/settings",
  "/admin/site-text",
  "/admin/testimonials",
  "/admin/users",
  "/admin/videos",
];

/** Sections with a list, a "new" editor and trash: create → edit → trash → restore → delete. */
const CRUD = [
  "albums",
  "careers",
  "case-studies",
  "deployments",
  "events",
  "leads",
  "news",
  "organizations",
  "pages",
  "people",
  "products",
  "resources",
  "testimonials",
  "videos",
];

/** Single-page forms that should save as they are. */
const SETTINGS = ["/admin/settings", "/admin/design", "/admin/figures", "/admin/credentials", "/admin/market", "/admin/site-text"];

const ERROR_TEXT = /Application error|Internal Server Error|Something went wrong|This page could not be found|Unhandled Runtime Error/i;

async function expectHealthy(page: Page, url: string) {
  const res = await page.goto(url);
  expect(res, `${url}: no response`).not.toBeNull();
  expect(res!.status(), `${url}: HTTP ${res!.status()}`).toBeLessThan(400);
  await expect(page.locator("body"), `${url}: error text on the page`).not.toContainText(ERROR_TEXT);
  // Still signed in (not bounced to the login page).
  expect(page.url(), `${url}: redirected to sign-in`).not.toContain("/admin/login");
}

/** Fills every required field (and an empty first text field) with a value that fits its type and name. */
async function fillRequired(page: Page, label: string) {
  const form = page.locator("main form").filter({ has: page.locator('button[type="submit"]') }).first();
  await form.waitFor();
  const fields = form.locator("input, textarea, select");
  const n = await fields.count();
  let filledText = false;
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.isVisible().catch(() => false)) || !(await f.isEditable().catch(() => false))) continue;
    const tag = await f.evaluate((el) => el.tagName.toLowerCase());
    const type = ((await f.getAttribute("type")) ?? "text").toLowerCase();
    const name = ((await f.getAttribute("name")) ?? "").toLowerCase();
    const required = (await f.getAttribute("required")) !== null || (await f.getAttribute("aria-required")) === "true";
    if (["hidden", "checkbox", "radio", "file", "submit", "button", "search"].includes(type)) continue;
    if (tag === "select") {
      if (!required) continue;
      const current = await f.inputValue();
      if (current) continue;
      const values = await f.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      if (values[0]) await f.selectOption(values[0]);
      continue;
    }
    const current = await f.inputValue();
    const isTextLike = tag === "textarea" || ["text", "url", "email", "tel", "number", "date", "datetime-local", "time"].includes(type);
    if (!isTextLike) continue;
    if (current && !required) continue;
    if (current && required) continue;
    if (!required && filledText) continue;
    const value =
      type === "email" || name.includes("email")
        ? `e2e-${STAMP}@example.com`
        : type === "url" || /url|website|href|link/.test(name)
          ? "https://example.com/e2e"
          : type === "tel" || name.includes("phone")
            ? "+8801700000000"
            : type === "number"
              ? "1"
              : type === "date"
                ? "2026-12-01"
                : type === "datetime-local"
                  ? "2026-12-01T10:00"
                  : type === "time"
                    ? "10:00"
                    : name.includes("slug")
                      ? `e2e-${label}-${STAMP}`
                      : name.includes("package")
                        ? "com.example.e2e"
                        : tag === "textarea"
                          ? `E2E test text for ${label}.`
                          : `E2E ${label} ${STAMP}`;
    if (!required && type !== "text") continue;
    await f.fill(value);
    if (type === "text" || tag === "textarea") filledText = true;
  }
}

/** The form's main submit button (Save / Create / Add …), not the trash ones. */
function saveButton(page: Page) {
  return page
    .locator("main form button[type='submit']")
    .filter({ hasText: /^(Save|Create|Add|Publish|Send)/i })
    .first();
}

async function formProblems(page: Page) {
  const alerts = await page.locator("[role='alert']").allInnerTexts();
  const invalid = await page.locator("main form :invalid").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name || e.id).filter(Boolean));
  return `alerts: ${JSON.stringify(alerts)}; invalid fields: ${JSON.stringify(invalid)}`;
}

test.describe("Admin console", () => {
  test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await signIn(page);
  });

  test("every admin page opens", async ({ page }) => {
    test.setTimeout(300_000);
    const failures: string[] = [];
    for (const url of PAGES) {
      try {
        await expectHealthy(page, url);
      } catch (e) {
        failures.push(`${url}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("every existing item's editor opens", async ({ page }) => {
    test.setTimeout(600_000);
    const failures: string[] = [];
    const lists = PAGES.filter((u) => u !== "/admin" && !u.endsWith("/new"));
    for (const list of lists) {
      await page.goto(list);
      // The first two editor links on the page (rows of the list).
      const hrefs = await page
        .locator(`main a[href^="${list}/"]`)
        .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!).filter((h) => !/\/new$|\?/.test(h)))].slice(0, 2));
      for (const href of hrefs) {
        try {
          await expectHealthy(page, href);
        } catch (e) {
          failures.push(`${href}: ${(e as Error).message.split("\n")[0]}`);
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  for (const section of CRUD) {
    test(`${section}: create, edit, trash, restore, delete`, async ({ page }) => {
      test.setTimeout(180_000);
      const base = `/admin/${section}`;

      // Create
      await expectHealthy(page, `${base}/new`);
      await fillRequired(page, section);
      await saveButton(page).click();
      await page.waitForURL(new RegExp(`${base}/[0-9a-f-]{36}`), { timeout: 30_000 }).catch(() => undefined);
      expect(page.url(), `create failed: ${await formProblems(page)}`).toMatch(new RegExp(`${base}/[0-9a-f-]{36}`));
      const id = /([0-9a-f-]{36})/.exec(page.url())![1]!;
      const editor = `${base}/${id}`;
      await expect(page.locator("body")).not.toContainText(ERROR_TEXT);

      // Edit: change the first text field, save, and see it after a reload
      await page.goto(editor);
      const first = page.locator("main form input[type='text']:visible, main form input:not([type]):visible").first();
      const edited = `E2E ${section} edited ${STAMP}`;
      if (await first.count()) {
        await first.fill(edited);
        await saveButton(page).click();
        await page.waitForURL(/saved=1/, { timeout: 30_000 }).catch(() => undefined);
        expect(page.url(), `edit failed: ${await formProblems(page)}`).toContain("saved=1");
        await page.goto(editor);
        await expect(page.locator(`main form input[value="${edited}"]`).first(), "edit not kept after reload").toBeVisible();
      }

      // Move to trash
      await page.getByRole("button", { name: "Move to trash" }).click();
      await page.waitForURL(/trashed=1/, { timeout: 30_000 });

      // Restore
      await page.goto(editor);
      await page.getByRole("button", { name: "Restore" }).click();
      await page.waitForURL(/restored=1/, { timeout: 30_000 });

      // Trash again and delete permanently
      await page.getByRole("button", { name: "Move to trash" }).click();
      await page.waitForURL(/trashed=1/, { timeout: 30_000 });
      await page.goto(editor);
      await page.getByRole("button", { name: "Delete permanently" }).click();
      await page.waitForURL(/deleted=1/, { timeout: 30_000 });
      const gone = await page.goto(editor);
      expect(gone!.status(), "deleted item still opens").toBe(404);
    });
  }

  for (const url of SETTINGS) {
    test(`${url}: saves unchanged`, async ({ page }) => {
      await expectHealthy(page, url);
      const btn = saveButton(page);
      if (!(await btn.count())) test.skip(true, "no save button");
      await btn.click();
      await page.waitForLoadState("networkidle");
      const alerts = (await page.locator("[role='alert']").allInnerTexts()).filter((t) => t.trim());
      expect(alerts, `save showed an error: ${alerts.join(" | ")}`).toEqual([]);
      await expect(page.locator("body")).not.toContainText(ERROR_TEXT);
    });
  }
});
