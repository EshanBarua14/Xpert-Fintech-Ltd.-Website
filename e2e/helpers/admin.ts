import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
export const hasAdmin = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

/** Password step of the admin sign-in. */
export async function enterPassword(page: Page) {
  // Sign-ins are limited per client address (10 per 15 minutes). The test runner signs in far more
  // often than that from one machine, so each sign-in presents its own address.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testAddress() });
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signIn(page: Page) {
  await enterPassword(page);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}

/** A random private address for one sign-in (see enterPassword). */
export function testAddress() {
  const n = () => Math.floor(Math.random() * 250) + 1;
  return `10.${n()}.${n()}.${n()}`;
}
