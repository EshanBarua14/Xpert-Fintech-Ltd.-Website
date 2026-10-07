"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { defaultMessages } from "@/lib/i18n/messages";
import { loadTextOverrides, TEXT_SETTING_KEY } from "@/lib/i18n/overrides";
import { placeholders } from "@/lib/i18n/groups";

export type SiteTextState = { message?: string; errors?: Record<string, string>; savedAt?: number };

const changeSchema = z.record(z.enum(["en", "bn"]), z.record(z.string(), z.string().max(2000)));

/**
 * Saves edited interface text. Each change is `{ en: { key: text }, bn: { key: text } }`;
 * an empty text removes the edit (back to the default). A translation must keep
 * the default's placeholders ({n}, {exchange}…), or the site would show them wrong.
 */
export async function saveSiteText(_prev: SiteTextState, formData: FormData): Promise<SiteTextState> {
  const admin = await requireAdmin();
  let parsed: z.infer<typeof changeSchema>;
  try {
    parsed = changeSchema.parse(JSON.parse(String(formData.get("changes") ?? "{}")));
  } catch {
    return { message: "The changes could not be read. Reload the page and try again." };
  }
  const row = await db.siteSetting.findUnique({ where: { key: TEXT_SETTING_KEY } });
  const current = (row?.value ?? {}) as Record<string, Record<string, string>>;
  const next: Record<string, Record<string, string>> = { en: { ...(current.en ?? {}) }, bn: { ...(current.bn ?? {}) } };
  const errors: Record<string, string> = {};
  let count = 0;
  for (const locale of ["en", "bn"] as const) {
    const defaults = defaultMessages(locale) as Record<string, string>;
    const english = defaultMessages("en") as Record<string, string>;
    for (const [key, raw] of Object.entries(parsed[locale] ?? {})) {
      if (!(key in defaults)) continue;
      const text = raw.replace(/\r\n/g, "\n").trim();
      if (!text || text === defaults[key]) {
        if (key in next[locale]!) count++;
        delete next[locale]![key];
        continue;
      }
      const need = placeholders(english[key]!);
      const have = placeholders(text);
      const missing = need.filter((p) => !have.includes(p));
      const extra = have.filter((p) => !need.includes(p));
      if (missing.length || extra.length) {
        errors[`${locale}.${key}`] = `${missing.length ? `Keep ${missing.join(", ")}` : ""}${missing.length && extra.length ? "; " : ""}${extra.length ? `remove ${extra.join(", ")}` : ""} (filled in by the site).`;
        continue;
      }
      if (next[locale]![key] !== text) count++;
      next[locale]![key] = text;
    }
  }
  if (Object.keys(errors).length) return { errors, message: "Some texts need a fix before saving." };
  await db.siteSetting.upsert({
    where: { key: TEXT_SETTING_KEY },
    update: { value: next as Prisma.InputJsonValue, updatedById: admin.id },
    create: { key: TEXT_SETTING_KEY, value: next as Prisma.InputJsonValue, updatedById: admin.id },
  });
  await loadTextOverrides();
  revalidatePath("/", "layout");
  return { message: count ? `Saved ${count} change${count === 1 ? "" : "s"}. The website shows them now.` : "Nothing changed.", savedAt: Date.now() };
}
