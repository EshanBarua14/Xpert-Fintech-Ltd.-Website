import "server-only";
import { cache } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import { getOfferings, getOrganizations, getOrganizationsWithLiveApps, mediaMap } from "./content";
import { pick } from "./text";

export type MemberLogo = { url: string; width: number | null; height: number | null };
export type Member = { id: string; name: string; shortName: string | null; websiteUrl: string | null; logo: MemberLogo | null };

export const PARTY_KEYS = ["dse", "cse", "bsec", "cdbl"] as const;
export type PartyKey = (typeof PARTY_KEYS)[number];

/**
 * Logos of the market's institutions (DSE, CSE, BSEC, CDBL), by the key of
 * their organization in Admin → Organizations. Like every logo, shown only
 * when uploaded AND written permission is ticked; missing ones are left out.
 */
export const getPartyLogos = cache(async (locale: AppLocale): Promise<Partial<Record<PartyKey, MemberLogo>>> => {
  const rows = await db.organization
    .findMany({ where: { ...publishedWhere(), key: { in: [...PARTY_KEYS] }, logoPermission: true, logoMediaId: { not: null } }, select: { key: true, logoMediaId: true } })
    .catch(() => []);
  const media = await mediaMap(rows.map((r) => r.logoMediaId), locale);
  const out: Partial<Record<PartyKey, MemberLogo>> = {};
  for (const r of rows) {
    const m = r.logoMediaId ? media.get(r.logoMediaId) : undefined;
    if (m && r.key) out[r.key as PartyKey] = { url: m.url, width: m.width, height: m.height };
  }
  return out;
});

/** Real data the flagship sections show: consortium members, exchanges, published products. */
export const getFlagshipData = cache(async (locale: AppLocale) => {
  const [members, exchanges, clientRows, offerings] = await Promise.all([
    getOrganizations("CONSORTIUM_MEMBER"),
    getOrganizations("EXCHANGE"),
    getOrganizations("CLIENT"),
    getOfferings(),
  ]);
  // Clients: the consortium brokerages (they run Xpert's platform), the
  // organizations entered as "Client" in Admin → Organizations, and any other
  // institution running a live Xpert app. Each once, members first.
  const withApps = await getOrganizationsWithLiveApps();
  const seen = new Set<string>();
  const clients = [...members, ...clientRows, ...withApps].filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
  // A logo is shown only when it is uploaded AND written permission is on file.
  const logos = await mediaMap(
    [...members, ...exchanges, ...clients].map((o) => (o.logoPermission ? o.logoMediaId : null)),
    locale,
  );
  const toMember = (o: (typeof members)[number]): Member => {
    const tr = pick(o.translations, locale);
    const logo = o.logoPermission && o.logoMediaId ? logos.get(o.logoMediaId) : undefined;
    return {
      id: o.id,
      name: tr?.name ?? "",
      shortName: tr?.shortName ?? null,
      websiteUrl: o.websiteUrl,
      logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : null,
    };
  };
  const parties = await getPartyLogos(locale);
  const publishedSlugs = new Set<string>();
  for (const o of offerings) {
    const tr = pick(o.translations, locale);
    if (tr) publishedSlugs.add(tr.slug);
  }
  const memberCards = members.map(toMember).filter((m) => m.name);
  return {
    members: memberCards,
    /** For the ecosystem map: institution logos, and the brokerages running Xpert. */
    logos: {
      parties,
      members: memberCards.filter((m) => m.logo).map((m) => ({ ...m.logo!, name: m.name })),
    },
    exchanges: exchanges.map(toMember).filter((e) => e.name),
    clients: clients.map(toMember).filter((c) => c.name),
    offerings,
    publishedSlugs,
  };
});

export type FlowProduct = { name: string; href: string; logo: MemberLogo | null };

/**
 * Published products by key (e.g. "rms"), with their name, page and logo
 * (Admin → Products → Product logo), for the order-flow story.
 */
export const getFlowProducts = cache(async (locale: AppLocale): Promise<Record<string, FlowProduct>> => {
  const offerings = await getOfferings();
  const icons = await mediaMap(offerings.map((o) => o.iconMediaId), locale);
  const out: Record<string, FlowProduct> = {};
  for (const o of offerings) {
    const tr = pick(o.translations, locale);
    if (!o.key || !tr) continue;
    const own = o.translations.find((x) => x.locale === locale);
    const icon = o.iconMediaId ? icons.get(o.iconMediaId) : undefined;
    out[o.key] = {
      name: tr.name,
      href: `/${own ? locale : "en"}/products/${(own ?? tr).slug}`,
      logo: icon ? { url: icon.url, width: icon.width, height: icon.height } : null,
    };
  }
  return out;
});

export type OrgLogoEntry = { names: string[]; name: string; logo: MemberLogo };

const normOrg = (v: string) =>
  v.toLowerCase().replace(/&/g, " and ").replace(/[.,()'’]/g, " ").replace(/\b(limited|ltd|plc)\b/g, " ").replace(/\s+/g, " ").trim();

/** Published organizations whose logo may be shown, with every name they go by (EN, BN, short names). */
export const getOrgLogos = cache(async (locale: AppLocale): Promise<OrgLogoEntry[]> => {
  const rows = await db.organization
    .findMany({ where: { ...publishedWhere(), logoPermission: true, logoMediaId: { not: null } }, include: { translations: true } })
    .catch(() => []);
  const media = await mediaMap(rows.map((r) => r.logoMediaId), locale);
  return rows.flatMap((r) => {
    const m = r.logoMediaId ? media.get(r.logoMediaId) : undefined;
    const tr = pick(r.translations, locale);
    if (!m || !tr) return [];
    const names = r.translations.flatMap((t) => [t.name, t.shortName]).filter((n): n is string => Boolean(n && n.trim().length > 3)).map(normOrg);
    return [{ names, name: tr.name, logo: { url: m.url, width: m.width, height: m.height } }];
  });
});

/** The organization named in a text such as "CEO, UCB Stock Brokerage Limited" (longest name wins). */
export function orgForText(orgs: OrgLogoEntry[], text: string | null | undefined) {
  if (!text) return null;
  const t = normOrg(text);
  let best: OrgLogoEntry | null = null;
  let len = 0;
  for (const o of orgs) for (const n of o.names) if (n && t.includes(n) && n.length > len) { best = o; len = n.length; }
  return best ? { name: best.name, logo: best.logo } : null;
}
