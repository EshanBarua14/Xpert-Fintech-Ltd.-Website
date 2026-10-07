import "server-only";
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
    const media = await mediaMap(
      rows.flatMap((r) => [r.photoMediaId, r.organization?.logoPermission ? r.organization.logoMediaId : null]),
      locale,
    );
    return rows.flatMap((r) => {
      const tr = pick(r.translations, locale);
      if (!tr) return [];
      const org = r.organization && !r.organization.deletedAt ? r.organization : null;
      return [
        {
          id: r.id,
          quote: tr.quote,
          name: r.personName,
          role: tr.personTitle,
          organization: org ? (pick(org.translations, locale)?.name ?? null) : null,
          photo: media.get(r.photoMediaId ?? "") ?? null,
          logo: org?.logoPermission ? (media.get(org.logoMediaId ?? "") ?? null) : null,
          draft: preview && !(r.status === "PUBLISHED" && r.hasApproval && (!r.publishAt || r.publishAt <= new Date())),
        },
      ];
    });
  } catch (error) {
    console.error("[testimonials] could not load", error);
    return [];
  }
});
