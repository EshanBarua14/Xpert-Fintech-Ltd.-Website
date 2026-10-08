import "server-only";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { getMarketPayload } from "@/lib/market/data";
import { pick } from "./text";

export type SearchHit = { kind: SearchKind; title: string; subtitle: string | null; href: string };
export type SearchKind = "product" | "page" | "news" | "event" | "person" | "organization" | "career" | "caseStudy" | "resource" | "album" | "video" | "symbol";

const PER_KIND = 6;

/**
 * Searches published content in the visitor's language (English as fallback):
 * products, pages, news, events, people, member and client organisations,
 * careers, case studies, resources, albums, videos, and market symbols from
 * the live data. Case-insensitive "contains" matching keeps it simple and
 * fast for a site of this size; only published, non-trashed records match.
 */
export async function searchSite(locale: AppLocale, raw: string): Promise<SearchHit[]> {
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return [];
  const now = new Date();
  const live = publishedWhere(now);
  const like = { contains: q, mode: "insensitive" as const };
  const langs = { in: [locale, "en"] as AppLocale[] };
  const prefer = <T extends { locale: string }>(rows: T[]) => pick(rows, locale);
  const href = (path: string, own: boolean) => `/${own ? locale : "en"}/${path}`;

  const [offerings, pages, articles, events, people, orgs, careers, cases, resources, albums, videos, market] = await Promise.all([
    db.offering.findMany({
      where: { ...live, hasOwnPage: true, translations: { some: { locale: langs, OR: [{ name: like }, { tagline: like }, { summary: like }] } } },
      include: { translations: true },
      take: PER_KIND,
    }),
    db.page.findMany({
      where: { ...live, showInSearch: true, translations: { some: { locale: langs, OR: [{ title: like }, { intro: like }] } } },
      include: { translations: true },
      take: PER_KIND,
    }),
    db.article.findMany({
      where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { excerpt: like }, { body: like }] } } },
      include: { translations: true },
      orderBy: [{ displayDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: PER_KIND,
    }),
    db.event.findMany({
      where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { summary: like }] } } },
      include: { translations: true },
      orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }],
      take: PER_KIND,
    }),
    db.person.findMany({
      where: { ...live, OR: [{ translations: { some: { locale: langs, name: like } } }, { roles: { some: { translations: { some: { locale: langs, title: like } } } } }] },
      include: { translations: true, roles: { include: { translations: true } } },
      take: PER_KIND,
    }),
    db.organization.findMany({
      where: { ...live, kind: { in: ["CONSORTIUM_MEMBER", "CLIENT", "EXCHANGE"] }, translations: { some: { locale: langs, OR: [{ name: like }, { shortName: like }] } } },
      include: { translations: true },
      take: PER_KIND,
    }),
    db.career.findMany({
      where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { summary: like }] } } },
      include: { translations: true },
      take: PER_KIND,
    }),
    db.caseStudy.findMany({ where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { summary: like }] } } }, include: { translations: true }, take: PER_KIND }),
    db.resource.findMany({ where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { summary: like }] } } }, include: { translations: true }, take: PER_KIND }),
    db.album.findMany({ where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { description: like }] } } }, include: { translations: true }, take: PER_KIND }),
    db.video.findMany({ where: { ...live, translations: { some: { locale: langs, OR: [{ title: like }, { description: like }] } } }, include: { translations: true }, take: PER_KIND }),
    /^[A-Za-z0-9&-]{2,24}$/.test(q) ? getMarketPayload().catch(() => null) : Promise.resolve(null),
  ]);

  const hits: SearchHit[] = [];
  for (const o of offerings) {
    const tr = prefer(o.translations);
    if (tr) hits.push({ kind: "product", title: tr.name, subtitle: tr.tagline, href: href(`products/${tr.slug}`, tr.locale === locale) });
  }
  for (const p of pages) {
    const tr = prefer(p.translations);
    if (tr) hits.push({ kind: "page", title: tr.title, subtitle: tr.intro, href: href(tr.path, tr.locale === locale) });
  }
  for (const a of articles) {
    const tr = prefer(a.translations);
    if (tr) hits.push({ kind: "news", title: tr.title, subtitle: tr.excerpt ?? tr.subtitle, href: href(`news/${tr.slug}`, tr.locale === locale) });
  }
  for (const e of events) {
    const tr = prefer(e.translations);
    if (tr) hits.push({ kind: "event", title: tr.title, subtitle: tr.summary, href: href(`events/${tr.slug}`, tr.locale === locale) });
  }
  for (const p of people) {
    const tr = prefer(p.translations);
    const role = p.roles[0];
    if (!tr || !role) continue;
    const page = role.group === "BOARD" ? "company/board" : role.group === "MANAGEMENT" ? "company/management" : role.group === "CONSULTANT" ? "company/consultants" : "company/team";
    hits.push({ kind: "person", title: tr.name, subtitle: prefer(role.translations)?.title ?? null, href: `/${locale}/${page}` });
  }
  for (const o of orgs) {
    const tr = prefer(o.translations);
    if (tr) hits.push({ kind: "organization", title: tr.name, subtitle: null, href: o.kind === "CONSORTIUM_MEMBER" ? `/${locale}/consortium` : o.kind === "CLIENT" ? `/${locale}#clients` : `/${locale}/markets` });
  }
  for (const c of careers) {
    const tr = prefer(c.translations);
    if (tr) hits.push({ kind: "career", title: tr.title, subtitle: tr.summary, href: href(`careers/${tr.slug}`, tr.locale === locale) });
  }
  for (const c of cases) {
    const tr = prefer(c.translations);
    if (tr) hits.push({ kind: "caseStudy", title: tr.title, subtitle: tr.summary, href: href(`case-studies/${tr.slug}`, tr.locale === locale) });
  }
  for (const r of resources) {
    const tr = prefer(r.translations);
    if (tr) hits.push({ kind: "resource", title: tr.title, subtitle: tr.summary, href: `/${locale}/resources` });
  }
  for (const a of albums) {
    const tr = prefer(a.translations);
    if (tr) hits.push({ kind: "album", title: tr.title, subtitle: tr.description, href: href(`gallery/${tr.slug}`, tr.locale === locale) });
  }
  for (const v of videos) {
    const tr = prefer(v.translations);
    if (tr) hits.push({ kind: "video", title: tr.title, subtitle: tr.description, href: `/${locale}/gallery#video-${v.id}` });
  }
  const sym = q.toUpperCase();
  for (const ex of market?.snapshot?.exchanges ?? []) {
    for (const quote of ex.quotes.filter((x) => x.symbol.startsWith(sym)).slice(0, 4)) {
      hits.push({ kind: "symbol", title: quote.symbol, subtitle: ex.exchange, href: `/${locale}/markets/${ex.exchange.toLowerCase()}/${encodeURIComponent(quote.symbol)}` });
    }
  }
  // Titles that start with the query first, then the rest, keeping each kind's order.
  const starts = (h: SearchHit) => (h.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1);
  return hits
    .map((h, i) => ({ h, i }))
    .sort((a, b) => starts(a.h) - starts(b.h) || a.i - b.i)
    .map(({ h }) => ({ ...h, subtitle: h.subtitle ? h.subtitle.replace(/\s+/g, " ").slice(0, 140) : null }));
}
