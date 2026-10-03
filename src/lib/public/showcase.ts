import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import type { VisualKind } from "@/components/flagship/Visuals";
import { mediaMap } from "./content";
import { pick } from "./text";

/** Illustration used when a product has no hero image or screenshot yet. */
export function visualForSlug(slug: string): VisualKind {
  if (/rms|risk/.test(slug)) return "risk";
  if (/ekyc|kyc/.test(slug)) return "ekyc";
  if (/bo-account|account-opening/.test(slug)) return "bo";
  if (/dms|document/.test(slug)) return "dms";
  if (/back-office/.test(slug)) return "back";
  if (/market-data|data|connectivity/.test(slug)) return "data";
  return "trading";
}

export type ShowcaseProduct = {
  id: string;
  key: string | null;
  type: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  href: string;
  visual: VisualKind;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
  capabilities: string[];
  steps: string[];
};

/** Published products with what the showcase needs: image, top capabilities, workflow. */
export const getShowcase = cache(async (locale: AppLocale): Promise<ShowcaseProduct[]> => {
  const rows = await db.offering.findMany({
    where: { ...publishedWhere(), hasOwnPage: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      translations: true,
      items: {
        where: { isHidden: false, kind: { in: ["CAPABILITY", "WORKFLOW_STEP"] } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: true },
      },
      media: { where: { isHidden: false, kind: "SCREENSHOT" }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const images = await mediaMap(rows.map((r) => r.heroMediaId ?? r.media[0]?.mediaId), locale);
  const order = ["PLATFORM", "MODULE", "PRODUCT", "INTEGRATION", "CAPABILITY", "SERVICE"];
  return rows
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.sortOrder - b.sortOrder)
    .map((r): ShowcaseProduct | null => {
      const tr = pick(r.translations, locale);
      if (!tr) return null;
      const own = r.translations.find((x) => x.locale === locale);
      const image = images.get(r.heroMediaId ?? r.media[0]?.mediaId ?? "") ?? null;
      const titles = (kind: string) =>
        r.items
          .filter((i) => i.kind === kind)
          .map((i) => pick(i.translations, locale)?.title)
          .filter((x): x is string => Boolean(x));
      return {
        id: r.id,
        key: r.key,
        type: r.type,
        name: tr.name,
        tagline: tr.tagline,
        summary: tr.summary,
        href: `/${own ? locale : "en"}/products/${(own ?? tr).slug}`,
        visual: visualForSlug(tr.slug),
        image,
        capabilities: titles("CAPABILITY").slice(0, 4),
        steps: titles("WORKFLOW_STEP").slice(0, 6),
      };
    })
    .filter((x): x is ShowcaseProduct => x !== null);
});
