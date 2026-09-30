"use server";

import { revalidatePath } from "next/cache";
import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin, revokeAllSessions, revokeOtherSessions } from "@/lib/auth/session";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";

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
