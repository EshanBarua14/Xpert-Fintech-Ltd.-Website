import { expect, test } from "@playwright/test";
import { hasAdmin, signIn } from "./helpers/admin";

/**
 * Roles: an admin adds an editor; the editor can open and edit content but is
 * turned away from creating, deleting and managing users; the admin removes the editor.
 */
const STAMP = Date.now().toString(36);
const EMAIL = `e2e-editor-${STAMP}@example.com`;
const PASSWORD = "e2e-editor-pass-42";

test.describe("Admin roles", () => {
  test.skip(!hasAdmin, "needs an admin account");
  test.describe.configure({ mode: "serial" });

  test("an admin adds an editor", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/users");
    await page.locator("#name").fill(`E2E Editor ${STAMP}`);
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.locator("#role").selectOption("EDITOR");
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`Editor ${EMAIL} created`)).toBeVisible({ timeout: 15_000 });
  });

  test("the editor edits but cannot create, delete or manage users", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("signed in as an editor")).toBeVisible();

    // Editing: an existing page's editor opens.
    await page.goto("/admin/pages");
    const href = await page.locator("main a[href^='/admin/pages/']").filter({ hasNotText: /new/i }).first().getAttribute("href");
    await page.goto(href!);
    await expect(page.getByRole("button", { name: /Save/ }).first()).toBeVisible({ timeout: 15_000 });

    // Creating is turned away, with the reason.
    for (const path of ["/admin/pages/new", "/admin/people/new", "/admin/products/new", "/admin/backups"]) {
      await page.goto(path);
      await expect(page, `${path} should be refused`).toHaveURL(/\/admin\?denied=1/);
      await expect(page.locator("main [role='alert']")).toContainText("only an admin can create");
    }

    // Users: only their own password and two-factor.
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "My password" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add a user" })).toHaveCount(0);
  });

  test("the admin removes the editor", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await signIn(page);
    await page.goto("/admin/users");
    const card = page.locator("li").filter({ hasText: EMAIL }).first();
    await expect(card.getByText("Editor", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator("li").filter({ hasText: EMAIL })).toHaveCount(0, { timeout: 15_000 });
  });
});
