import "server-only";
import { db } from "@/lib/db/client";
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
        return [
          {
            id: item.id,
            label: t.label,
            description: t.description,
            href,
            external,
            newTab: item.openInNewTab,
            isCta: item.isCta,
            children: build(item.id),
          },
        ];
      });

    return build(null);
  } catch (error) {
    console.error(`[nav] could not load menu "${key}"`, error);
    return [];
  }
}
