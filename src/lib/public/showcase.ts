import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import type { VisualKind } from "@/components/flagship/Visuals";
import { mediaMap } from "./content";
import { getDesign } from "@/lib/content/design";
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
  /** Up to three images for the web, tablet and phone screens (hero image first, then screenshots). */
  shots: { url: string; alt: string; width: number | null; height: number | null }[];
  /** Product logo (Admin → Products → Product logo). */
  logo: { url: string; width: number | null; height: number | null } | null;
  /** Colours and symbol from Admin → Design → Products. */
  look: { from?: string; to?: string; icon?: string } | null;
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
      media: { where: { isHidden: false, kind: "SCREENSHOT" }, orderBy: { sortOrder: "asc" }, take: 3 },
    },
  });
  const design = await getDesign();
  const images = await mediaMap(rows.flatMap((r) => [r.heroMediaId, r.iconMediaId, ...r.media.map((m) => m.mediaId)]), locale);
  // In the order set in Admin → Products.
  return rows
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
        shots: [r.heroMediaId, ...r.media.map((m) => m.mediaId)]
          .map((id) => (id ? images.get(id) : undefined))
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
          .slice(0, 3),
        logo: r.iconMediaId ? (images.get(r.iconMediaId) ?? null) : null,
        look: (r.key && design.products[r.key]) || null,
        capabilities: titles("CAPABILITY").slice(0, 4),
        steps: titles("WORKFLOW_STEP").slice(0, 6),
      };
    })
    .filter((x): x is ShowcaseProduct => x !== null);
});
