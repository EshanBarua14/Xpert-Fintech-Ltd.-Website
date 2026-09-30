import "server-only";
import { cache } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import { getOfferings, getOrganizations } from "./content";
import { pick } from "./text";

/** Real data the flagship sections show: consortium members, exchanges, published products. */
export const getFlagshipData = cache(async (locale: AppLocale) => {
  const [members, exchanges, offerings] = await Promise.all([
    getOrganizations("CONSORTIUM_MEMBER"),
    getOrganizations("EXCHANGE"),
    getOfferings(),
  ]);
  const name = (o: (typeof members)[number]) => pick(o.translations, locale)?.name ?? "";
  const publishedSlugs = new Set<string>();
  for (const o of offerings) {
    const tr = pick(o.translations, locale);
    if (tr) publishedSlugs.add(tr.slug);
  }
  return {
    members: members.map((m) => ({ id: m.id, name: name(m), websiteUrl: m.websiteUrl })).filter((m) => m.name),
    exchanges: exchanges.map((e) => ({ id: e.id, name: name(e), websiteUrl: e.websiteUrl })).filter((e) => e.name),
    offerings,
    publishedSlugs,
  };
});
