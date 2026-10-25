import { expect, test, type Page } from "@playwright/test";

/**
 * Every page in the sitemap: opens without a server error or a script error,
 * every image loads, every link on it leads somewhere, and nothing is wider
 * than a phone screen. Problems are listed together at the end.
 */
const base = () => process.env.BASE_URL ?? "http://localhost:3000";

async function sitemapPaths(page: Page) {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  return [...new Set(urls)];
}

test.describe("Site crawl", () => {
  test.setTimeout(20 * 60_000);

  test("every sitemap page opens cleanly, with working images and links", async ({ page }) => {
    const paths = await sitemapPaths(page);
    expect(paths.length).toBeGreaterThan(10);
    const problems: string[] = [];
    const links = new Map<string, string>(); // href → first page it was on
    let current = "";
    page.on("pageerror", (e) => problems.push(`${current}: script error: ${e.message.slice(0, 160)}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource|turnstile|favicon|hydrat/i.test(m.text())) problems.push(`${current}: console: ${m.text().slice(0, 160)}`);
    });

    for (const path of paths) {
      current = path;
      const res = await page.goto(path, { waitUntil: "load" });
      if (!res || res.status() >= 400) {
        problems.push(`${path}: HTTP ${res?.status()}`);
        continue;
      }
      // Scroll through so lazy images load.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      const broken = await page.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc && !i.closest("[hidden]")).map((i) => i.currentSrc.slice(0, 120)),
      );
      for (const b of broken) problems.push(`${path}: broken image ${b}`);
      const empty = await page.evaluate(() => [...document.querySelectorAll("a")].filter((a) => !a.getAttribute("href") || a.getAttribute("href") === "#").length);
      if (empty) problems.push(`${path}: ${empty} link(s) without an address`);
      const hrefs = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map((a) => a.href));
      for (const h of hrefs) {
        const u = new URL(h);
        if (u.origin !== new URL(base()).origin) continue;
        if (u.pathname.startsWith("/admin")) problems.push(`${path}: admin link on a public page (${u.pathname})`);
        const key = u.pathname + u.search;
        if (!links.has(key)) links.set(key, path);
      }
    }

    for (const [href, from] of links) {
      const res = await page.request.get(href, { maxRedirects: 5 });
      if (res.status() >= 400) problems.push(`${from}: link to ${href} gives HTTP ${res.status()}`);
    }

    console.log(`crawled ${paths.length} pages, checked ${links.size} links`);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  test("nothing is wider than a phone screen", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const paths = await sitemapPaths(page);
    const problems: string[] = [];
    for (const path of paths) {
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(300);
      const wide = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= w + 1) return null;
        const el = [...document.querySelectorAll<HTMLElement>("body *")].find((e) => {
          const r = e.getBoundingClientRect();
          return r.right > w + 1 && getComputedStyle(e).position !== "fixed" && !e.closest("[class*='overflow-x-auto'],[class*='overflow-hidden'],[class*='snap-x']");
        });
        return `${document.documentElement.scrollWidth}px${el ? ` (${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)})` : ""}`;
      });
      if (wide) problems.push(`${path}: page is ${wide} wide on a 375px phone`);
    }
    await ctx.close();
    expect(problems, problems.join("\n")).toEqual([]);
  });
});
