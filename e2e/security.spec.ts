import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, hasAdmin, signIn } from "./helpers/admin";

/**
 * Security checks against a running site:
 *  - every admin screen and admin API needs a signed-in admin;
 *  - a server action replayed without the admin's cookie does nothing;
 *  - security headers, admin pages not indexed or cached, session cookie flags;
 *  - sign-in: one message for every failure, no open redirect, lock after repeated failures,
 *    rate limit per address;
 *  - script typed into the public form stays text in the admin (no stored XSS);
 *  - SVG / HTML disguised as images are refused by the media upload.
 * Lines starting WARN are findings to review (not failures).
 */
const ADMIN_PATHS = [
  "/admin", "/admin/pages", "/admin/pages/new", "/admin/products", "/admin/people", "/admin/leads", "/admin/leads/new", "/admin/applications",
  "/admin/media", "/admin/users", "/admin/backups", "/admin/settings", "/admin/site-text", "/admin/notifications", "/admin/audit", "/admin/history",
];
// Each test uses its own client address so the per-address limits of one test do not affect the next.
const ip = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;

async function fresh(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": ip() } });
}

/** The sign-in form's message, once it shows (not Next's route announcer, which is also role=alert). */
async function alertText(page: Page) {
  const a = page.locator("form [role='alert']");
  await expect(a).toBeVisible({ timeout: 15_000 });
  return (await a.innerText()).trim();
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("Security", () => {
  test.describe.configure({ mode: "serial" });

  test("admin screens and APIs need a signed-in admin", async ({ baseURL }) => {
    const api = await fresh(baseURL!);
    const leaks: string[] = [];
    for (const p of ADMIN_PATHS) {
      const r = await api.get(p, { maxRedirects: 0 });
      const loc = r.headers()["location"] ?? "";
      const body = r.status() === 200 ? await r.text() : "";
      const toLogin = (r.status() >= 300 && r.status() < 400 && /\/admin\/login/.test(loc)) || /\/admin\/login/.test(body.slice(0, 3000)) || /<form[^>]*>[\s\S]*Sign in/.test(body);
      // A 200 is only acceptable when it is the sign-in screen (rendered in place).
      if (!toLogin && !(r.status() === 401 || r.status() === 403 || r.status() === 404)) leaks.push(`${p}: HTTP ${r.status()} ${loc}`);
      if (r.status() === 200 && /Welcome|Move to trash|Add admin/.test(body)) leaks.push(`${p}: admin content in the reply without signing in`);
    }
    for (const p of ["/api/admin/inbox"]) {
      const r = await api.get(p, { maxRedirects: 0 });
      if (r.status() < 300 || (r.status() === 200 && (await r.text()).length > 2)) leaks.push(`${p}: HTTP ${r.status()} without signing in`);
    }
    await api.dispose();
    expect(leaks, leaks.join("\n")).toEqual([]);
  });

  test("a server action replayed without the admin's cookie does nothing", async ({ page, baseURL }) => {
    test.skip(!hasAdmin, "needs an admin account");
    await signIn(page);
    await page.goto("/admin/settings");
    // Capture the next server action request the page sends (Save on the settings form).
    const captured = page.waitForRequest((r) => r.method() === "POST" && !!r.headers()["next-action"], { timeout: 20_000 });
    await page.getByRole("button", { name: /^Save/ }).first().click();
    const req = await captured;
    const headers = { ...req.headers() };
    delete headers["cookie"];
    const api = await fresh(baseURL!);
    const r = await api.post(req.url(), { headers: { ...headers, "x-forwarded-for": ip() }, data: req.postDataBuffer() ?? "", maxRedirects: 0 });
    const redirect = r.headers()["x-action-redirect"] ?? r.headers()["location"] ?? "";
    const text = await r.text();
    await api.dispose();
    const refused = /\/admin\/login/.test(redirect) || r.status() >= 400 || /admin\/login|NEXT_REDIRECT/.test(text);
    expect(refused, `replayed action answered ${r.status()} ${redirect} ${text.slice(0, 200)}`).toBe(true);
  });

  test("security headers, no indexing or caching of admin, session cookie flags", async ({ page, baseURL }) => {
    const api = await fresh(baseURL!);
    const problems: string[] = [];
    for (const p of ["/en", "/bn", "/admin/login"]) {
      const h = (await api.get(p)).headers();
      for (const k of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) if (!h[k]) problems.push(`${p}: no ${k}`);
      if (h["x-powered-by"]) problems.push(`${p}: x-powered-by reveals ${h["x-powered-by"]}`);
      if (/unsafe-eval/.test(h["content-security-policy"] ?? "")) console.log(`WARN ${p}: CSP allows unsafe-eval`);
      if (!/frame-ancestors 'none'|frame-ancestors 'self'/.test(h["content-security-policy"] ?? "") && h["x-frame-options"] !== "DENY") problems.push(`${p}: can be framed (clickjacking)`);
    }
    const adm = (await api.get("/admin/login")).headers();
    if (!/noindex/.test(adm["x-robots-tag"] ?? "")) problems.push("/admin/login: no X-Robots-Tag noindex");
    if (!/no-store/.test(adm["cache-control"] ?? "")) problems.push("/admin/login: may be cached (no Cache-Control: no-store)");
    const robots = await (await api.get("/robots.txt")).text();
    if (!/Disallow:\s*\/admin/i.test(robots)) console.log("WARN robots.txt does not disallow /admin");
    await api.dispose();

    if (hasAdmin) {
      await signIn(page);
      const cookies = await page.context().cookies();
      const session = cookies.filter((c) => c.httpOnly);
      if (!session.length) problems.push("session cookie is readable by scripts (not httpOnly)");
      for (const c of session) {
        if (c.sameSite === "None") problems.push(`cookie ${c.name}: SameSite=None`);
        if (!c.secure) console.log(`WARN cookie ${c.name}: not marked Secure here (expected only on http://localhost)`);
      }
      const leaked = await page.evaluate(() => document.cookie);
      if (session.some((c) => leaked.includes(c.name))) problems.push("session cookie visible to page scripts");
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  test("sign-in: same message for unknown email and wrong password; no open redirect", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip() } });
    const page = await ctx.newPage();
    await login(page, `nobody-${Date.now()}@example.com`, "wrong-password-1");
    const unknown = await alertText(page);
    await login(page, `also-nobody-${Date.now()}@example.com`, "x");
    const again = await alertText(page);
    expect(again).toBe(unknown);
    // (A wrong password for a real account is compared with this in the lock test, on a throwaway editor.)
    // next= pointing elsewhere never leaves the site.
    if (hasAdmin) {
      await page.goto(`/admin/login?next=${encodeURIComponent("https://evil.example.com/x")}`);
      await page.getByLabel("Email").fill(ADMIN_EMAIL);
      await page.getByLabel("Password").fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForLoadState("networkidle");
      expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
      await page.goto(`/admin/login?next=${encodeURIComponent("//evil.example.com")}`);
      expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
    }
    await ctx.close();
  });

  test("an account locks after 5 wrong passwords, and the address is rate limited", async ({ page, browser }) => {
    test.skip(!hasAdmin, "needs an admin account");
    test.setTimeout(180_000);
    const email = `e2e-lock-${Date.now().toString(36)}@example.com`;
    const password = "e2e-lock-pass-42";
    await signIn(page);
    await page.goto("/admin/users");
    await page.locator("#name").fill("E2E Lock Test");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#role").selectOption("EDITOR");
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`Editor ${email} created`)).toBeVisible({ timeout: 15_000 });
    try {
      const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip() } });
      const p = await ctx.newPage();
      await login(p, `nobody-${Date.now()}@example.com`, "nope");
      const generic = await alertText(p);
      await login(p, email, "wrong-1");
      expect(await alertText(p), "wrong password must say the same as unknown email").toBe(generic);
      for (let i = 2; i <= 5; i++) await login(p, email, `wrong-${i}`);
      await login(p, email, password);
      await expect(p.locator("form [role='alert']")).toContainText(/locked/i);
      // Same address: the 11th try within 15 minutes is refused before the password is checked.
      for (let i = 0; i < 6; i++) await login(p, `nobody-${i}@example.com`, "nope");
      await expect(p.locator("form [role='alert']")).toContainText(/Too many attempts/i);
      await ctx.close();

      // The limit counts the first address in X-Forwarded-For: a client that sends its own header gets a fresh allowance.
      const ctx2 = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip() } });
      const p2 = await ctx2.newPage();
      await login(p2, "nobody@example.com", "nope");
      if (!/Too many/i.test(await alertText(p2)))
        console.log("WARN sign-in rate limit trusts the client's X-Forwarded-For: safe on Vercel (it sets the header), check the proxy on the Namecheap server");
      await ctx2.close();
    } finally {
      page.on("dialog", (d) => d.accept());
      await page.goto("/admin/users");
      const card = page.locator("li").filter({ hasText: email }).first();
      if (await card.isVisible().catch(() => false)) await card.getByRole("button", { name: "Remove" }).click().catch(() => {});
    }
  });

  test("script typed into the demo form stays plain text in the admin", async ({ browser }) => {
    test.skip(!hasAdmin, "needs an admin account");
    test.setTimeout(120_000);
    const stamp = Date.now();
    const payload = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    const email = `e2e+xss${stamp}@example.com`;
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip() } });
    const page = await ctx.newPage();
    let dialog = false;
    let cleaningUp = false;
    // Any dialog before clean-up would be the script running; the trash button's confirm is expected.
    page.on("dialog", (d) => {
      if (cleaningUp) return void d.accept();
      dialog = true;
      void d.dismiss();
    });
    await page.goto("/en/request-demo");
    await page.getByLabel(/^Organization/).fill(`XSS ${payload}`);
    await page.locator("#designation").fill(payload);
    await page.getByRole("button", { name: "Continue" }).click();
    const product = page.locator("#interestedOfferingId");
    if (await product.count()) await product.selectOption((await product.locator("option:not([value=''])").first().getAttribute("value"))!);
    await page.getByLabel("What do you need?").fill(payload);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Full name").fill(`XSS Tester ${stamp}`);
    await page.getByLabel("Work email").fill(email);
    await page.locator("#phone").fill("+880 1711 000000");
    await page.locator("#message").fill(payload);
    await page.getByLabel(/I agree/).check();
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();

    await signIn(page);
    for (const url of [`/admin/leads?q=${encodeURIComponent(email)}`, "/admin", "/admin/leads"]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `script ran on ${url}`).toBeUndefined();
    }
    await page.goto(`/admin/leads?q=${encodeURIComponent(email)}`);
    await page.getByRole("link", { name: `XSS Tester ${stamp}` }).click();
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), "script ran on the lead page").toBeUndefined();
    await expect(page.locator("main")).toContainText("<script>");
    expect(dialog).toBe(false);
    cleaningUp = true;
    await page.getByRole("button", { name: "Move to trash" }).click();
    await expect(page.getByText("Moved to trash.")).toBeVisible();
    await ctx.close();
  });

  test("SVG and HTML disguised as images are refused by the media upload", async ({ page }) => {
    test.skip(!hasAdmin, "needs an admin account");
    await signIn(page);
    await page.goto("/admin/media");
    await page.locator("#files").setInputFiles([
      { name: "evil.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>') },
      { name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<html><script>alert(1)</script></html>") },
    ]);
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    const alert = page.locator("form [role='alert']");
    await expect(alert).toContainText("evil.svg", { timeout: 20_000 });
    await expect(alert).toContainText("evil.png");
  });
});
