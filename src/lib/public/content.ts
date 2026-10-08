import "server-only";
import { editorHints } from "@/lib/env/hints";
import { cache } from "react";
import type { OrganizationKind, PersonGroup } from "@prisma/client";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { pick } from "./text";

// Everything here returns PUBLISHED, non-deleted, already-due content only.

export type MediaInfo = { url: string; alt: string; width: number | null; height: number | null };

/** Resolves media ids to URLs + alt text in one query. Trashed files resolve to nothing. */
export async function mediaMap(ids: (string | null | undefined)[], locale: AppLocale): Promise<Map<string, MediaInfo>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map();
  const rows = await db.media.findMany({
    where: { id: { in: unique }, deletedAt: null, isScanned: true },
    include: { translations: true },
  });
  return new Map(
    rows.map((m) => [
      m.id,
      { url: `/media/${m.storageKey}`, alt: pick(m.translations, locale)?.altText ?? "", width: m.width, height: m.height },
    ]),
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────

const pageInclude = (now: Date) => ({
  translations: true,
  sections: {
    where: { isHidden: false },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    include: {
      blocks: {
        where: { ...publishedWhere(now), isHidden: false },
        orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
        include: {
          translations: true,
          items: {
            where: { isHidden: false },
            orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
            include: { translations: true },
          },
        },
      },
    },
  },
});

export const getPageByKey = cache(async (key: string) => {
  const now = new Date();
  return db.page.findFirst({ where: { key, ...publishedWhere(now) }, include: pageInclude(now) });
});

/** A page whose translation in this locale has this path. */
export const getPageByPath = cache(async (locale: AppLocale, path: string) => {
  const now = new Date();
  return db.page.findFirst({
    where: { ...publishedWhere(now), translations: { some: { locale, path } } },
    include: pageInclude(now),
  });
});

export type PublicPage = NonNullable<Awaited<ReturnType<typeof getPageByKey>>>;

export async function getSeo(entityType: "PAGE" | "OFFERING" | "EVENT", entityId: string, locale: AppLocale) {
  return db.seoMetadata.findUnique({ where: { entityType_entityId_locale: { entityType, entityId, locale } } });
}

// ── Offerings ────────────────────────────────────────────────────────────────

export const getOfferings = cache(async (opts: { featuredOnly?: boolean; limit?: number } = {}) => {
  return db.offering.findMany({
    where: { ...publishedWhere(), hasOwnPage: true, ...(opts.featuredOnly && { isFeatured: true }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: opts.limit,
    include: { translations: true },
  });
});

export const getOfferingBySlug = cache(async (locale: AppLocale, slug: string) => {
  return db.offering.findFirst({
    where: { ...publishedWhere(), hasOwnPage: true, translations: { some: { locale, slug } } },
    include: {
      translations: true,
      parent: { include: { translations: true } },
      children: { where: { ...publishedWhere(), hasOwnPage: true }, orderBy: { sortOrder: "asc" }, include: { translations: true } },
      items: {
        where: { isHidden: false },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: true },
      },
      media: { where: { isHidden: false }, orderBy: { sortOrder: "asc" }, include: { translations: true } },
      deployments: {
        where: publishedWhere(),
        orderBy: { sortOrder: "asc" },
        include: { organization: { include: { translations: true } } },
      },
    },
  });
});

// ── Events ───────────────────────────────────────────────────────────────────

export const getEvents = cache(async (limit?: number) => {
  return db.event.findMany({
    where: publishedWhere(),
    orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: limit,
    include: { translations: true },
  });
});

export const getEventBySlug = cache(async (locale: AppLocale, slug: string) => {
  return db.event.findFirst({
    where: { ...publishedWhere(), translations: { some: { locale, slug } } },
    include: {
      translations: true,
      organizations: {
        orderBy: { sortOrder: "asc" },
        include: { organization: { include: { translations: true } } },
      },
    },
  });
});

// ── People & organizations ───────────────────────────────────────────────────

export const getPeople = cache(async (group: PersonGroup) => {
  return db.person.findMany({
    where: { ...publishedWhere(), roles: { some: { group } } },
    include: { translations: true, roles: { where: { group }, include: { translations: true } } },
  }).then((rows) => rows.sort((a, b) => (a.roles[0]?.sortOrder ?? 0) - (b.roles[0]?.sortOrder ?? 0)));
});

export const getOrganizations = cache(async (kind: OrganizationKind) => {
  return db.organization.findMany({
    where: { ...publishedWhere(), kind },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
});

/**
 * Institutions running one of Xpert's apps (a published deployment), whatever
 * their kind. Used for the client logos until clients are entered as such in
 * Admin → Organizations: an organization with a live Xpert app is a client.
 */
export const getOrganizationsWithLiveApps = cache(async () => {
  const now = new Date();
  return db.organization.findMany({
    where: { ...publishedWhere(now), deployments: { some: publishedWhere(now) } },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
});

// ── Redirects ────────────────────────────────────────────────────────────────

/** Looks up an old-site URL (with or without trailing slash). */
export async function findRedirect(path: string) {
  const bare = path.replace(/\/+$/, "") || "/";
  return db.redirect.findFirst({
    where: { isActive: true, fromPath: { in: [bare, `${bare}/`] } },
  });
}

export async function countRedirectHit(id: string) {
  await db.redirect.update({ where: { id }, data: { hits: { increment: 1 } } }).catch(() => {});
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export type TestimonialCard = {
  id: string;
  quote: string;
  name: string;
  role: string | null;
  organization: string | null;
  photo: MediaInfo | null;
  logo: MediaInfo | null;
  /** The organization the logo belongs to (its alt text). */
  logoAlt?: string | null;
  /** 1–5 stars, when the client gave a rating. */
  rating: number | null;
  /** Not published or no written approval yet: only shown outside production, marked as a draft. */
  draft?: boolean;
};

/**
 * Published quotes with written approval on file, in the order set in the
 * admin. Outside production, drafts are included too (marked), so editors can
 * see how they will look before publishing.
 */
export const getTestimonials = cache(async (locale: AppLocale): Promise<TestimonialCard[]> => {
  try {
    const preview = process.env.APP_ENV !== "production";
    const rows = await db.testimonial.findMany({
      where: preview ? { deletedAt: null } : { ...publishedWhere(), hasApproval: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true, organization: { include: { translations: true } } },
    });
    // A review is matched by name to the person in Admin → People (e.g. a director): their photo,
    // their position at their own organization (affiliation) and that organization's logo fill
    // in whatever the review itself leaves empty.
    // Names are compared without dots, commas or post-nominals ("Mohd Shaahed Imran" = "Mohd. Shaahed Imran", "… Rony" = "… Rony, FCS").
    const nameKey = (v: string) =>
      v.toLowerCase().replace(/,?\s*\b(fca|fcs|fcma|acca|fcca|cfa)\b\.?/g, "").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
    const people = rows.length
      ? await db.person.findMany({
          where: { deletedAt: null },
          select: {
            photoMediaId: true,
            translations: { select: { locale: true, name: true, affiliation: true } },
            roles: { orderBy: { sortOrder: "asc" }, select: { group: true, translations: { select: { locale: true, title: true } } } },
          },
        })
      : [];
    const personOf = (r: (typeof rows)[number]) =>
      people.find((p) => p.translations.some((t) => t.locale === "en" && nameKey(t.name) === nameKey(r.personName)));
    const photoOf = (r: (typeof rows)[number]) => r.photoMediaId ?? personOf(r)?.photoMediaId ?? null;
    // Organizations named in an affiliation ("Managing Director, Apex Investments Ltd.") lend their logo.
    const orgs = await db.organization.findMany({ where: { ...publishedWhere(), logoPermission: true, logoMediaId: { not: null } }, include: { translations: true } });
    const norm = (v: string) => v.toLowerCase().replace(/&/g, " and ").replace(/[.,()'’]/g, " ").replace(/\b(limited|ltd|plc)\b/g, " ").replace(/\s+/g, " ").trim();
    const orgIn = (text: string | null | undefined) =>
      text ? orgs.find((o) => o.translations.some((t) => t.name && norm(text).includes(norm(t.name)))) ?? null : null;
    const affiliationOf = (r: (typeof rows)[number]) => {
      const p = personOf(r);
      return (p?.translations.find((t) => t.locale === locale)?.affiliation || p?.translations.find((t) => t.locale === "en")?.affiliation) ?? null;
    };
    const roleOf = (r: (typeof rows)[number]) => {
      const tr = personOf(r)?.roles[0]?.translations;
      return tr?.find((t) => t.locale === locale)?.title ?? tr?.find((t) => t.locale === "en")?.title ?? null;
    };
    const media = await mediaMap(
      rows.flatMap((r) => {
        const own = r.organization && r.organization.logoPermission ? r.organization.logoMediaId : null;
        return [photoOf(r), own ?? orgIn(affiliationOf(r))?.logoMediaId ?? null];
      }),
      locale,
    );
    return rows.flatMap((r) => {
      const tr = pick(r.translations, locale);
      if (!tr) return [];
      const org = r.organization && !r.organization.deletedAt ? r.organization : null;
      const affiliation = affiliationOf(r);
      const named = org ? null : orgIn(affiliation);
      const logoId = org?.logoPermission ? org.logoMediaId : (named?.logoMediaId ?? null);
      return [
        {
          id: r.id,
          quote: tr.quote,
          // The name as kept in Admin → People (in this language), else as written on the review.
          name: personOf(r)?.translations.find((t) => t.locale === locale)?.name ?? personOf(r)?.translations.find((t) => t.locale === "en")?.name ?? r.personName,
          // The reviewer's title: as written on the review, else their position from Admin → People.
          role: tr.personTitle || affiliation || roleOf(r),
          organization: org
            ? (pick(org.translations, locale)?.name ?? null)
            : !tr.personTitle && !affiliation && roleOf(r)
              ? // Only their role at Xpert is known (e.g. "Director"): name the company it is at.
                locale === "bn" ? "এক্সপার্ট ফিনটেক লিমিটেড" : "Xpert Fintech Ltd."
              : null,
          photo: media.get(photoOf(r) ?? "") ?? null,
          logo: logoId ? (media.get(logoId) ?? null) : null,
          logoAlt: org ? (pick(org.translations, locale)?.name ?? null) : named ? (pick(named.translations, locale)?.name ?? null) : null,
          rating: r.rating && r.rating >= 1 && r.rating <= 5 ? r.rating : null,
          draft: preview && editorHints() && !(r.status === "PUBLISHED" && r.hasApproval && (!r.publishAt || r.publishAt <= new Date())),
        },
      ];
    });
  } catch (error) {
    console.error("[testimonials] could not load", error);
    return [];
  }
});
