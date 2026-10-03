import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";

export type NavLink = {
  id: string;
  label: string;
  description: string | null;
  /** null for a group heading that only holds children. */
  href: string | null;
  external: boolean;
  newTab: boolean;
  isCta: boolean;
  children: NavLink[];
};

type Translation = { locale: string; label: string; description: string | null };

function pickTranslation(translations: Translation[], locale: AppLocale) {
  return translations.find((t) => t.locale === locale) ?? translations.find((t) => t.locale === "en");
}

function resolveHref(
  item: { linkType: string; href: string | null },
  locale: AppLocale,
): { href: string | null; external: boolean } {
  switch (item.linkType) {
    case "EXTERNAL":
      return { href: item.href, external: true };
    case "INTERNAL": {
      const path = (item.href ?? "").replace(/^\/+/, "");
      return { href: path ? `/${locale}/${path}` : `/${locale}`, external: false };
    }
    // ENTITY links (e.g. "this product") are resolved once public routes exist (Phase 4).
    default:
      return { href: null, external: false };
  }
}

/** Routes that always exist, below the locale. */
const FIXED_ROUTES = [
  "", "platform", "consortium", "products", "events", "contact", "request-demo",
  "company/about", "company/board", "company/management", "company/team", "careers",
];

/**
 * Every internal path that currently shows a page in this language:
 * fixed routes, published pages, products and events. Menu links to anything
 * else are hidden, so visitors never meet a 404 from the menu while content
 * is still being written. Shared by the header and footer in one request.
 */
const livePaths = cache(async (locale: AppLocale): Promise<Set<string>> => {
  const now = new Date();
  const [pages, offerings, events, articles, careers, cases, resourceCount, albumCount] = await Promise.all([
    db.pageTranslation.findMany({ where: { locale, page: publishedWhere(now) }, select: { path: true } }),
    db.offeringTranslation.findMany({ where: { locale, offering: { ...publishedWhere(now), hasOwnPage: true } }, select: { slug: true } }),
    db.eventTranslation.findMany({ where: { locale, event: publishedWhere(now) }, select: { slug: true } }),
    db.articleTranslation.findMany({ where: { locale, article: publishedWhere(now) }, select: { slug: true } }),
    db.careerTranslation.findMany({ where: { locale, career: publishedWhere(now) }, select: { slug: true } }),
    db.caseStudyTranslation.findMany({ where: { locale, caseStudy: publishedWhere(now) }, select: { slug: true } }),
    db.resource.count({ where: publishedWhere(now) }),
    db.event.count({ where: { ...publishedWhere(now), gallery: { some: {} } } }),
  ]);
  // Listing pages appear in menus only once they have something to show.
  const listings = [
    articles.length > 0 && "news",
    cases.length > 0 && "case-studies",
    resourceCount > 0 && "resources",
    albumCount > 0 && "gallery",
  ].filter((x): x is string => Boolean(x));
  return new Set([
    ...FIXED_ROUTES,
    ...listings,
    ...pages.map((p) => p.path),
    ...offerings.map((o) => `products/${o.slug}`),
    ...events.map((e) => `events/${e.slug}`),
    ...articles.map((a) => `news/${a.slug}`),
    ...careers.map((c) => `careers/${c.slug}`),
    ...cases.map((c) => `case-studies/${c.slug}`),
  ]);
});

/** "company/about#team" → "company/about" */
function internalPath(href: string | null): string {
  return (href ?? "").replace(/^\/+/, "").split(/[?#]/)[0]!.replace(/\/+$/, "").toLowerCase();
}

/**
 * Loads a menu from Admin → Navigation as a tree, in the requested language
 * (falling back to English per item). Returns [] if the menu is missing or the
 * database is unreachable, so a page never fails because of its menu.
 */
export async function getNavMenu(key: string, locale: AppLocale): Promise<NavLink[]> {
  try {
    const menu = await db.navMenu.findUnique({
      where: { key },
      include: {
        items: {
          where: { isHidden: false },
          orderBy: { sortOrder: "asc" },
          include: { translations: true },
        },
      },
    });
    if (!menu) return [];
    const live = await livePaths(locale);

    const byParent = new Map<string | null, typeof menu.items>();
    for (const item of menu.items) {
      const list = byParent.get(item.parentId) ?? [];
      list.push(item);
      byParent.set(item.parentId, list);
    }

    const build = (parentId: string | null): NavLink[] =>
      (byParent.get(parentId) ?? []).flatMap((item) => {
        const t = pickTranslation(item.translations, locale);
        if (!t) return [];
        const { href, external } = resolveHref(item, locale);
        const children = build(item.id);
        // Internal link to a page that is not published (in this language) yet:
        // hide it, or keep it as a plain heading if it still has visible children.
        const broken = item.linkType === "INTERNAL" && !live.has(internalPath(item.href));
        if (broken && children.length === 0) return [];
        if (!broken && !href && children.length === 0) return [];
        return [
          {
            id: item.id,
            label: t.label,
            description: t.description,
            href: broken ? null : href,
            external,
            newTab: item.openInNewTab,
            isCta: item.isCta,
            children,
          },
        ];
      });

    return build(null);
  } catch (error) {
    console.error(`[nav] could not load menu "${key}"`, error);
    return [];
  }
}
