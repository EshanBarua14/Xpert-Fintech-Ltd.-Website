"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { CREDENTIALS_KEY, MAX_CREDENTIALS, orgRef, orgWhere, type CredentialItem } from "@/lib/content/credentials";
import type { FieldErrors } from "@/lib/validation/common";

export type CredentialsState = { errors?: FieldErrors; message?: string; savedAt?: number };

/** Saves the memberships and certifications list (Settings key "site.credentials"). Empty rows are dropped. */
export async function saveCredentials(_prev: CredentialsState, formData: FormData): Promise<CredentialsState> {
  const admin = await requireAdmin();
  const errors: FieldErrors = {};
  const items: CredentialItem[] = [];
  for (let i = 0; i < MAX_CREDENTIALS; i++) {
    const orgKey = String(formData.get(`orgKey-${i}`) ?? "").trim();
    const en = String(formData.get(`en-${i}`) ?? "").trim().slice(0, 80);
    const bn = String(formData.get(`bn-${i}`) ?? "").trim().slice(0, 80);
    if (!orgKey && !en && !bn) continue;
    if (!orgKey) errors[`orgKey-${i}`] = "Choose the organization.";
    if (!en) errors[`en-${i}`] = "Write what XFL holds, e.g. “FIX & ITCH certified”.";
    items.push({ orgKey, en, bn });
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };
  const keys = [...new Set(items.map((i) => i.orgKey))];
  const found = await db.organization.findMany({ where: { ...orgWhere(keys), deletedAt: null }, select: { id: true, key: true } });
  for (const [i, it] of items.entries()) if (!found.some((f) => orgRef(f) === it.orgKey || f.id === it.orgKey)) errors[`orgKey-${i}`] = "That organization is no longer in Admin → Organizations.";
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };
  const value = { published: formData.get("published") === "on", items };
  await db.siteSetting.upsert({
    where: { key: CREDENTIALS_KEY },
    update: { value, updatedById: admin.id },
    create: { key: CREDENTIALS_KEY, value, updatedById: admin.id },
  });
  revalidatePath("/", "layout");
  return {
    message: value.published ? "Saved. They show on the home page and in the footer of every page." : "Saved, but hidden: tick “Show on the website” to publish them.",
    savedAt: Date.now(),
  };
}
