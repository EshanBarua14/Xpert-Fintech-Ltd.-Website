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
