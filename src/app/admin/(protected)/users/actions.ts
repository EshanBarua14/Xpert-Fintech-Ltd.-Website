"use server";

import { revalidatePath } from "next/cache";
import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin, revokeAllSessions, revokeOtherSessions } from "@/lib/auth/session";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { consumeStep, decryptSecret, encryptSecret, generateTotpSecret, hasServerSecret, otpauthUri, verifyTotp } from "@/lib/auth/totp";

export type AccountState = { errors?: FieldErrors; message?: string; savedAt?: number };

const password = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200)
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Include letters and at least one number.");

// ── Own password ─────────────────────────────────────────────────────────────

export async function changeOwnPassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ current: z.string().min(1, "Enter your current password."), next: password, confirm: z.string() })
    .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The two new passwords do not match." })
    .refine((v) => v.next !== v.current, { path: ["next"], message: "Choose a password different from the current one." })
    .safeParse({ current: formData.get("current") ?? "", next: formData.get("next") ?? "", confirm: formData.get("confirm") ?? "" });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };

  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  const ok = await verify(user.passwordHash, parsed.data.current).catch(() => false);
  if (!ok) return { errors: { current: "Your current password is not correct." } };

  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hash(parsed.data.next) } });
  await revokeOtherSessions(admin.id);
  return { message: "Password changed. Other devices have been signed out.", savedAt: Date.now() };
}

// ── Other admins ─────────────────────────────────────────────────────────────

export async function createAdmin(_prev: AccountState, formData: FormData): Promise<AccountState> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Enter a name.").max(120),
      email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
      password,
    })
    .safeParse({ name: formData.get("name") ?? "", email: formData.get("email") ?? "", password: formData.get("password") ?? "" });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };

  const exists = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { errors: { email: "An admin with this email already exists." } };

  await db.adminUser.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hash(parsed.data.password) },
  });
  revalidatePath("/admin/users");
  return { message: `Admin ${parsed.data.email} created. Share the temporary password privately and ask them to change it.`, savedAt: Date.now() };
}

export async function setAdminActive(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id === admin.id) throw new Error("You cannot deactivate your own account.");
  if (!active) {
    const others = await db.adminUser.count({ where: { isActive: true, id: { not: id } } });
    if (others === 0) throw new Error("At least one active admin is required.");
  }
  await db.adminUser.update({ where: { id }, data: { isActive: active, failedLoginCount: 0, lockedUntil: null } });
  if (!active) await revokeAllSessions(id);
  revalidatePath("/admin/users");
}

/** Change an admin's name or sign-in email (yours or another admin's). */
export async function updateAdmin(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().uuid(),
      name: z.string().trim().min(1, "Enter a name.").max(120),
      email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    })
    .safeParse({ id: formData.get("id") ?? "", name: formData.get("name") ?? "", email: formData.get("email") ?? "" });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };
  const { id, name, email } = parsed.data;
  const clash = await db.adminUser.findFirst({ where: { email, id: { not: id } }, select: { id: true } });
  if (clash) return { errors: { email: "Another admin already uses this email." } };
  const before = await db.adminUser.findUniqueOrThrow({ where: { id }, select: { email: true } });
  await db.adminUser.update({ where: { id }, data: { name, email } });
  // A changed sign-in email signs that admin out everywhere else.
  if (before.email !== email) {
    if (id === admin.id) await revokeOtherSessions(id);
    else await revokeAllSessions(id);
  }
  revalidatePath("/admin/users");
  return { message: "Saved.", savedAt: Date.now() };
}

/**
 * Remove an admin account for good. Their sessions go with it; leads they owned
 * become unassigned; the activity log keeps their past changes. You cannot
 * remove yourself or the last active admin.
 */
export async function deleteAdmin(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  if (id === admin.id) throw new Error("You cannot remove your own account.");
  const others = await db.adminUser.count({ where: { isActive: true, id: { not: id } } });
  if (others === 0) throw new Error("At least one active admin is required.");
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function resetAdminPassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  if (id === admin.id) return { errors: { password: "Use My account to change your own password." } };
  const parsed = password.safeParse(formData.get("password") ?? "");
  if (!parsed.success) return { errors: { password: parsed.error.issues[0]?.message ?? "Invalid password." } };
  await db.adminUser.update({
    where: { id },
    data: { passwordHash: await hash(parsed.data), failedLoginCount: 0, lockedUntil: null },
  });
  await revokeAllSessions(id);
  revalidatePath("/admin/users");
  return { message: "Password reset. Their other sessions were signed out.", savedAt: Date.now() };
}

// ── Two-factor sign-in ───────────────────────────────────────────────────────

export type TwoFactorState = { errors?: FieldErrors; message?: string; savedAt?: number; secret?: string; uri?: string };

/** Step 1: create a secret for the signed-in admin (not active until confirmed). */
export async function startTwoFactorSetup(_prev: TwoFactorState, _formData: FormData): Promise<TwoFactorState> {
  const admin = await requireAdmin();
  if (!hasServerSecret()) {
    return { message: "Set SESSION_SECRET in the server's .env first (32+ random characters), then restart the site." };
  }
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id }, select: { totpEnabled: true } });
  if (user.totpEnabled) return { message: "Two-factor sign-in is already on." };
  const secret = generateTotpSecret();
  await db.adminUser.update({ where: { id: admin.id }, data: { totpSecret: encryptSecret(secret), totpEnabled: false } });
  return { secret, uri: otpauthUri(secret, admin.email) };
}

/** Step 2: prove the app works by entering a code; then it is switched on. */
export async function confirmTwoFactor(prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const admin = await requireAdmin();
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id }, select: { totpSecret: true } });
  const secret = decryptSecret(user.totpSecret);
  if (!secret) return { message: "Setup expired. Start again." };
  const step = verifyTotp(secret, String(formData.get("code") ?? ""));
  if (step === null || !consumeStep(admin.id, step)) {
    return { ...prev, errors: { code: "That code is not correct. Check the time on your phone and use the newest code." } };
  }
  await db.adminUser.update({ where: { id: admin.id }, data: { totpEnabled: true } });
  await revokeOtherSessions(admin.id);
  revalidatePath("/admin/users");
  return { message: "Two-factor sign-in is on. Other devices have been signed out.", savedAt: Date.now() };
}

/** Switch off your own two-factor sign-in (needs your password). */
export async function disableOwnTwoFactor(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const admin = await requireAdmin();
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  const ok = await verify(user.passwordHash, String(formData.get("password") ?? "")).catch(() => false);
  if (!ok) return { errors: { password: "Your password is not correct." } };
  await db.adminUser.update({ where: { id: admin.id }, data: { totpEnabled: false, totpSecret: null } });
  revalidatePath("/admin/users");
  return { message: "Two-factor sign-in is off.", savedAt: Date.now() };
}

/** For an admin who lost their phone: another admin switches it off for them. */
export async function resetAdminTwoFactor(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  if (id === admin.id) throw new Error("Use the two-factor section above for your own account.");
  await db.adminUser.update({ where: { id }, data: { totpEnabled: false, totpSecret: null } });
  await revokeAllSessions(id);
  revalidatePath("/admin/users");
}
