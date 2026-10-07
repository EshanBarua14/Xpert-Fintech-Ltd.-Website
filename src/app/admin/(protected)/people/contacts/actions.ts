"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import type { FieldErrors } from "@/lib/validation/common";

export type ContactsState = { errors?: FieldErrors; message?: string; savedAt?: number };

const email = z.string().trim().toLowerCase().max(254).refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.");
const linkedin = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/([a-z]{2,3}\.)?(www\.)?linkedin\.com\//i.test(v), "Use a LinkedIn address, e.g. https://www.linkedin.com/in/name");
const affiliation = z.string().trim().max(200, "Keep it under 200 characters.");

/** Saves email, LinkedIn and position-at-organisation for many people at once (Admin → People → Contact details). */
export async function saveContacts(_prev: ContactsState, formData: FormData): Promise<ContactsState> {
  const admin = await requireAdmin();
  const ids = formData.getAll("id").map(String).filter((id) => z.string().uuid().safeParse(id).success);
  const errors: FieldErrors = {};
  const rows = ids.map((id) => {
    const e = email.safeParse(formData.get(`email.${id}`) ?? "");
    const l = linkedin.safeParse(formData.get(`linkedin.${id}`) ?? "");
    const a = affiliation.safeParse(formData.get(`affiliation.${id}`) ?? "");
    if (!e.success) errors[`email.${id}`] = e.error.issues[0]!.message;
    if (!l.success) errors[`linkedin.${id}`] = l.error.issues[0]!.message;
    if (!a.success) errors[`affiliation.${id}`] = a.error.issues[0]!.message;
    return { id, email: e.success ? e.data || null : null, linkedinUrl: l.success ? l.data || null : null, affiliation: a.success ? a.data || null : null };
  });
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  let changed = 0;
  for (const r of rows) {
    const p = await db.person.findUnique({ where: { id: r.id }, include: { translations: { where: { locale: "en" } } } });
    if (!p) continue;
    const en = p.translations[0];
    if (p.email !== r.email || p.linkedinUrl !== r.linkedinUrl) {
      await db.person.update({ where: { id: r.id }, data: { email: r.email, linkedinUrl: r.linkedinUrl, updatedById: admin.id } });
      changed++;
    }
    if (en && (en.affiliation ?? null) !== r.affiliation) {
      await db.personTranslation.update({ where: { id: en.id }, data: { affiliation: r.affiliation } });
      await db.person.update({ where: { id: r.id }, data: { updatedById: admin.id } });
      changed++;
    }
  }
  revalidatePath("/", "layout");
  return { message: changed ? "Saved. The Board, Management and Team pages show the changes right away." : "Nothing changed.", savedAt: Date.now() };
}
