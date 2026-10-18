import { expect, test, type Page } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";
import path from "node:path";
import os from "node:os";

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
/** One sign-in for the whole file: the login page locks an account after a few attempts (by design). */
const STATE = path.join(os.tmpdir(), `xfl-admin-e2e-${process.pid}.json`);

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
  // Download links (backups, exports): a successful response is enough.
  if (/\/download$|\/export$/.test(url)) {
    const r = await page.request.get(url);
    expect(r.status(), `${url}: HTTP ${r.status()}`).toBeLessThan(400);
    return;
  }
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
  test.use({ storageState: STATE });
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await signIn(page);
    await context.storageState({ path: STATE });
    await context.close();
  });
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
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

/** A 1×1 PNG, for the media upload. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

/** The inline form (category, tag, redirect…) that holds the field with this id. */
const formWith = (page: Page, id: string) => page.locator("form").filter({ has: page.locator(`[id="${id}"]`) }).first();

test.describe("Admin console: inline lists, admins, media, ecosystem", () => {
  test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
  test.use({ storageState: STATE });
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await signIn(page);
    await context.storageState({ path: STATE });
    await context.close();
  });
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
  });

  for (const [url, en, bn] of [
    ["/admin/news/categories", "enName-new", "bnName-new"],
    ["/admin/news/tags", "tag-en-new", "tag-bn-new"],
  ] as const) {
    test(`${url}: add, rename, delete`, async ({ page }) => {
      const name = `E2E ${url.split("/").pop()} ${STAMP}`;
      await expectHealthy(page, url);
      const add = formWith(page, en);
      await add.locator(`[id="${en}"]`).fill(name);
      await add.locator(`[id="${bn}"]`).fill(`ই২ই ${STAMP}`);
      await add.getByRole("button", { name: "Add" }).click();
      const row = page.locator(`form:has(input[value="${name}"])`).first();
      await expect(row, `added ${name} not listed: ${await formProblems(page)}`).toBeVisible({ timeout: 15_000 });
      await page.reload();
      const saved = page.locator(`form:has(input[value="${name}"])`).first();
      await saved.locator(`input[value="${name}"]`).fill(`${name} renamed`);
      await saved.getByRole("button", { name: "Save" }).click();
      await page.waitForTimeout(1500);
      await page.reload();
      const renamed = page.locator(`form:has(input[value="${name} renamed"])`).first();
      await expect(renamed, "rename not kept").toBeVisible();
      const id = await renamed.locator('input[type="hidden"][name="id"]').inputValue();
      await page.locator(`form:has(input[type="hidden"][name="id"][value="${id}"])`).getByRole("button", { name: "Delete" }).click();
      await page.waitForURL(/deleted=1/, { timeout: 15_000 }).catch(() => undefined);
      await page.reload();
      await expect(page.locator(`input[value="${name} renamed"]`)).toHaveCount(0);
    });
  }

  test("/admin/redirects: add, edit, delete", async ({ page }) => {
    const from = `/e2e-old-${STAMP}`;
    await expectHealthy(page, "/admin/redirects");
    const add = formWith(page, "from-new");
    await add.locator('[id="from-new"]').fill(from);
    await add.locator('[id="to-new"]').fill("/en");
    await add.getByRole("button", { name: "Add redirect" }).click();
    await expect(page.locator(`input[value="${from}"]`).first(), `redirect not added: ${await formProblems(page)}`).toBeVisible({ timeout: 15_000 });
    // The redirect works for visitors.
    const r = await page.request.get(from, { maxRedirects: 0 });
    expect([301, 302, 307, 308], `visiting ${from} gave HTTP ${r.status()}`).toContain(r.status());
    await page.reload();
    const row = page.locator(`form:has(input[value="${from}"])`).first();
    await row.locator('input[name="toPath"]').fill("/en/contact");
    await row.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator(`form:has(input[value="${from}"]) input[name="toPath"]`)).toHaveValue("/en/contact");
    await page.locator(`form:has(input[value="${from}"])`).getByRole("button", { name: "Delete" }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator(`input[value="${from}"]`)).toHaveCount(0);
  });

  test("/admin/users: add an admin, deactivate, reactivate, remove", async ({ page }) => {
    const email = `e2e-second-${STAMP}@example.com`;
    await expectHealthy(page, "/admin/users");
    await page.locator("#name").fill(`E2E Second ${STAMP}`);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("e2e-temporary-pass-42");
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`Admin ${email} created`), `admin not created: ${await formProblems(page)}`).toBeVisible({ timeout: 15_000 });
    await page.reload();
    const card = page.locator("form").filter({ has: page.locator(`input[value="${email}"]`) }).first().locator("xpath=ancestor::*[.//button[normalize-space()='Remove']][1]");
    await card.getByRole("button", { name: "Deactivate" }).click();
    await expect(card.getByRole("button", { name: "Reactivate" })).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: "Reactivate" }).click();
    await expect(card.getByRole("button", { name: "Deactivate" })).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: "Remove" }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator(`input[value="${email}"]`)).toHaveCount(0);
  });

  test("/admin/media: upload, edit details, trash, restore, delete", async ({ page }) => {
    await expectHealthy(page, "/admin/media");
    await page.locator("#files").setInputFiles({ name: `e2e-${STAMP}.png`, mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.locator("[role='status']").first(), "upload gave no confirmation").toBeVisible({ timeout: 30_000 });
    await page.goto(`/admin/media?q=e2e-${STAMP}`);
    const link = page.locator('main a[href^="/admin/media/"]').filter({ hasNotText: /trash/i }).first();
    const href = await link.getAttribute("href");
    expect(href, "uploaded file not in the media list").toMatch(/\/admin\/media\/[0-9a-f-]{36}/);
    await expectHealthy(page, href!);
    const alt = page.locator("main form input[type='text']:visible").first();
    if (await alt.count()) {
      await alt.fill(`E2E alt ${STAMP}`);
      await saveButton(page).click();
      await expect(page.locator("[role='status']").first(), `details not saved: ${await formProblems(page)}`).toBeVisible({ timeout: 15_000 });
    }
    await page.getByRole("button", { name: "Move to trash" }).click();
    await page.waitForURL(/trashed=1/, { timeout: 15_000 });
    await page.goto(href!);
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByRole("button", { name: "Move to trash" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Move to trash" }).click();
    await page.waitForURL(/trashed=1/, { timeout: 15_000 });
    await page.goto(href!);
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await page.waitForURL(/deleted=1/, { timeout: 15_000 });
  });

  for (const kind of ["nodes", "flows"] as const) {
    test(`/admin/ecosystem/${kind}: create, edit, delete`, async ({ page }) => {
      await expectHealthy(page, `/admin/ecosystem/${kind}/new`);
      await fillRequired(page, `eco-${kind}`);
      await saveButton(page).click();
      await page.waitForURL(new RegExp(`/admin/ecosystem/${kind}/[0-9a-f-]{36}`), { timeout: 30_000 }).catch(() => undefined);
      expect(page.url(), `create failed: ${await formProblems(page)}`).toMatch(new RegExp(`/admin/ecosystem/${kind}/[0-9a-f-]{36}`));
      const editor = page.url().split("?")[0]!;
      await saveButton(page).click();
      await page.waitForURL(/saved=1/, { timeout: 30_000 });
      await page.goto(editor);
      await page.getByRole("button", { name: /^Delete/ }).last().click();
      await page.waitForURL(/deleted=1/, { timeout: 15_000 });
    });
  }

  for (const url of ["/admin/people/contacts", "/admin/messages", "/admin/navigation"]) {
    test(`${url}: saves unchanged`, async ({ page }) => {
      await expectHealthy(page, url);
      const btn = saveButton(page);
      if (!(await btn.count())) test.skip(true, "no save button on this page");
      await btn.click();
      await page.waitForLoadState("networkidle");
      const alerts = (await page.locator("[role='alert']").allInnerTexts()).filter((t) => t.trim());
      expect(alerts, `save showed an error: ${alerts.join(" | ")}`).toEqual([]);
    });
  }
});
