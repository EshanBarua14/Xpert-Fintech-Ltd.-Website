import "server-only";
import { cache } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import { getOfferings, getOrganizations, mediaMap } from "./content";
import { pick } from "./text";

export type MemberLogo = { url: string; width: number | null; height: number | null };
export type Member = { id: string; name: string; shortName: string | null; websiteUrl: string | null; logo: MemberLogo | null };

/** Real data the flagship sections show: consortium members, exchanges, published products. */
export const getFlagshipData = cache(async (locale: AppLocale) => {
  const [members, exchanges, offerings] = await Promise.all([
    getOrganizations("CONSORTIUM_MEMBER"),
    getOrganizations("EXCHANGE"),
    getOfferings(),
  ]);
  // A logo is shown only when it is uploaded AND written permission is on file.
  const logos = await mediaMap(
    [...members, ...exchanges].map((o) => (o.logoPermission ? o.logoMediaId : null)),
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
  const publishedSlugs = new Set<string>();
  for (const o of offerings) {
    const tr = pick(o.translations, locale);
    if (tr) publishedSlugs.add(tr.slug);
  }
  return {
    members: members.map(toMember).filter((m) => m.name),
    exchanges: exchanges.map(toMember).filter((e) => e.name),
    offerings,
    publishedSlugs,
  };
});
