import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
export const hasAdmin = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

/** Password step of the admin sign-in. */
export async function enterPassword(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signIn(page: Page) {
  await enterPassword(page);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}
