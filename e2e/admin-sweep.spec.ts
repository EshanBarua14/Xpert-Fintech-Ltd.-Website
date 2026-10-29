import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hasAdmin, signIn, testAddress } from "./helpers/admin";

/**
 * Every admin screen, as an admin and as an editor:
 *  - opens without a server error, an error page or a script error (hard failure);
 *  - an edit screen's Save, pressed with nothing changed, never crashes (hard failure);
 *  - accessibility (WCAG 2.2 AA, serious/critical) and phone-width overflow are
 *    reported as FINDING lines (soft: listed in CI, not failing the run).
 * Editors must be turned away (to /admin?denied=1) from admins-only screens.
 */
const LISTS = [
  "/admin", "/admin/pages", "/admin/products", "/admin/people", "/admin/people/contacts", "/admin/organizations",
  "/admin/deployments", "/admin/case-studies", "/admin/testimonials", "/admin/news", "/admin/news/categories", "/admin/news/tags",
  "/admin/events", "/admin/albums", "/admin/videos", "/admin/resources", "/admin/careers", "/admin/applications", "/admin/leads",
  "/admin/messages", "/admin/media", "/admin/ecosystem", "/admin/navigation", "/admin/redirects", "/admin/site-text", "/admin/design",
  "/admin/highlights", "/admin/figures", "/admin/credentials", "/admin/market", "/admin/notifications", "/admin/settings",
  "/admin/history", "/admin/audit", "/admin/backups", "/admin/users",
];
const CREATE = ["/admin/pages/new", "/admin/people/new", "/admin/products/new", "/admin/leads/new"];
const ADMINS_ONLY = new Set(["/admin/backups", ...CREATE]);
const ERROR_TEXT = /Application error|Internal Server Error|Something went wrong|Unhandled Runtime Error|This page could not be found/i;
// Console noise that is not a fault of the page (browser extensions, aborted fetches when navigating on).
const NOISE = /favicon|net::ERR_ABORTED|Download the React DevTools|\[Fast Refresh\]/i;

type Problem = string;

async function visit(page: Page, url: string, who: string, hard: Problem[], soft: Problem[], opts: { axe: boolean; save: boolean }) {
  const errors: string[] = [];
  const onError = (e: Error) => errors.push(`script error: ${e.message.split("\n")[0]}`);
  const onConsole = (m: { type(): string; text(): string }) => {
    if (m.type() === "error" && !NOISE.test(m.text())) errors.push(`console: ${m.text().slice(0, 160)}`);
  };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  const t0 = Date.now();
  const res = await page.goto(url, { waitUntil: "domcontentloaded" }).catch((e: Error) => {
    hard.push(`${who} ${url}: did not open (${e.message.split("\n")[0]})`);
    return null;
  });
  // Time to a usable page (the dashboard keeps polling, so "network idle" is not a measure of speed).
  const ms = Date.now() - t0;
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  if (res && res.status() >= 400) hard.push(`${who} ${url}: HTTP ${res.status()}`);
  const text = await page.locator("body").innerText().catch(() => "");
  if (ERROR_TEXT.test(text)) hard.push(`${who} ${url}: error page shown ("${text.match(ERROR_TEXT)![0]}")`);
  if (ms > 8000) soft.push(`${who} ${url}: slow to open (${(ms / 1000).toFixed(1)} s)`);

  if (opts.axe && !/\/admin\/login/.test(page.url())) {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze().catch(() => null);
    for (const v of r?.violations ?? [])
      if (v.impact === "serious" || v.impact === "critical") soft.push(`${who} ${url}: a11y ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`);
    // Phone width: nothing wider than the screen.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 2) soft.push(`${who} ${url}: ${over}px wider than a phone screen (390px)`);
    await page.setViewportSize({ width: 1280, height: 800 });
  }

  if (opts.save) {
    const save = page.getByRole("button", { name: /^Save( changes)?$/ }).first();
    if (await save.isVisible().catch(() => false)) {
      page.once("dialog", (d) => d.dismiss());
      await save.click().catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(800);
      const after = await page.locator("body").innerText().catch(() => "");
      if (ERROR_TEXT.test(after)) hard.push(`${who} ${url}: Save with no changes broke the page`);
    }
  }

  page.off("pageerror", onError);
  page.off("console", onConsole);
  for (const e of new Set(errors)) (e.startsWith("script") ? hard : soft).push(`${who} ${url}: ${e}`);
}

/** The first few records' edit screens linked from a list. */
async function detailLinks(page: Page, list: string) {
  await page.goto(list, { waitUntil: "domcontentloaded" });
  const base = list.replace(/\/$/, "");
  const hrefs = await page.locator(`main a[href^='${base}/']`).evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
  return [...new Set(hrefs.map((h) => h.split(/[?#]/)[0]!).filter((h) => !/\/(new|export)$/.test(h) && h.split("/").length === base.split("/").length + 1))].slice(0, 2);
}

function report(name: string, hard: Problem[], soft: Problem[]) {
  for (const s of soft) console.log(`FINDING ${s}`);
  for (const h of hard) console.log(`BROKEN ${h}`);
  // One line per kind of finding (CI shows only the first few FINDING lines).
  const kinds = new Map<string, number>();
  for (const f of soft) {
    const k = f.replace(/^\S+ \S+: /, "").replace(/×\d+.*$/, "").replace(/\d+px wider/, "N px wider").replace(/\([\d.]+ s\)/, "").trim();
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  }
  for (const [k, n] of kinds) console.log(`SWEEP ${name} finding on ${n} screen(s): ${k}`);
  console.log(`SWEEP ${name}: ${hard.length} broken, ${soft.length} findings`);
  expect(hard, hard.join("\n")).toEqual([]);
}

test.describe("Admin sweep", () => {
  test.skip(!hasAdmin, "needs an admin account");
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });

  const STAMP = Date.now().toString(36);
  const EDITOR = { email: `e2e-sweep-${STAMP}@example.com`, password: "e2e-sweep-pass-42" };

  test("every admin screen opens, saves and passes checks (admin)", async ({ page }) => {
    test.setTimeout(30 * 60_000);
    await signIn(page);
    const hard: Problem[] = [];
    const soft: Problem[] = [];
    const details: string[] = [];
    for (const url of [...LISTS, ...CREATE]) {
      await visit(page, url, "admin", hard, soft, { axe: true, save: false });
      if (!CREATE.includes(url) && url !== "/admin") details.push(...(await detailLinks(page, url).catch(() => [])));
    }
    for (const url of [...new Set(details)]) await visit(page, url, "admin", hard, soft, { axe: true, save: true });
    console.log(`SWEEP admin visited ${LISTS.length + CREATE.length + new Set(details).size} screens`);
    report("admin", hard, soft);
  });

  test("an editor sees every screen but is turned away from admins-only ones", async ({ page, browser }) => {
    test.setTimeout(20 * 60_000);
    await signIn(page);
    await page.goto("/admin/users");
    await page.locator("#name").fill(`E2E Sweep ${STAMP}`);
    await page.locator("#email").fill(EDITOR.email);
    await page.locator("#password").fill(EDITOR.password);
    await page.locator("#role").selectOption("EDITOR");
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`Editor ${EDITOR.email} created`)).toBeVisible({ timeout: 15_000 });

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-for": testAddress() } });
    const ed = await ctx.newPage();
    const hard: Problem[] = [];
    const soft: Problem[] = [];
    try {
      await ed.goto("/admin/login");
      await ed.getByLabel("Email").fill(EDITOR.email);
      await ed.getByLabel("Password").fill(EDITOR.password);
      await ed.getByRole("button", { name: "Sign in" }).click();
      await expect(ed.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 15_000 });
      for (const url of [...LISTS, ...CREATE]) {
        await visit(ed, url, "editor", hard, soft, { axe: false, save: false });
        const denied = /\/admin\?denied=1/.test(ed.url());
        if (ADMINS_ONLY.has(url) && !denied) hard.push(`editor ${url}: should be admins-only but opened`);
        if (!ADMINS_ONLY.has(url) && url !== "/admin" && denied) soft.push(`editor ${url}: turned away (expected to open)`);
      }
      // Editing one record of each kind works for editors too.
      for (const list of ["/admin/pages", "/admin/products", "/admin/people", "/admin/organizations", "/admin/testimonials", "/admin/news"]) {
        for (const url of await detailLinks(ed, list).catch(() => [])) await visit(ed, url, "editor", hard, soft, { axe: false, save: true });
      }
    } finally {
      await ctx.close();
      page.on("dialog", (d) => d.accept());
      await page.goto("/admin/users");
      const card = page.locator("li").filter({ hasText: EDITOR.email }).first();
      if (await card.isVisible().catch(() => false)) await card.getByRole("button", { name: "Remove" }).click().catch(() => {});
    }
    report("editor", hard, soft);
  });
});
