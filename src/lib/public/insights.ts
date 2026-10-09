import "server-only";
import { contentSlots } from "@/lib/env/hints";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { mediaMap, type MediaInfo } from "./content";
import { parseVideoUrl, pick } from "./text";

// ── News ─────────────────────────────────────────────────────────────────────

export type ArticleCardData = {
  id: string;
  href: string;
  title: string;
  excerpt: string | null;
  date: Date;
  category: string | null;
  categorySlug: string | null;
  author: string | null;
  cover: MediaInfo | null;
  minutes: number;
};

const articleInclude = {
  translations: true,
  category: { include: { translations: true } },
  tags: { include: { tag: { include: { translations: true } } } },
} as const;

type ArticleRow = Awaited<ReturnType<typeof loadArticles>>[number];

function loadArticles(categoryId?: string | null) {
  return db.article.findMany({
    where: { ...publishedWhere(), ...(categoryId && { categoryId }) },
    orderBy: [{ displayDate: { sort: "desc", nulls: "last" } }, { publishAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: articleInclude,
  });
}

/** About 200 words a minute, at least one. */
export function readingMinutes(text: string | null | undefined) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function toCard(a: ArticleRow, locale: AppLocale, covers: Map<string, MediaInfo>): ArticleCardData | null {
  const tr = pick(a.translations, locale);
  if (!tr) return null;
  const own = a.translations.find((x) => x.locale === locale);
  const cat = a.category ? pick(a.category.translations, locale) : null;
  return {
    id: a.id,
    href: `/${own ? locale : "en"}/news/${(own ?? tr).slug}`,
    title: tr.title,
    excerpt: tr.excerpt ?? tr.subtitle,
    date: a.displayDate ?? a.publishAt ?? a.createdAt,
    category: cat?.name ?? null,
    categorySlug: cat?.slug ?? null,
    author: a.authorName,
    cover: covers.get(a.coverMediaId ?? "") ?? null,
    minutes: readingMinutes(tr.body),
  };
}

/** Published articles as cards, newest first; optionally one category (by slug). */
export const getArticleCards = cache(async (locale: AppLocale, categorySlug?: string | null, limit?: number) => {
  const category = categorySlug
    ? await db.articleCategoryTranslation.findFirst({ where: { slug: categorySlug }, select: { categoryId: true } })
    : null;
  if (categorySlug && !category) return [];
  const rows = await loadArticles(category?.categoryId);
  const covers = await mediaMap(rows.map((r) => r.coverMediaId), locale);
  const cards = rows.map((r) => toCard(r, locale, covers)).filter((c): c is ArticleCardData => c !== null);
  return limit ? cards.slice(0, limit) : cards;
});

/** Categories that have at least one published article. */
export const getNewsCategories = cache(async (locale: AppLocale) => {
  const cats = await db.articleCategory.findMany({
    where: { articles: { some: publishedWhere() } },
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
  return cats
    .map((c) => {
      const tr = pick(c.translations, locale);
      return tr ? { id: c.id, slug: tr.slug, name: tr.name } : null;
    })
    .filter((c): c is { id: string; slug: string; name: string } => c !== null);
});

export const getArticleBySlug = cache(async (locale: AppLocale, slug: string) => {
  const a = await db.article.findFirst({
    where: { ...publishedWhere(), translations: { some: { locale, slug } } },
    include: articleInclude,
  });
  if (!a) return null;
  const tr = pick(a.translations, locale)!;
  const covers = await mediaMap([a.coverMediaId], locale);
  const tags = a.tags
    .map((at) => pick(at.tag.translations, locale)?.name)
    .filter((x): x is string => Boolean(x));
  // Related: same category first, then the latest others.
  const others = (await loadArticles()).filter((r) => r.id !== a.id);
  const ranked = [...others.filter((r) => a.categoryId && r.categoryId === a.categoryId), ...others.filter((r) => !a.categoryId || r.categoryId !== a.categoryId)];
  const relatedCovers = await mediaMap(ranked.slice(0, 3).map((r) => r.coverMediaId), locale);
  const related = ranked
    .slice(0, 3)
    .map((r) => toCard(r, locale, relatedCovers))
    .filter((c): c is ArticleCardData => c !== null);
  return { article: a, tr, card: toCard(a, locale, covers)!, tags, related };
});

// ── Careers ──────────────────────────────────────────────────────────────────

export type JobCard = {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  department: string | null;
  location: string | null;
  employmentType: string;
  experience: string | null;
  deadline: Date | null;
  open: boolean;
};

/** Open today if not marked closed and the deadline (end of that day) has not passed. */
function isOpen(c: { isClosed: boolean; deadline: Date | null }, now = new Date()) {
  return !c.isClosed && (!c.deadline || c.deadline.getTime() + 24 * 60 * 60 * 1000 > now.getTime());
}

export const getJobs = cache(async (locale: AppLocale): Promise<JobCard[]> => {
  const rows = await db.career.findMany({
    where: publishedWhere(),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { translations: true },
  });
  const now = new Date();
  return rows
    .map((c): JobCard | null => {
      const tr = pick(c.translations, locale);
      if (!tr) return null;
      const own = c.translations.find((x) => x.locale === locale);
      return {
        id: c.id,
        href: `/${own ? locale : "en"}/careers/${(own ?? tr).slug}`,
        title: tr.title,
        summary: tr.summary,
        department: c.department,
        location: c.location,
        employmentType: c.employmentType,
        experience: c.experience,
        deadline: c.deadline,
        open: isOpen(c, now),
      };
    })
    .filter((j): j is JobCard => j !== null)
    .sort((a, b) => Number(b.open) - Number(a.open));
});

export const getJobBySlug = cache(async (locale: AppLocale, slug: string) => {
  const c = await db.career.findFirst({ where: { ...publishedWhere(), translations: { some: { locale, slug } } }, include: { translations: true } });
  if (!c) return null;
  return { career: c, tr: pick(c.translations, locale)!, open: isOpen(c) };
});

/** "a\nb\n- c" → ["a", "b", "c"]: one bullet per line, leading dashes/bullets removed. */
export function lines(text: string | null | undefined) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export type GalleryPhoto = { id: string; url: string; alt: string; width: number | null; height: number | null };
export type Album = {
  id: string;
  kind: "album" | "event";
  title: string;
  description: string | null;
  href: string;
  date: Date | null;
  approx: boolean;
  cover: GalleryPhoto | null;
  photos: GalleryPhoto[];
};

const toPhoto = (id: string, m: MediaInfo | undefined, fallbackAlt: string): GalleryPhoto | null =>
  m ? { id, url: m.url, alt: m.alt || fallbackAlt, width: m.width, height: m.height } : null;

/**
 * Every album in the gallery, newest first: photo albums from Admin → Photo
 * albums, and every published event that has photos.
 */
export const getAlbums = cache(async (locale: AppLocale): Promise<Album[]> => {
  const [events, albums] = await Promise.all([
    db.event.findMany({
      where: { ...publishedWhere(), gallery: { some: {} } },
      include: { translations: true, gallery: { orderBy: { sortOrder: "asc" } } },
    }),
    db.album.findMany({
      where: { ...publishedWhere(), photos: { some: {} } },
      include: { translations: true, photos: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  const media = await mediaMap(
    [...events.flatMap((r) => r.gallery.map((g) => g.mediaId)), ...albums.flatMap((a) => [a.coverMediaId, ...a.photos.map((p) => p.mediaId)])],
    locale,
  );
  const out: (Album & { sort: number })[] = [];
  for (const e of events) {
    const tr = pick(e.translations, locale);
    if (!tr) continue;
    const own = e.translations.find((x) => x.locale === locale);
    const photos = e.gallery.map((g) => toPhoto(g.id, media.get(g.mediaId), tr.title)).filter((p): p is GalleryPhoto => p !== null);
    if (!photos.length) continue;
    out.push({
      id: e.id,
      kind: "event",
      title: tr.title,
      description: tr.summary ?? null,
      href: `/${own ? locale : "en"}/events/${(own ?? tr).slug}#gallery`,
      date: e.startsAt,
      approx: e.dateIsApprox,
      cover: photos[0] ?? null,
      photos,
      sort: (e.startsAt ?? e.createdAt).getTime(),
    });
  }
  for (const a of albums) {
    const tr = pick(a.translations, locale);
    if (!tr) continue;
    const own = a.translations.find((x) => x.locale === locale);
    const photos = a.photos.map((p) => toPhoto(p.id, media.get(p.mediaId), tr.title)).filter((p): p is GalleryPhoto => p !== null);
    if (!photos.length) continue;
    const cover = (a.coverMediaId && toPhoto(a.coverMediaId, media.get(a.coverMediaId), tr.title)) || photos[0] || null;
    out.push({
      id: a.id,
      kind: "album",
      title: tr.title,
      description: tr.description ?? null,
      href: `/${own ? locale : "en"}/gallery/${(own ?? tr).slug}`,
      date: a.takenAt,
      approx: false,
      cover,
      photos,
      sort: (a.takenAt ?? a.createdAt).getTime() - a.sortOrder,
    });
  }
  return out.sort((x, y) => y.sort - x.sort).map(({ sort: _sort, ...album }) => album);
});

/** One photo album with its photos, by slug in this language (or English). */
export const getAlbumBySlug = cache(async (locale: AppLocale, slug: string) => {
  const album = await db.album.findFirst({
    where: { ...publishedWhere(), translations: { some: { slug, locale: { in: [locale, "en"] } } } },
    include: { translations: true, photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!album) return null;
  const tr = pick(album.translations, locale);
  if (!tr) return null;
  const media = await mediaMap(album.photos.map((p) => p.mediaId), locale);
  const photos = album.photos.map((p) => toPhoto(p.id, media.get(p.mediaId), tr.title)).filter((p): p is GalleryPhoto => p !== null);
  if (!photos.length) return null;
  return { album, tr, photos };
});

// ── Videos ───────────────────────────────────────────────────────────────────

export type GalleryVideo = {
  id: string;
  title: string;
  description: string | null;
  provider: "UPLOAD" | "YOUTUBE" | "VIMEO" | "FACEBOOK";
  /** iframe player for linked videos. */
  embedUrl: string | null;
  /** Our own file for uploaded videos. */
  file: { url: string; type: string } | null;
  poster: string | null;
  date: Date | null;
  durationSec: number | null;
  featured: boolean;
  event: { title: string; href: string } | null;
};

/**
 * Every video in the gallery: Admin → Videos, plus the video of any published
 * event that is not already listed there. Featured first, then newest.
 */
export const getVideos = cache(async (locale: AppLocale): Promise<GalleryVideo[]> => {
  const [rows, events] = await Promise.all([
    db.video.findMany({
      where: publishedWhere(),
      orderBy: [{ isFeatured: "desc" }, { recordedAt: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true, event: { include: { translations: true } } },
    }),
    db.event.findMany({
      where: { ...publishedWhere(), videoUrl: { not: null } },
      orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      include: { translations: true },
    }),
  ]);
  const media = await mediaMap([...rows.flatMap((r) => [r.mediaId, r.posterMediaId]), ...events.map((e) => e.coverMediaId)], locale);
  const files = await db.media.findMany({
    where: { id: { in: rows.map((r) => r.mediaId).filter((x): x is string => Boolean(x)) }, kind: "VIDEO", deletedAt: null },
    select: { id: true, storageKey: true, mimeType: true },
  });
  const fileById = new Map<string, { id: string; storageKey: string; mimeType: string }>(files.map((f) => [f.id, f]));
  const eventLink = (e: { translations: { locale: string; slug: string; title: string }[] }) => {
    const tr = pick(e.translations, locale);
    if (!tr) return null;
    const own = e.translations.find((x) => x.locale === locale);
    return { title: tr.title, href: `/${own ? locale : "en"}/events/${(own ?? tr).slug}` };
  };

  const out: GalleryVideo[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const tr = pick(r.translations, locale);
    if (!tr) continue;
    const link = r.provider === "UPLOAD" ? null : parseVideoUrl(r.url);
    const f = r.mediaId ? fileById.get(r.mediaId) : undefined;
    if (!link && !f) continue;
    if (r.url) seen.add(r.url);
    out.push({
      id: r.id,
      title: tr.title,
      description: tr.description ?? null,
      provider: r.provider,
      embedUrl: link?.embedUrl ?? null,
      file: f ? { url: `/media/${f.storageKey}`, type: f.mimeType } : null,
      poster: (r.posterMediaId && media.get(r.posterMediaId)?.url) || link?.thumbnail || null,
      date: r.recordedAt,
      durationSec: r.durationSec,
      featured: r.isFeatured,
      event: r.event && !r.event.deletedAt ? eventLink(r.event) : null,
    });
  }
  for (const e of events) {
    if (!e.videoUrl || seen.has(e.videoUrl)) continue;
    const link = parseVideoUrl(e.videoUrl);
    const ev = eventLink(e);
    if (!link || !ev) continue;
    out.push({
      id: `event-${e.id}`,
      title: ev.title,
      description: null,
      provider: link.provider,
      embedUrl: link.embedUrl,
      file: null,
      poster: link.thumbnail || (e.coverMediaId && media.get(e.coverMediaId)?.url) || null,
      date: e.startsAt,
      durationSec: null,
      featured: false,
      event: ev,
    });
  }
  return out;
});

/** One event's photos, in order. */
export async function getEventPhotos(eventId: string, title: string, locale: AppLocale): Promise<GalleryPhoto[]> {
  const rows = await db.eventMedia.findMany({ where: { eventId }, orderBy: { sortOrder: "asc" } });
  const media = await mediaMap(rows.map((r) => r.mediaId), locale);
  return rows
    .map((r) => {
      const m = media.get(r.mediaId);
      return m ? { id: r.id, url: m.url, alt: m.alt || title, width: m.width, height: m.height } : null;
    })
    .filter((p): p is GalleryPhoto => p !== null);
}

// ── Resources ────────────────────────────────────────────────────────────────

export type ResourceCard = { id: string; kind: string; title: string; summary: string | null; href: string | null; external: boolean; cover: MediaInfo | null; sizeKb: number | null };

export const getResources = cache(async (locale: AppLocale): Promise<ResourceCard[]> => {
  const rows = await db.resource.findMany({ where: publishedWhere(), orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { translations: true } });
  const files = await db.media.findMany({
    where: { id: { in: rows.map((r) => r.fileMediaId).filter((x): x is string => Boolean(x)) }, deletedAt: null, NOT: { tags: { has: "private" } } },
    select: { id: true, storageKey: true, sizeBytes: true },
  });
  const fileById = new Map<string, { id: string; storageKey: string; sizeBytes: number }>(files.map((f) => [f.id, f]));
  const covers = await mediaMap(rows.map((r) => r.coverMediaId), locale);
  return rows
    .map((r): ResourceCard | null => {
      const tr = pick(r.translations, locale);
      if (!tr) return null;
      const file = r.fileMediaId ? fileById.get(r.fileMediaId) : undefined;
      const href = file ? `/media/${file.storageKey}` : r.externalUrl;
      return { id: r.id, kind: r.kind, title: tr.title, summary: tr.summary, href, external: !file && Boolean(r.externalUrl), cover: covers.get(r.coverMediaId ?? "") ?? null, sizeKb: file ? Math.max(1, Math.round(file.sizeBytes / 1024)) : null };
    })
    .filter((r): r is ResourceCard => r !== null && r.href !== null);
});

// ── Case studies ─────────────────────────────────────────────────────────────

/** Outside the live site, draft case studies are shown too (marked), so editors can review them before publishing. */
const caseWhere = () => (contentSlots() ? { deletedAt: null } : publishedWhere());

export const getCaseStudies = cache(async (locale: AppLocale) => {
  const rows = await db.caseStudy.findMany({ where: caseWhere(), orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { translations: true } });
  const covers = await mediaMap(rows.map((r) => r.coverMediaId), locale);
  return rows
    .map((c) => {
      const tr = pick(c.translations, locale);
      if (!tr) return null;
      const own = c.translations.find((x) => x.locale === locale);
      return { id: c.id, title: tr.title, summary: tr.summary, href: `/${own ? locale : "en"}/case-studies/${(own ?? tr).slug}`, cover: covers.get(c.coverMediaId ?? "") ?? null, draft: c.status !== "PUBLISHED" };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
});

export const getCaseStudyBySlug = cache(async (locale: AppLocale, slug: string) => {
  const c = await db.caseStudy.findFirst({ where: { ...caseWhere(), translations: { some: { locale, slug } } }, include: { translations: true } });
  if (!c) return null;
  const covers = await mediaMap([c.coverMediaId], locale);
  return { caseStudy: c, tr: pick(c.translations, locale)!, cover: covers.get(c.coverMediaId ?? "") ?? null };
});
