import { expect, test, type Page } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

/**
 * The admin's content editing end to end, each change checked on the live site:
 * page builder (page → section → text block → cards, hide/show, delete),
 * product key features, and backups.
 */
const STAMP = Date.now().toString(36);

test.describe("Admin content editing", () => {
  test.skip(!hasAdmin, "needs an admin account");
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await signIn(page);
  });

  const publicHas = async (page: Page, path: string, text: string | RegExp, present = true) => {
    // Pages are cached for a few minutes; saving refreshes them, so retry briefly.
    await expect(async () => {
      await page.goto(path);
      if (present) await expect(page.locator("main")).toContainText(text, { timeout: 2000 });
      else await expect(page.locator("main")).not.toContainText(text, { timeout: 2000 });
    }).toPass({ timeout: 30_000 });
  };

  test("page builder: page, section, text block, cards, hide, delete", async ({ page }) => {
    test.setTimeout(240_000);
    const slug = `e2e-builder-${STAMP}`;
    const heading = `E2E heading ${STAMP}`;
    const edited = `E2E heading edited ${STAMP}`;
    const card = `E2E card ${STAMP}`;

    // Create a published page.
    await page.goto("/admin/pages/new");
    await page.locator("#enTitle").fill(`E2E builder ${STAMP}`);
    await page.locator("#enPath").fill(slug);
    await page.locator('input[name="status"][value="PUBLISHED"]').check();
    await page.getByRole("button", { name: "Create page" }).click();
    await page.waitForURL(/\/admin\/pages\/[0-9a-f-]{36}/, { timeout: 20_000 });
    const editor = page.url().split("?")[0]!;

    // A section with a text block.
    await page.getByRole("button", { name: "+ Add section" }).click();
    await expect(page.getByRole("button", { name: "Add block" }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Add block" }).first().click();
    await expect(page.getByText("Edit text and settings").first()).toBeVisible({ timeout: 15_000 });
    await page.getByText("Edit text and settings").first().click();
    await page.locator('input[name="en.title"]').first().fill(heading);
    await page.locator('textarea[name="en.body"]').first().fill("E2E paragraph, written by the automated test.");
    await page.getByRole("button", { name: "Save block" }).first().click();
    await expect(page.getByText("Block saved.").first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, heading);

    // Edit it.
    await page.goto(editor);
    await page.getByText("Edit text and settings").first().click();
    await page.locator('input[name="en.title"]').first().fill(edited);
    await page.getByRole("button", { name: "Save block" }).first().click();
    await expect(page.getByText("Block saved.").first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, edited);

    // Hide the section, then show it again.
    await page.goto(editor);
    await page.getByRole("button", { name: "Hide", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Show", exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, edited, false);
    await page.goto(editor);
    await page.getByRole("button", { name: "Show", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Hide", exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, edited);

    // A cards block (feature grid) with one card.
    await page.goto(editor);
    await page.locator('select[name="type"]').first().selectOption("FEATURE_GRID");
    await page.getByRole("button", { name: "Add block" }).first().click();
    await expect(page.getByText("+ Add card").first()).toBeVisible({ timeout: 15_000 });
    await page.getByText("+ Add card").first().click();
    const cardForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Add card" }) }).first();
    await cardForm.locator('[name="en.title"]').fill(card);
    await cardForm.locator('[name="en.body"]').fill("E2E card text.");
    await cardForm.getByRole("button", { name: "Add card" }).click();
    await expect(page.getByText(card).first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, card);

    // Delete the card, then the blocks and the section.
    await page.goto(editor);
    await page.locator("ol > li").filter({ hasText: card }).getByRole("button", { name: "Delete" }).first().click();
    await publicHas(page, `/en/${slug}`, card, false);
    await page.goto(editor);
    while ((await page.getByRole("button", { name: /^Delete$/ }).count()) > 0) {
      const before = await page.getByRole("button", { name: /^Delete$/ }).count();
      await page.getByRole("button", { name: /^Delete$/ }).first().click();
      await expect(page.getByRole("button", { name: /^Delete$/ })).toHaveCount(before - 1, { timeout: 15_000 });
    }
    await publicHas(page, `/en/${slug}`, edited, false);

    // Trash and delete the page.
    await page.goto(editor);
    await page.getByRole("button", { name: "Move to trash" }).click();
    await page.waitForURL(/trashed=1/, { timeout: 15_000 });
    const res = await page.request.get(`/en/${slug}`);
    expect(res.status(), "a trashed page is gone from the site").toBe(404);
  });

  test("products: a key feature is added, shown on the product page and deleted", async ({ page }) => {
    test.setTimeout(150_000);
    const feature = `E2E feature ${STAMP}`;
    await page.goto("/admin/products");
    await page.locator("main a[href^='/admin/products/']").filter({ hasNotText: /new/i }).first().click();
    await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}/);
    const editor = page.url().split("?")[0]!.split("#")[0]!;
    // The product's public address, from its slug field.
    const slug = await page.locator("#enSlug").inputValue().catch(() => "");
    await page.locator("summary").filter({ hasText: /Add to key features/i }).first().click();
    await page.locator("#new-CAPABILITY-enTitle").fill(feature);
    await page.locator("#new-CAPABILITY-enTitle").locator("xpath=ancestor::form").getByRole("button", { name: "Add" }).click();
    await expect(page.locator(`input[value="${feature}"]`).first()).toBeVisible({ timeout: 15_000 });
    if (slug) await publicHas(page, `/en/products/${slug}`, feature);

    await page.goto(editor);
    const row = page.locator("div").filter({ has: page.locator(`input[value="${feature}"]`) }).filter({ has: page.getByRole("button", { name: "Delete" }) }).last();
    await row.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.locator(`input[value="${feature}"]`)).toHaveCount(0, { timeout: 15_000 });
    if (slug) await publicHas(page, `/en/products/${slug}`, feature, false);
  });

  test("backups: back up now, download, delete", async ({ page }) => {
    test.setTimeout(150_000);
    const note = `E2E backup ${STAMP}`;
    await page.goto("/admin/backups");
    await page.locator('input[name="note"]').fill(note);
    await page.getByRole("button", { name: "Back up now" }).click();
    const row = page.locator("li, tr").filter({ hasText: note }).first();
    await expect(row).toBeVisible({ timeout: 60_000 });
    const href = await row.getByRole("link", { name: "Download" }).getAttribute("href");
    expect(href).toBeTruthy();
    const res = await page.request.get(href!);
    expect(res.status(), "backup file downloads").toBe(200);
    expect((await res.body()).length).toBeGreaterThan(100);
    await row.getByRole("button", { name: /Delete/ }).click();
    await expect(page.locator("li, tr").filter({ hasText: note })).toHaveCount(0, { timeout: 30_000 });
  });
});
