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

  /** The n-th block's text-and-settings form (opened), where blocks are published. */
  const blockForm = async (page: Page, n: number) => {
    await page.getByText("Edit text and settings").nth(n).click();
    return page.locator("form").filter({ has: page.getByRole("button", { name: "Save block" }) }).nth(n);
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
    let form = await blockForm(page, 0);
    await form.locator('input[name="en.title"]').fill(heading);
    await form.locator('textarea[name="en.body"]').fill("E2E paragraph, written by the automated test.");
    // Blocks start as drafts: publish it.
    await form.locator('input[name="status"][value="PUBLISHED"]').check();
    await form.getByRole("button", { name: "Save block" }).click();
    await expect(page.getByText("Block saved.").first()).toBeVisible({ timeout: 15_000 });
    await publicHas(page, `/en/${slug}`, heading);

    // Edit it.
    await page.goto(editor);
    form = await blockForm(page, 0);
    await form.locator('input[name="en.title"]').fill(edited);
    await form.getByRole("button", { name: "Save block" }).click();
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
    // The new cards block: open its own settings and publish it.
    const grid = page.locator("li").filter({ has: page.getByText("+ Add card") }).filter({ has: page.getByText("Edit text and settings") }).last();
    await grid.getByText("Edit text and settings").click();
    form = grid.locator("form").filter({ has: page.getByRole("button", { name: "Save block" }) });
    await form.locator('input[name="status"][value="PUBLISHED"]').check({ force: true });
    await form.getByRole("button", { name: "Save block" }).click();
    await expect(page.getByText("Block saved.").first()).toBeVisible({ timeout: 15_000 });
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
    // The section's Delete comes first and removes its blocks with it.
    for (let guard = 0; guard < 6 && (await page.getByRole("button", { name: /^Delete$/ }).count()) > 0; guard++) {
      const before = await page.getByRole("button", { name: /^Delete$/ }).count();
      await page.getByRole("button", { name: /^Delete$/ }).first().click();
      await expect(async () => expect(await page.getByRole("button", { name: /^Delete$/ }).count()).toBeLessThan(before)).toPass({ timeout: 15_000 });
    }
    await publicHas(page, `/en/${slug}`, edited, false);

    // Trash and delete the page.
    await page.goto(editor);
    await page.getByRole("button", { name: "Move to trash" }).click();
    await page.waitForURL(/trashed=1/, { timeout: 15_000 });
    // Gone from the site: the not-found screen (streamed pages can answer 200 with noindex).
    await page.goto(`/en/${slug}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible({ timeout: 15_000 });
  });

  test("products: a key feature is added, shown on the product page and deleted", async ({ page }) => {
    test.setTimeout(300_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
    const feature = `E2E feature ${STAMP}`;
    await page.goto("/admin/products");
    // A live product (the trading platform), not one in the trash.
    // Diagnostic: how responsive each product's editor is (logged, not asserted).
    const all = await page.locator("main a[href^='/admin/products/']").evaluateAll((as) => as.map((a) => [a.getAttribute("href")!, a.textContent ?? ""] as const).filter(([h]) => !/new|\?/.test(h)));
    const report: string[] = [];
    let href: string | null = null;
    for (const [h, name] of all.slice(0, 14)) {
      const probe = await page.context().newPage();
      const t = Date.now();
      await probe.goto(h, { waitUntil: "load", timeout: 30_000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 4000));
      const ok = await Promise.race([
        probe.evaluate(() => [...document.querySelectorAll("summary")].some((s) => /Add to key features/i.test(s.textContent ?? ""))).then((k) => (k ? "ok+kf" : "ok")),
        new Promise<string>((r) => setTimeout(() => r("NOT RESPONDING"), 15_000)),
      ]);
      report.push(`${name.trim()}=${ok}/${Date.now() - t}ms`);
      if (ok === "ok+kf" && !href) href = h;
      await Promise.race([probe.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
    }
    console.log(`TIMING editors: ${report.join(", ")}`);
    const t0 = Date.now();
    await page.goto(href!, { waitUntil: "domcontentloaded", timeout: 120_000 });
    console.log(`TIMING product editor ready in ${Date.now() - t0} ms`);
    const editor = page.url().split("?")[0]!.split("#")[0]!;
    // The product's public address, from its slug field.
    const slug = await page.locator("#enSlug").inputValue().catch(() => "");
    const adder = page.locator("summary").filter({ hasText: /Add to key features/i }).first();
    const found = await adder.waitFor({ state: "attached", timeout: 30_000 }).then(() => true).catch(() => false);
    if (!found) {
      const probe = await Promise.race([
        page.evaluate(() => `${document.title} · summaries: ${[...document.querySelectorAll("summary")].map((x) => x.textContent).join(" | ")} · h1: ${document.querySelector("h1")?.textContent}`),
        new Promise<string>((r) => setTimeout(() => r("page not responding"), 10_000)),
      ]);
      throw new Error(`no "Add to key features" on ${page.url()}: ${probe} · errors: ${errors.join(" | ")}`);
    }
    await adder.scrollIntoViewIfNeeded();
    await adder.click();
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
