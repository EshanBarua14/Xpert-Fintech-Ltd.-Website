import { expect, test } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

/** Visitor journeys end to end: contact message, job application, search. */
test.describe("Visitor workflows", () => {
  test("a contact message arrives in Admin → Leads", async ({ page }) => {
    test.skip(!hasAdmin, "needs an admin account");
    const stamp = Date.now();
    const email = `e2e-contact+${stamp}@example.com`;
    const name = `E2E Contact ${stamp}`;
    await page.goto("/en/contact");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Message", { exact: false }).last().fill("Automated test — please ignore.");
    await page.getByLabel(/I agree/).check();
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible({ timeout: 15_000 });

    await signIn(page);
    await page.goto(`/admin/leads?q=${encodeURIComponent(email)}`);
    await page.getByRole("link", { name }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Move to trash" }).click();
    await expect(page.getByText("Moved to trash.")).toBeVisible();
  });

  test("a job application with a PDF CV arrives in Admin → Applications", async ({ page }) => {
    test.skip(!hasAdmin, "needs an admin account");
    await page.goto("/en/careers");
    const open = page.getByRole("link", { name: /View and apply/i }).first();
    test.skip(!(await open.count()), "no open roles");
    await open.click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send application" }) });
    test.skip(!(await form.count()), "this role takes applications elsewhere");

    const stamp = Date.now();
    const email = `e2e-apply+${stamp}@example.com`;
    const name = `E2E Applicant ${stamp}`;
    await form.getByLabel("Full name").fill(name);
    await form.getByLabel("Email", { exact: true }).fill(email);
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
    );
    await form.locator("input[type=file]").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: pdf });
    await form.locator("input[name=consent]").check();
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send application" }).click();
    await expect(page.getByText("Application received")).toBeVisible({ timeout: 20_000 });

    await signIn(page);
    await page.goto(`/admin/applications?q=${encodeURIComponent(email)}`);
    await page.getByRole("link", { name }).first().click();
    // The CV opens for a signed-in admin.
    const cv = page.getByRole("link", { name: /CV|cv\.pdf|Download/i }).first();
    if (await cv.count()) {
      const href = await cv.getAttribute("href");
      if (href && !href.startsWith("mailto:")) {
        const res = await page.request.get(href);
        expect(res.status(), "CV download").toBe(200);
      }
    }
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Move to trash/ }).click();
    await expect(page.getByText(/Moved to trash/)).toBeVisible();
  });

  test("site search finds the trading platform", async ({ page }) => {
    await page.goto("/en/search?q=trading");
    await expect(page.locator("main a[href*='/products/']").first()).toBeVisible();
  });

  test("a wrong admin password is refused", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("[role='alert']").filter({ hasText: /./ }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin pages need a sign-in", async ({ page }) => {
    await page.goto("/admin/leads");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/Sitemap:/i);
    const map = await request.get("/sitemap.xml");
    expect(map.status()).toBe(200);
    expect((await map.text()).match(/<loc>/g)?.length ?? 0).toBeGreaterThan(10);
  });
});
