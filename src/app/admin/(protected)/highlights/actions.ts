"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ICON_NAMES } from "@/components/ui/Icon";
import { MAX_STRENGTHS, SAVINGS_KEY, STRENGTHS_KEY, WHATSAPP_KEY, savingPct, type SavingsSetting, type StrengthsSetting, type WhatsAppSetting } from "@/lib/content/highlights";

export type HighlightsState = { ok?: boolean; message?: string; errors?: Record<string, string>; savedAt?: number };

const MAX_TEXT = 400;

/** Admin → Home highlights: core strengths, the cost-savings graphic and the WhatsApp button. */
export async function saveHighlights(_prev: HighlightsState, formData: FormData): Promise<HighlightsState> {
  const admin = await requireAdmin();
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const errors: Record<string, string> = {};
  const long = (k: string, max = MAX_TEXT) => {
    if (g(k).length > max) errors[k] = `Keep it under ${max} characters.`;
  };

  // Core strengths
  const items: StrengthsSetting["items"] = [];
  for (let i = 0; i < MAX_STRENGTHS; i++) {
    const row = { icon: g(`icon_${i}`), titleEn: g(`titleEn_${i}`), titleBn: g(`titleBn_${i}`), bodyEn: g(`bodyEn_${i}`), bodyBn: g(`bodyBn_${i}`), statEn: g(`statEn_${i}`), statBn: g(`statBn_${i}`) };
    if (!row.titleEn && !row.titleBn && !row.bodyEn && !row.bodyBn) continue;
    if (!row.titleEn) errors[`titleEn_${i}`] = "Give the strength an English title.";
    if (!ICON_NAMES.includes(row.icon)) row.icon = "check";
    for (const k of ["titleEn", "titleBn"]) long(`${k}_${i}`, 90);
    for (const k of ["bodyEn", "bodyBn"]) long(`${k}_${i}`, 300);
    for (const k of ["statEn", "statBn"]) long(`${k}_${i}`, 16);
    items.push(row);
  }
  const strengths: StrengthsSetting = { titleEn: g("sTitleEn"), titleBn: g("sTitleBn"), introEn: g("sIntroEn"), introBn: g("sIntroBn"), items };
  for (const k of ["sTitleEn", "sTitleBn"]) long(k, 90);
  for (const k of ["sIntroEn", "sIntroBn"]) long(k, 300);
  if (items.length && !strengths.titleEn) errors.sTitleEn = "Give the section an English title.";

  // Cost savings
  const number = (k: string) => {
    const raw = g(k).replace(/,/g, "");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      errors[k] = "Enter a number, e.g. 25 or 4.5.";
      return null;
    }
    return n;
  };
  const savings: SavingsSetting = {
    published: g("published") === "1",
    titleEn: g("vTitleEn"),
    titleBn: g("vTitleBn"),
    bodyEn: g("vBodyEn"),
    bodyBn: g("vBodyBn"),
    before: number("before"),
    after: number("after"),
    pct: number("pct"),
    prefix: g("prefix"),
    unitEn: g("unitEn"),
    unitBn: g("unitBn"),
    beforeLabelEn: g("beforeLabelEn"),
    beforeLabelBn: g("beforeLabelBn"),
    afterLabelEn: g("afterLabelEn"),
    afterLabelBn: g("afterLabelBn"),
    source: g("source"),
    sourceUrl: g("sourceUrl"),
    asOf: g("asOf"),
    noteEn: g("noteEn"),
    noteBn: g("noteBn"),
  };
  for (const k of ["vTitleEn", "vTitleBn", "prefix", "unitEn", "unitBn", "beforeLabelEn", "beforeLabelBn", "afterLabelEn", "afterLabelBn", "source"]) long(k, 90);
  for (const k of ["vBodyEn", "vBodyBn", "noteEn", "noteBn"]) long(k, 300);
  if (savings.before !== null && savings.after !== null && savingPct(savings.before, savings.after) === null)
    errors.after = "The cost with Xpert must be lower than the cost before.";
  if (savings.sourceUrl && !/^https?:\/\/\S+$/i.test(savings.sourceUrl)) errors.sourceUrl = "Enter the full address, starting with https://";
  if (savings.asOf && !/^\d{4}-\d{2}-\d{2}$/.test(savings.asOf)) errors.asOf = "Pick a date.";
  if (savings.pct !== null && (savings.pct <= 0 || savings.pct >= 100)) errors.pct = "Enter a percentage between 1 and 99.";
  if (savings.published) {
    const figures = savings.before !== null && savings.after !== null;
    if (!figures && savings.pct === null) errors.pct = "Enter the two costs, or the share saved, to publish.";
    if (!savings.source) errors.source = "Name the source of these figures to publish, e.g. XFL cost study, 2026.";
  }

  // WhatsApp
  const whatsapp: WhatsAppSetting = {
    number: g("waNumber"),
    labelEn: g("waLabelEn"),
    labelBn: g("waLabelBn"),
    messageEn: g("waMessageEn"),
    messageBn: g("waMessageBn"),
    greetingEn: g("waGreetingEn"),
    greetingBn: g("waGreetingBn"),
  };
  const waDigits = whatsapp.number.replace(/\D/g, "");
  if (whatsapp.number && (waDigits.length < 8 || waDigits.length > 15 || !/^[+\d\s()-]+$/.test(whatsapp.number)))
    errors.waNumber = "Enter the number with the country code, e.g. +8801XXXXXXXXX.";
  for (const k of ["waLabelEn", "waLabelBn"]) long(k, 40);
  for (const k of ["waMessageEn", "waMessageBn", "waGreetingEn", "waGreetingBn"]) long(k, 300);

  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  await db.$transaction(async (tx) => {
    const put = (key: string, value: object) =>
      tx.siteSetting.upsert({ where: { key }, update: { value, updatedById: admin.id }, create: { key, value, updatedById: admin.id } });
    await put(STRENGTHS_KEY, strengths);
    await put(SAVINGS_KEY, savings);
    await put(WHATSAPP_KEY, whatsapp);
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/highlights");
  const pct = savingPct(savings.before, savings.after) ?? savings.pct;
  const notes = [
    `${items.length} strength(s)`,
    savings.published && pct !== null ? `cost savings live (−${pct}%)` : "cost savings not published",
    waDigits ? "WhatsApp button opens a chat" : "no WhatsApp number yet: the button is hidden",
  ];
  return { ok: true, savedAt: Date.now(), message: `Saved: ${notes.join("; ")}.` };
}
