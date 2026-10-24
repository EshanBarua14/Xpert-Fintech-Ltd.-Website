import { expect, test, type Page } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

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
const STATE = path.join(os.tmpdir(), "xfl-admin-e2e-session.json");

/** Signs in once and keeps the session for every test (and every restarted worker). */
async function ensureSession(browser: import("@playwright/test").Browser) {
  if (fs.existsSync(STATE) && Date.now() - fs.statSync(STATE).mtimeMs < 30 * 60_000) return;
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await signIn(page);
  await context.storageState({ path: STATE });
  await context.close();
}

/** Fields a section needs beyond the generic ones (each form's own rules). */
const EXTRA: Record<string, (page: Page) => Promise<void>> = {
  pages: async (page) => page.locator('[name="enPath"]').fill(`e2e-page-${STAMP}`),
  people: async (page) => {
    const box = page.locator('main form input[type="checkbox"][name^="role."]').first();
    await box.check();
    const group = ((await box.getAttribute("name")) ?? "").replace("role.", "");
    await page.locator(`[id="role.${group}.enTitle"]`).fill("E2E Title");
  },
  resources: async (page) => page.locator("#externalUrl").fill("https://example.com/e2e.pdf"),
  // Key results are parsed from "value | English | বাংলা" lines.
  "case-studies": async (page) => page.locator("#results").fill("3× | faster order entry | দ্রুত অর্ডার\n99% | uptime"),
  // Who owns the house (Who owns Xpert on the home page).
  organizations: async (page) => {
    await page.locator("#parentType").selectOption("BANK");
    await page.locator("#parentName").fill("E2E Bank PLC");
  },
  testimonials: async (page) => {
    for (const t of await page.locator("main form textarea:visible").all()) if (!(await t.inputValue())) await t.fill("E2E test quote, written for the end-to-end check.");
  },
  videos: async (page) => page.locator('main form input[type="url"]:visible').first().fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  "eco-nodes": async (page) => page.locator("#key").fill(`e2e-node-${STAMP}`),
  "eco-flows": async (page) => {
    await page.locator("#key").fill(`e2e-flow-${STAMP}`);
    await page.getByLabel("Node").first().selectOption({ index: 1 });
    await page.getByLabel("Title (English)", { exact: true }).first().fill("E2E step");
  },
};

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
  "/admin/highlights",
  "/admin/history",
  "/admin/leads",
  "/admin/leads/new",
  "/admin/market",
  "/admin/media",
  "/admin/messages",
  "/admin/navigation",
  "/admin/news",
  "/admin/notifications",
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
const SETTINGS = ["/admin/settings", "/admin/design", "/admin/figures", "/admin/credentials", "/admin/market", "/admin/site-text", "/admin/highlights"];

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
    await ensureSession(browser);
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
      await EXTRA[section]?.(page);
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
        await Promise.race([
          page.waitForURL(/saved=1/, { timeout: 30_000 }),
          page.locator("[role='status']").filter({ hasText: /saved/i }).first().waitFor({ timeout: 30_000 }),
        ]).catch(() => undefined);
        const ok = page.url().includes("saved=1") || (await page.locator("[role='status']").filter({ hasText: /saved/i }).count()) > 0;
        expect(ok, `edit failed: ${await formProblems(page)}`).toBe(true);
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
    test(`${url}: saves`, async ({ page }) => {
      await expectHealthy(page, url);
      if (url === "/admin/site-text") {
        // Saving is only possible after a change: type a text, save, then put it back to the default and save.
        const box = page.locator("main textarea").first();
        await box.fill(`E2E text ${STAMP}`);
        await page.getByRole("button", { name: "Save changes" }).click();
        await expect(page.getByText(/Saved 1 change/)).toBeVisible({ timeout: 15_000 });
        await page.reload();
        await expect(page.locator("main textarea").first(), "site text not kept").toHaveValue(`E2E text ${STAMP}`);
        await page.getByRole("button", { name: "Back to default" }).first().click();
        await page.getByRole("button", { name: "Save changes" }).click();
        await expect(page.getByText(/Saved 1 change/)).toBeVisible({ timeout: 15_000 });
        return;
      }
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
    await ensureSession(browser);
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
    await page.locator("div").filter({ has: page.locator(`input[value="${from}"]`) }).filter({ has: page.getByRole("button", { name: "Delete" }) }).last().getByRole("button", { name: "Delete" }).click();
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
    const card = page.locator("li, div").filter({ hasText: email }).filter({ has: page.getByRole("button", { name: "Remove" }) }).last();
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
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await expect(page.getByText("1 file uploaded."), `upload failed: ${await formProblems(page)} ${await page.locator("main").innerText().then((t) => t.slice(0, 400))}`).toBeVisible({ timeout: 30_000 });
    await page.goto("/admin/media");
    const link = page.locator('main a[href^="/admin/media/"]').first();
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
      await EXTRA[`eco-${kind}`]?.(page);
      await saveButton(page).click();
      await page.waitForURL(new RegExp(`/admin/ecosystem/${kind}/[0-9a-z-]{20,}`), { timeout: 30_000 }).catch(() => undefined);
      expect(page.url(), `create failed: ${await formProblems(page)}`).toMatch(new RegExp(`/admin/ecosystem/${kind}/[0-9a-z-]{20,}`));
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

  test("/admin/notifications: recipients saved; test email explains a missing server", async ({ page }) => {
    await expectHealthy(page, "/admin/notifications");
    await page.locator("#leadEmails").fill(`sales-${STAMP}@example.com, ops-${STAMP}@example.com`);
    await page.locator("#careerEmails").fill(`hr-${STAMP}@example.com`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/^Saved\./), `not saved: ${await formProblems(page)}`).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.locator("#leadEmails")).toHaveValue(new RegExp(`sales-${STAMP}@example.com\\nops-${STAMP}@example.com`));
    await expect(page.locator("#careerEmails")).toHaveValue(`hr-${STAMP}@example.com`);
    // A bad address is refused with a message.
    await page.locator("#careerEmails").fill("not-an-email");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator("[role='alert']").first()).toBeVisible({ timeout: 15_000 });
    // No mail server on the test machine: the test email says so instead of failing silently.
    await page.goto("/admin/notifications");
    await page.getByRole("button", { name: "Send test email" }).click();
    await expect(page.locator("[role='alert']").filter({ hasText: /mail server|Could not send/i }).first()).toBeVisible({ timeout: 30_000 });
    // The live counts behind the menu badges.
    const r = await page.request.get("/api/admin/inbox");
    expect(r.status()).toBe(200);
    const inbox = (await r.json()) as { leads: number; applications: number };
    expect(typeof inbox.leads).toBe("number");
  });
});


/** The newer admin features: values typed in the admin come back after a reload and show on the site. */
test.describe("Admin console: home highlights, order, journey", () => {
  test.skip(!hasAdmin, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (see docs/TESTING.md)");
  test.use({ storageState: STATE });
  test.beforeAll(async ({ browser }) => {
    await ensureSession(browser);
  });

  test("/admin/highlights: paid-up capital is kept and shown on the home page", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/highlights");
    const cap = page.locator("#oCapital");
    const before = await cap.inputValue();
    const published = page.locator('input[name="oPublished"]');
    const wasPublished = await published.isChecked();
    await cap.fill("41");
    await page.locator("#oCapitalSource").fill("E2E source");
    await published.check();
    await page.getByRole("button", { name: "Save home highlights" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expect(page.locator("#oCapital")).toHaveValue("41");
    await page.goto("/en");
    await expect(page.locator("#ownership")).toContainText("41");
    // Put it back.
    await page.goto("/admin/highlights");
    await page.locator("#oCapital").fill(before);
    if (!wasPublished) await page.locator('input[name="oPublished"]').uncheck();
    await page.getByRole("button", { name: "Save home highlights" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/design: home section order is kept", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/design");
    const pos = page.locator('input[name="order.events"]');
    const before = await pos.inputValue();
    await pos.fill("1");
    await page.getByRole("button", { name: "Save design" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
    await page.reload();
    // Events moved to the top of the list.
    await expect(page.locator('main ol input[name^="order."]').first()).toHaveAttribute("name", "order.events");
    await page.locator('input[name="order.events"]').fill(before === "1" ? "99" : String(Number(before) + 1));
    await page.getByRole("button", { name: "Save design" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/case-studies: growth journey saves and shows on Success stories", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/case-studies");
    const title = page.locator("#jTitle");
    const before = await title.inputValue();
    const t = `E2E journey ${STAMP}`;
    await title.fill(t);
    // A milestone needs a date, title and source; fill the first empty row if there is no milestone yet.
    const date = page.locator("#jDate_0");
    if (!(await date.inputValue())) {
      await date.fill("2024");
      await page.locator("#jTitleEn_0").fill("E2E milestone");
      await page.locator("#jSource_0").fill("E2E source");
      await page.locator("#jValue_0").fill("5");
    }
    await page.getByRole("button", { name: "Save journey" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
    await page.goto("/en/success-stories");
    await expect(page.getByRole("heading", { name: t })).toBeVisible();
    await page.goto("/admin/case-studies");
    await page.locator("#jTitle").fill(before || "How Xpert grew, milestone by milestone");
    await page.getByRole("button", { name: "Save journey" }).click();
    await expect(page.locator("[role='status']").filter({ hasText: /Saved/ })).toBeVisible({ timeout: 20_000 });
  });

  test("bad input is refused with a message, not saved", async ({ page }) => {
    await page.goto("/admin/highlights");
    await page.locator("#oCapital").fill("-5");
    await page.getByRole("button", { name: "Save home highlights" }).click();
    await expect(page.locator("[role='alert']").first()).toBeVisible({ timeout: 20_000 });
    await page.goto("/admin/case-studies");
    await page.locator("#jDate_7").fill("not-a-date");
    await page.locator("#jTitleEn_7").fill("x");
    await page.getByRole("button", { name: "Save journey" }).click();
    await expect(page.getByText("Use YYYY, YYYY-MM or YYYY-MM-DD.")).toBeVisible({ timeout: 20_000 });
  });
});
