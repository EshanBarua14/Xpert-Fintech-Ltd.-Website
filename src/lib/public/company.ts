import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { mediaMap } from "./content";
import { pick } from "./text";

/** A setting stored as { en, bn } (or a plain string), in the visitor's language with English fallback. */
function localized(value: unknown, locale: AppLocale): string | null {
  if (typeof value === "string") return value || null;
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    const text = v[locale] ?? v.en;
    return typeof text === "string" && text ? text : null;
  }
  return null;
}

/** Company story from Admin → Settings: summary, about, mission, vision. */
export const getCompanyStory = cache(async (locale: AppLocale) => {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["company.summary", "company.about", "company.mission", "company.vision"] } },
  });
  const get = (key: string) => localized(rows.find((r) => r.key === key)?.value, locale);
  return { summary: get("company.summary"), about: get("company.about"), mission: get("company.mission"), vision: get("company.vision") };
});

/** Published events with a date, oldest first: the company's milestones. */
export const getMilestones = cache(async (locale: AppLocale) => {
  const rows = await db.event.findMany({
    where: { ...publishedWhere(), startsAt: { not: null } },
    orderBy: { startsAt: "asc" },
    include: { translations: true },
  });
  return rows
    .map((e) => {
      const tr = pick(e.translations, locale);
      const own = e.translations.find((x) => x.locale === locale);
      if (!tr || !e.startsAt) return null;
      return {
        id: e.id,
        date: e.startsAt,
        approx: e.dateIsApprox,
        title: tr.title,
        summary: tr.summary,
        href: `/${own ? locale : "en"}/events/${(own ?? tr).slug}`,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
});

/** How many published people are in each group (for the people links). */
export const getPeopleCounts = cache(async () => {
  const groups = ["BOARD", "MANAGEMENT", "CONSULTANT", "LEADERSHIP", "TEAM"] as const;
  const counts = await Promise.all(
    groups.map((group) => db.person.count({ where: { ...publishedWhere(), roles: { some: { group } } } })),
  );
  return Object.fromEntries(groups.map((g, i) => [g, counts[i] ?? 0])) as Record<(typeof groups)[number], number>;
});

/** Published branded trading apps built on the platform, with their brokerage. */
export const getLiveApps = cache(async (locale: AppLocale) => {
  const rows = await db.deployment.findMany({
    where: { ...publishedWhere(), appName: { not: null } },
    orderBy: { sortOrder: "asc" },
    include: { organization: { include: { translations: true } } },
  });
  const live = (d: (typeof rows)[number]) => (d.organization && d.organization.status === "PUBLISHED" && !d.organization.deletedAt ? d.organization : null);
  // The brokerage's logo, when uploaded with permission (Admin → Organizations).
  const logos = await mediaMap(rows.map((d) => (live(d)?.logoPermission ? live(d)!.logoMediaId : null)), locale);
  return rows.map((d) => {
    const o = live(d);
    const org = o ? pick(o.translations, locale) : null;
    const logo = o?.logoPermission && o.logoMediaId ? logos.get(o.logoMediaId) : undefined;
    return {
      id: d.id,
      appName: d.appName!,
      brokerage: org?.name ?? null,
      logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : null,
      playStoreUrl: d.playStoreUrl,
      appStoreUrl: d.appStoreUrl,
      webUrl: d.webUrl,
    };
  });
});
