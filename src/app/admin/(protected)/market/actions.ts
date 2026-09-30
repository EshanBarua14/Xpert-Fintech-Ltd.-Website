"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { testFeed } from "@/lib/market/data";
import { checkbox, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type MarketState = { errors?: FieldErrors; message?: string; savedAt?: number; ok?: boolean };

const refresh = () => {
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

const money = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,\s৳]/g, ""))
  .pipe(z.coerce.number({ invalid_type_error: "Enter an amount in taka." }).positive("Enter an amount above zero.").max(1e15));

const shareSchema = z
  .object({
    tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the trading day."),
    exchange: z.enum(["DSE", "CSE"]),
    xpertTurnover: money,
    marketTurnover: money,
    sourceNote: z.string().trim().max(200).transform((v) => v || null),
  })
  .refine((v) => v.xpertTurnover <= v.marketTurnover, { path: ["xpertTurnover"], message: "Xpert turnover cannot be larger than the market's." });

/** Add or replace the market-share figure for one trading day and exchange. */
export async function saveMarketShare(_prev: MarketState, formData: FormData): Promise<MarketState> {
  const admin = await requireAdmin();
  const parsed = shareSchema.safeParse({
    tradeDate: formData.get("tradeDate") ?? "",
    exchange: formData.get("exchange") ?? "",
    xpertTurnover: String(formData.get("xpertTurnover") ?? ""),
    marketTurnover: String(formData.get("marketTurnover") ?? ""),
    sourceNote: formData.get("sourceNote") ?? "",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const tradeDate = new Date(`${v.tradeDate}T00:00:00Z`);
  const data = {
    xpertTurnover: v.xpertTurnover.toFixed(2),
    marketTurnover: v.marketTurnover.toFixed(2),
    sourceNote: v.sourceNote,
    status: "PUBLISHED" as const,
  };
  await db.marketShare.upsert({
    where: { tradeDate_exchange: { tradeDate, exchange: v.exchange } },
    update: data,
    create: { tradeDate, exchange: v.exchange, createdById: admin.id, ...data },
  });
  refresh();
  const pct = ((v.xpertTurnover / v.marketTurnover) * 100).toFixed(2);
  return { message: `Saved: ${v.exchange} ${v.tradeDate} — ${pct}% market share.`, savedAt: Date.now(), ok: true };
}

export async function deleteMarketShare(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.marketShare.delete({ where: { id } }).catch(() => null);
  refresh();
}
