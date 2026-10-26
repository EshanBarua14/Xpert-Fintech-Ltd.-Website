import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import type { AppLocale } from "@/lib/i18n/config";
import { JOURNEY_KEY, readJourney } from "./journey-shared";

export const getJourneySetting = cache(async () => readJourney((await db.siteSetting.findUnique({ where: { key: JOURNEY_KEY } }).catch(() => null))?.value));

const pick = (locale: AppLocale, en: string, bn: string) => (locale === "bn" && bn.trim() ? bn : en);

/** The journey in the visitor's language, or null when it has no milestones. */
export async function getJourney(locale: AppLocale) {
  const s = await getJourneySetting();
  if (!s.steps.length) return null;
  const fmt = (d: string) =>
    d.length === 4
      ? new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { useGrouping: false }).format(Number(d))
      : new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { ...(d.length > 7 && { day: "numeric" as const }), month: "short", year: "numeric", timeZone: "UTC" }).format(
          new Date(`${d.length > 7 ? d : `${d}-01`}T00:00:00Z`),
        );
  return {
    title: pick(locale, s.titleEn, s.titleBn),
    intro: pick(locale, s.introEn, s.introBn),
    metric: pick(locale, s.metricEn, s.metricBn),
    steps: s.steps.map((x) => ({
      date: fmt(x.date),
      year: x.date.slice(0, 4),
      iso: x.date,
      value: x.value,
      title: pick(locale, x.titleEn, x.titleBn),
      body: pick(locale, x.bodyEn, x.bodyBn),
      source: x.source,
      sourceUrl: x.sourceUrl,
    })),
  };
}
