"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { optionalText, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type SettingsState = { errors?: FieldErrors; message?: string; savedAt?: number };

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .or(z.literal(""))
  .transform((v) => v || null);

const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+\d\s()-]*$/, "Use digits, spaces, +, -, ( ) only.")
  .transform((v) => v || null);

const schema = z.object({
  companyNameEn: z.string().trim().min(1, "Company name is required.").max(120),
  companyNameBn: optionalText(120),
  summaryEn: optionalText(600),
  summaryBn: optionalText(600),
  contactEmail: email,
  contactPhone: phone,
  appSupportEmail: email,
  appSupportPhone: phone,
  addressEn: z.string().trim().min(1, "Office address is required.").max(300),
  addressBn: optionalText(300),
  mapUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(v), "Paste a Google Maps link or its “Embed a map” address."),
  hoursEn: optionalText(160),
  hoursBn: optionalText(160),
  registrationEn: optionalText(300),
  registrationBn: optionalText(300),
  regulatoryEn: optionalText(800),
  regulatoryBn: optionalText(800),
  socialLinks: z.string().max(2000),
  alertEmails: z.string().max(1000),
});

/** "LinkedIn | https://…" per line → [{ label, url }]. */
function parseSocialLinks(text: string): { value: { label: string; url: string }[] } | { error: string } {
  const links: { label: string; url: string }[] = [];
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    const [label = "", url = ""] = line.split("|").map((s) => s.trim());
    if (!label || !url.startsWith("https://") || !z.string().url().safeParse(url).success) {
      return { error: `Line ${i + 1}: use "Name | https://…".` };
    }
    links.push({ label, url });
  }
  return { value: links };
}

function parseEmails(text: string): { value: string[] } | { error: string } {
  const list = text
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const bad = list.find((e) => !z.string().email().safeParse(e).success);
  return bad ? { error: `"${bad}" is not a valid email.` } : { value: [...new Set(list)] };
}

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const social = parseSocialLinks(v.socialLinks);
  if ("error" in social) return { errors: { socialLinks: social.error } };
  const alerts = parseEmails(v.alertEmails);
  if ("error" in alerts) return { errors: { alertEmails: alerts.error } };

  const localized = (en: string | null | undefined, bn: string | null | undefined) =>
    ({ en: en ?? "", ...(bn ? { bn } : {}) }) as Prisma.InputJsonValue;

  const settings: Record<string, Prisma.InputJsonValue> = {
    "company.name": localized(v.companyNameEn, v.companyNameBn),
    "company.summary": localized(v.summaryEn, v.summaryBn),
    "contact.email": v.contactEmail ?? "",
    "contact.phone": v.contactPhone ?? "",
    "contact.appSupportEmail": v.appSupportEmail ?? "",
    "contact.appSupportPhone": v.appSupportPhone ?? "",
    "social.links": social.value,
    "company.registration": localized(v.registrationEn, v.registrationBn),
    "company.regulatory": localized(v.regulatoryEn, v.regulatoryBn),
    "leads.alertEmails": alerts.value,
  };

  await db.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(settings)) {
      await tx.siteSetting.upsert({
        where: { key },
        update: { value, updatedById: admin.id },
        create: { key, value, updatedById: admin.id },
      });
    }
    const office = await tx.office.upsert({
      where: { key: "hq" },
      update: { email: v.contactEmail, phone: v.contactPhone, mapUrl: v.mapUrl || null, updatedById: admin.id },
      create: { key: "hq", isPrimary: true, status: "PUBLISHED", email: v.contactEmail, phone: v.contactPhone, mapUrl: v.mapUrl || null, createdById: admin.id },
    });
    await tx.officeTranslation.upsert({
      where: { officeId_locale: { officeId: office.id, locale: "en" } },
      update: { address: v.addressEn, hours: v.hoursEn ?? null },
      create: { officeId: office.id, locale: "en", name: "Head office", address: v.addressEn, hours: v.hoursEn ?? null },
    });
    if (v.addressBn) {
      await tx.officeTranslation.upsert({
        where: { officeId_locale: { officeId: office.id, locale: "bn" } },
        update: { address: v.addressBn, hours: v.hoursBn ?? null },
        create: { officeId: office.id, locale: "bn", name: "প্রধান কার্যালয়", address: v.addressBn, hours: v.hoursBn ?? null },
      });
    } else {
      await tx.officeTranslation.deleteMany({ where: { officeId: office.id, locale: "bn" } });
    }
  });

  revalidatePath("/", "layout");
  return { message: "Settings saved. The website footer updates right away.", savedAt: Date.now() };
}
