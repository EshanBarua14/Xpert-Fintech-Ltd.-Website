"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { clearMarketInfoCache, dhakaToday, testFeed } from "@/lib/market/data";
import { saveShares, type ShareInput } from "@/lib/market/share";
import { HEADLINE_SHARE_KEY } from "@/lib/content/leaders";
import { checkbox, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type MarketState = { errors?: FieldErrors; message?: string; savedAt?: number; ok?: boolean };

const refresh = () => {
  clearMarketInfoCache();
  revalidatePath("/", "layout");
  revalidatePath("/admin/market");
};

const sourceSchema = z.object({
  providerName: z.string().trim().max(120).transform((v) => v || null),
  licenceReference: z.string().trim().max(120).transform((v) => v || null),
  licenceExpiresAt: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a date.")
    .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
  displayDelayMinutes: z.coerce.number().int("Whole minutes only.").min(0).max(240),
  isActive: checkbox,
});

/** Feed settings: provider, licence and whether the website shows the data. */
export async function saveMarketSource(_prev: MarketState, formData: FormData): Promise<MarketState> {
  const admin = await requireAdmin();
  const parsed = sourceSchema.safeParse({
    providerName: formData.get("providerName") ?? "",
    licenceReference: formData.get("licenceReference") ?? "",
    licenceExpiresAt: formData.get("licenceExpiresAt") ?? "",
    displayDelayMinutes: formData.get("displayDelayMinutes") ?? "0",
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const existing = await db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } });
  const data = { ...parsed.data, updatedById: admin.id };
  if (existing) await db.marketDataSource.update({ where: { id: existing.id }, data });
  else await db.marketDataSource.create({ data: { name: "DSE / CSE feed", mode: "LICENSED", ...data } });
  refresh();
  return { message: "Saved.", savedAt: Date.now(), ok: true };
}

export async function testMarketFeed(_prev: MarketState, _formData: FormData): Promise<MarketState> {
  await requireAdmin();
  const r = await testFeed();
  return { message: r.message, ok: r.ok, savedAt: Date.now() };
}

const amount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,\s৳]/g, ""))
  .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 1e14), "Enter an amount in taka, e.g. 812345678.50")
  .transform((v) => (v === "" ? null : Number(v)));

/** A share typed as a percentage (e.g. 45), used when Xpert's turnover in taka is not to hand. */
const pct = z
  .string()
  .trim()
  .transform((v) => v.replace(/[%\s]/g, ""))
  .refine((v) => v === "" || (Number(v) >= 0 && Number(v) <= 100), "Enter a percentage from 0 to 100.")
  .transform((v) => (v === "" ? null : Number(v)));

const dailySchema = z.object({
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the trading day."),
  sourceNote: z.string().trim().max(200).transform((v) => v || null),
  dseXpert: amount,
  dseMarket: amount,
  cseXpert: amount,
  cseMarket: amount,
  dseShare: pct,
  cseShare: pct,
});

/**
 * Saves the day's market share for DSE and/or CSE in one go. An exchange is
 * saved when its Xpert turnover is filled in; for today, an empty market
 * total is taken from the live exchange data when available.
 */
export async function saveMarketShare(_prev: MarketState, formData: FormData): Promise<MarketState> {
  const admin = await requireAdmin();
  const parsed = dailySchema.safeParse(Object.fromEntries(Object.keys(dailySchema.shape).map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (v.tradeDate > dhakaToday()) return { errors: { tradeDate: "That day has not happened yet." }, message: "Please fix the highlighted fields." };
  const inputs: ShareInput[] = [];
  // Xpert's turnover in taka, or else its share in % (turned into taka from the market total).
  if (v.dseXpert !== null || v.dseShare !== null) inputs.push({ exchange: "DSE", xpertTurnover: v.dseXpert ?? 0, sharePct: v.dseXpert === null ? v.dseShare : null, marketTurnover: v.dseMarket });
  if (v.cseXpert !== null || v.cseShare !== null) inputs.push({ exchange: "CSE", xpertTurnover: v.cseXpert ?? 0, sharePct: v.cseXpert === null ? v.cseShare : null, marketTurnover: v.cseMarket });
  if (!inputs.length) return { errors: { dseXpert: "Fill in Xpert's turnover or share for DSE, CSE or both." }, message: "Nothing to save yet." };
  const results = await saveShares(v.tradeDate, inputs, v.sourceNote, admin.id);
  if (results.some((r) => r.ok)) refresh();
  const errors: FieldErrors = {};
  for (const r of results) if (!r.ok) errors[r.exchange === "DSE" ? "dseMarket" : "cseMarket"] = r.message;
  const saved = results.filter((r) => r.ok).map((r) => r.message);
  return {
    ok: saved.length > 0 && Object.keys(errors).length === 0,
    savedAt: Date.now(),
    message: saved.length ? `Saved — ${saved.join(" · ")}` : "Nothing saved.",
    ...(Object.keys(errors).length && { errors }),
  };
}

export async function deleteMarketShare(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.marketShare.delete({ where: { id } }).catch(() => null);
  refresh();
}

const goalSchema = z.object({
  targetPct: z.coerce.number({ invalid_type_error: "Enter a percentage." }).gt(0, "Enter a percentage above 0.").max(100, "100% at most."),
  year: z.coerce.number().int("Enter a year.").min(2024, "Enter a year from 2024.").max(2100),
  en: z.string().trim().max(300),
  bn: z.string().trim().max(300),
});

/** The market-share goal shown on the home page ("70% by 2028"). */
export async function saveMarketGoal(_prev: MarketState, formData: FormData): Promise<MarketState> {
  const admin = await requireAdmin();
  const parsed = goalSchema.safeParse({
    targetPct: formData.get("targetPct") ?? "",
    year: formData.get("year") ?? "",
    en: formData.get("goalEn") ?? "",
    bn: formData.get("goalBn") ?? "",
  });
  if (!parsed.success) {
    const errors = toFieldErrors(parsed.error);
    return { errors: { ...errors, ...(errors.en && { goalEn: errors.en }), ...(errors.bn && { goalBn: errors.bn }) }, message: "Please fix the highlighted fields." };
  }
  const value = parsed.data;
  await db.siteSetting.upsert({ where: { key: "market.goal" }, update: { value, updatedById: admin.id }, create: { key: "market.goal", value, updatedById: admin.id } });
  refresh();
  return { message: "Goal saved.", savedAt: Date.now(), ok: true };
}

/** Removes the goal: the home page then shows market share without a target. */
export async function clearMarketGoal() {
  await requireAdmin();
  await db.siteSetting.deleteMany({ where: { key: "market.goal" } });
  refresh();
}

const headlineSchema = z.object({
  pct: z
    .string()
    .trim()
    .transform((v) => v.replace(/[%\s]/g, ""))
    .refine((v) => v === "" || (Number(v) > 0 && Number(v) <= 100), "Enter a percentage above 0 and up to 100, or leave empty."),
  asOf: z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a date."),
});

/**
 * Xpert's overall share of DSE and CSE turnover as XFL states it. Shown as the
 * home page's headline figure instead of the one worked out from the daily
 * entries; empty removes it.
 */
export async function saveHeadlineShare(_prev: MarketState, formData: FormData): Promise<MarketState> {
  const admin = await requireAdmin();
  const parsed = headlineSchema.safeParse({ pct: formData.get("headlinePct") ?? "", asOf: formData.get("headlineAsOf") ?? "" });
  if (!parsed.success) {
    const e = toFieldErrors(parsed.error);
    return { errors: { headlinePct: e.pct ?? "", headlineAsOf: e.asOf ?? "" }, message: "Please fix the highlighted fields." };
  }
  const { pct, asOf } = parsed.data;
  if (pct === "") {
    await db.siteSetting.deleteMany({ where: { key: HEADLINE_SHARE_KEY } });
    refresh();
    return { ok: true, savedAt: Date.now(), message: "Removed. The home page shows the share worked out from the daily figures." };
  }
  const value = { pct: Number(pct), asOf: asOf || null };
  await db.siteSetting.upsert({ where: { key: HEADLINE_SHARE_KEY }, update: { value, updatedById: admin.id }, create: { key: HEADLINE_SHARE_KEY, value, updatedById: admin.id } });
  refresh();
  return { ok: true, savedAt: Date.now(), message: `Saved: ${value.pct}% overall${value.asOf ? ` (as of ${value.asOf})` : ""}.` };
}
