import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import { SITE_URL } from "@/lib/public/seo";

export const revalidate = 3600;

type Tr = { locale: string; path: string };

/** One entry per URL; hreflang alternates list only the languages that exist. */
function entries(items: { translations: Tr[]; updatedAt: Date }[], priority: number): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const item of items) {
    const urls: Record<string, string> = {};
    for (const tr of item.translations) {
      if (tr.locale === "en" || tr.locale === "bn") urls[tr.locale] = `${SITE_URL}/${tr.locale}${tr.path ? `/${tr.path}` : ""}`;
    }
    for (const url of Object.values(urls)) {
      out.push({ url, lastModified: item.updatedAt, priority, alternates: { languages: urls } });
    }
  }
  return out;
}

const fixed = (path: string, updatedAt: Date) => ({
  translations: [
    { locale: "en", path },
    { locale: "bn", path },
  ],
  updatedAt,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  try {
    const [pages, offerings, events, articles, careers, cases, albums] = await Promise.all([
      db.page.findMany({
        where: { ...publishedWhere(now), showInSearch: true },
        select: { key: true, updatedAt: true, translations: { select: { locale: true, path: true } } },
      }),
      db.offering.findMany({
        where: { ...publishedWhere(now), hasOwnPage: true },
        select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
      }),
      db.event.findMany({
        where: publishedWhere(now),
        select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
      }),
      db.article.findMany({ where: publishedWhere(now), select: { updatedAt: true, translations: { select: { locale: true, slug: true } } } }),
      db.career.findMany({ where: publishedWhere(now), select: { updatedAt: true, translations: { select: { locale: true, slug: true } } } }),
      db.caseStudy.findMany({ where: publishedWhere(now), select: { updatedAt: true, translations: { select: { locale: true, slug: true } } } }),
      db.album.findMany({ where: publishedWhere(now), select: { updatedAt: true, translations: { select: { locale: true, slug: true } } } }),
    ]);
    const under = (base: string, rows: { updatedAt: Date; translations: { locale: string; slug: string }[] }[]) =>
      rows.map((r) => ({ updatedAt: r.updatedAt, translations: r.translations.map((t) => ({ locale: t.locale, path: `${base}/${t.slug}` })) }));

    // Pages with system keys (home, contact…) are rendered by their own routes.
    const cmsPages = pages.filter((p) => !["home", "contact", "request-demo"].includes(p.key ?? ""));
    const home = pages.find((p) => p.key === "home")?.updatedAt ?? now;

    const all = [
      ...entries([fixed("", home)], 1),
      ...entries(cmsPages, 0.7),
      ...entries([fixed("products", now)], 0.9),
      ...entries(
        offerings.map((o) => ({ updatedAt: o.updatedAt, translations: o.translations.map((t) => ({ locale: t.locale, path: `products/${t.slug}` })) })),
        0.8,
      ),
      ...entries([fixed("events", now)], 0.5),
      ...entries(
        events.map((e) => ({ updatedAt: e.updatedAt, translations: e.translations.map((t) => ({ locale: t.locale, path: `events/${t.slug}` })) })),
        0.4,
      ),
      ...entries([fixed("company/about", now), fixed("company/board", now), fixed("company/management", now), fixed("company/team", now)], 0.5),
      ...entries([fixed("careers", now)], 0.5),
      ...entries(under("careers", careers), 0.5),
      ...entries([fixed("news", now), fixed("gallery", now)], 0.6),
      ...entries(under("gallery", albums), 0.4),
      ...entries(under("news", articles), 0.6),
      ...(cases.length ? entries([fixed("case-studies", now)], 0.5) : []),
      ...entries(under("case-studies", cases), 0.5),
      ...entries([fixed("contact", now), fixed("request-demo", now)], 0.6),
    ];
    const seen = new Set<string>();
    return all.filter((e) => !seen.has(e.url) && !!seen.add(e.url));
  } catch (error) {
    console.error("[sitemap] database unavailable", error);
    return entries([fixed("", now)], 1);
  }
}
