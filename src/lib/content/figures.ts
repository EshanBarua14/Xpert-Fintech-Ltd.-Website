import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";

/**
 * Admin → Figures: numbers the company can show the source for (daily orders,
 * years live, members on the platform…), shown on the home page as "In
 * numbers". Each needs a source; nothing is shown that is not entered here.
 */
export const FIGURES_KEY = "site.figures";
export const MAX_FIGURES = 6;

export type Figure = { value: string; labelEn: string; labelBn: string; source: string; asOf: string | null };

export function readFigures(v: unknown): Figure[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((o) => ({
      value: String(o.value ?? "").trim(),
      labelEn: String(o.labelEn ?? "").trim(),
      labelBn: String(o.labelBn ?? "").trim(),
      source: String(o.source ?? "").trim(),
      asOf: typeof o.asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.asOf) ? o.asOf : null,
    }))
    .filter((f) => f.value && f.labelEn && f.source)
    .slice(0, MAX_FIGURES);
}

export const getFigures = cache(async (): Promise<Figure[]> => {
  const row = await db.siteSetting.findUnique({ where: { key: FIGURES_KEY } }).catch(() => null);
  return readFigures(row?.value);
});
