"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { FIGURES_KEY, MAX_FIGURES } from "@/lib/content/figures";

export type FiguresState = { ok?: boolean; message?: string; errors?: Record<string, string>; savedAt?: number };

/** Admin → Figures: up to six figures, each with its source. Empty rows are dropped. */
export async function saveFigures(_prev: FiguresState, formData: FormData): Promise<FiguresState> {
  const admin = await requireAdmin();
  const errors: Record<string, string> = {};
  const out: Record<string, string | null>[] = [];
  for (let i = 0; i < MAX_FIGURES; i++) {
    const g = (k: string) => String(formData.get(`${k}_${i}`) ?? "").trim();
    const row = { value: g("value"), labelEn: g("labelEn"), labelBn: g("labelBn"), source: g("source"), asOf: g("asOf") || null };
    if (!row.value && !row.labelEn && !row.source) continue;
    if (!row.value) errors[`value_${i}`] = "Enter the figure, e.g. 120,000 or 9.";
    if (!row.labelEn) errors[`labelEn_${i}`] = "Say what it counts, e.g. Orders a day.";
    if (!row.source) errors[`source_${i}`] = "Name the source, e.g. OMS order log, Sep 2026.";
    if (row.value.length > 24) errors[`value_${i}`] = "Keep the figure short (24 characters at most).";
    if (row.asOf && !/^\d{4}-\d{2}-\d{2}$/.test(row.asOf)) errors[`asOf_${i}`] = "Pick a date.";
    out.push(row);
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };
  await db.siteSetting.upsert({ where: { key: FIGURES_KEY }, update: { value: out, updatedById: admin.id }, create: { key: FIGURES_KEY, value: out, updatedById: admin.id } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/figures");
  return { ok: true, savedAt: Date.now(), message: out.length ? `Saved ${out.length} figure(s). They show on the home page as “Xpert in numbers”.` : "Saved: no figures, so the section is hidden." };
}
