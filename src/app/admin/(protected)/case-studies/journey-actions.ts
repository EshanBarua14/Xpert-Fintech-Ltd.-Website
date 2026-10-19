"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { JOURNEY_KEY, MAX_STEPS, type JourneySetting, type JourneyStep } from "@/lib/content/journey-shared";

export type JourneyState = { ok?: boolean; message?: string; errors?: Record<string, string>; savedAt?: number };

/** Admin → Success stories → Growth journey. */
export async function saveJourney(_prev: JourneyState, formData: FormData): Promise<JourneyState> {
  const admin = await requireAdmin();
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const errors: Record<string, string> = {};
  const long = (k: string, max: number) => {
    if (g(k).length > max) errors[k] = `Keep it under ${max} characters.`;
  };
  const steps: JourneyStep[] = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    const raw = { date: g(`jDate_${i}`), value: g(`jValue_${i}`).replace(/,/g, ""), titleEn: g(`jTitleEn_${i}`), titleBn: g(`jTitleBn_${i}`), bodyEn: g(`jBodyEn_${i}`), bodyBn: g(`jBodyBn_${i}`), source: g(`jSource_${i}`), sourceUrl: g(`jSourceUrl_${i}`) };
    if (!raw.date && !raw.titleEn && !raw.titleBn && !raw.bodyEn && !raw.value) continue;
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(raw.date)) errors[`jDate_${i}`] = "Use YYYY, YYYY-MM or YYYY-MM-DD.";
    if (!raw.titleEn) errors[`jTitleEn_${i}`] = "Give the milestone an English title.";
    if (!raw.source) errors[`jSource_${i}`] = "Every milestone needs its source.";
    if (raw.sourceUrl && !/^https:\/\//.test(raw.sourceUrl)) errors[`jSourceUrl_${i}`] = "Use an https:// link.";
    const value = raw.value ? Number(raw.value) : null;
    if (raw.value && (!Number.isFinite(value) || value! < 0)) errors[`jValue_${i}`] = "Enter a number, or leave it empty.";
    for (const k of ["jTitleEn", "jTitleBn"]) long(`${k}_${i}`, 90);
    for (const k of ["jBodyEn", "jBodyBn"]) long(`${k}_${i}`, 300);
    long(`jSource_${i}`, 120);
    steps.push({ date: raw.date, value: raw.value && Number.isFinite(value) ? value : null, titleEn: raw.titleEn, titleBn: raw.titleBn, bodyEn: raw.bodyEn, bodyBn: raw.bodyBn, source: raw.source, sourceUrl: raw.sourceUrl });
  }
  const journey: JourneySetting = { titleEn: g("jTitle"), titleBn: g("jTitleBnMain"), introEn: g("jIntro"), introBn: g("jIntroBnMain"), metricEn: g("jMetric"), metricBn: g("jMetricBn"), steps: steps.sort((a, b) => a.date.localeCompare(b.date)) };
  for (const k of ["jTitle", "jTitleBnMain", "jMetric", "jMetricBn"]) long(k, 90);
  for (const k of ["jIntro", "jIntroBnMain"]) long(k, 300);
  if (steps.length && !journey.titleEn) errors.jTitle = "Give the section an English title.";
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };
  await db.siteSetting.upsert({ where: { key: JOURNEY_KEY }, update: { value: journey, updatedById: admin.id }, create: { key: JOURNEY_KEY, value: journey, updatedById: admin.id } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/case-studies");
  return { ok: true, savedAt: Date.now(), message: steps.length ? `Saved: ${steps.length} milestone(s) on the success stories page.` : "Saved: no milestones, so the journey is hidden." };
}
