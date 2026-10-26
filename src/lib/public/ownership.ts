import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { getOwnershipSetting } from "@/lib/content/highlights";
import { getOrganizations, mediaMap } from "./content";
import { pick } from "./text";

export type OwnerBasis = "BANK" | "INSURANCE" | "CORPORATE" | "FAMILY" | "INDEPENDENT" | "OTHER";
export type OwnerHouse = { name: string; parent: string | null; url: string | null; logo: { url: string; width: number | null; height: number | null } | null };
export type OwnerGroup = { basis: OwnerBasis; label: string; blurb: string; houses: OwnerHouse[] };
export type OwnershipView = {
  title: string;
  intro: string;
  capital: { crore: number; source: string; asOf: string | null } | null;
  groups: OwnerGroup[];
  houses: number;
  parents: number;
  board: number;
};

const LABELS: Record<OwnerBasis, { en: [string, string]; bn: [string, string] }> = {
  BANK: { en: ["Bank subsidiaries", "Brokerage arms of the country's banks."], bn: ["ব্যাংকের সাবসিডিয়ারি", "দেশের ব্যাংকগুলোর ব্রোকারেজ প্রতিষ্ঠান।"] },
  INSURANCE: { en: ["Insurance companies", "Brokerage arms of insurers."], bn: ["বিমা প্রতিষ্ঠান", "বিমা প্রতিষ্ঠানগুলোর ব্রোকারেজ প্রতিষ্ঠান।"] },
  CORPORATE: { en: ["Corporate groups", "Brokerage houses of corporate groups."], bn: ["করপোরেট গ্রুপ", "করপোরেট গ্রুপগুলোর ব্রোকারেজ হাউস।"] },
  FAMILY: { en: ["Family Owned Brokers", "Brokerage houses owned by their founding families."], bn: ["পারিবারিক মালিকানার ব্রোকার", "প্রতিষ্ঠাতা পরিবারের মালিকানাধীন ব্রোকারেজ হাউস।"] },
  INDEPENDENT: { en: ["Independent houses", "Brokerage houses owned on their own."], bn: ["স্বতন্ত্র হাউস", "নিজস্ব মালিকানার ব্রোকারেজ হাউস।"] },
  OTHER: { en: ["Other owner houses", "Brokerage houses among the owners."], bn: ["অন্যান্য মালিক হাউস", "মালিকদের মধ্যে থাকা ব্রোকারেজ হাউস।"] },
};
const ORDER: OwnerBasis[] = ["BANK", "INSURANCE", "CORPORATE", "FAMILY", "INDEPENDENT", "OTHER"];

/**
 * "Who owns Xpert Fintech", all from the admin: paid-up capital (Admin → Home
 * highlights), the consortium houses grouped by who owns them (Admin →
 * Organizations → Owned by, with the parent's name) and the board size
 * (Admin → People). Null when unpublished or nothing to show.
 */
export const getOwnership = cache(async (locale: AppLocale, { drafts = false } = {}): Promise<OwnershipView | null> => {
  const s = await getOwnershipSetting();
  if (!s.published && !drafts) return null;
  const [orgs, board] = await Promise.all([
    getOrganizations("CONSORTIUM_MEMBER"),
    db.person.count({ where: { ...publishedWhere(), isPlaceholder: false, roles: { some: { group: "BOARD" } } } }).catch(() => 0),
  ]);
  const logos = await mediaMap(orgs.map((o) => (o.logoPermission ? o.logoMediaId : null)), locale);
  const bn = locale === "bn";
  const by = new Map<OwnerBasis, OwnerHouse[]>();
  const parents = new Set<string>();
  for (const o of orgs) {
    const tr = pick(o.translations, locale);
    if (!tr?.name) continue;
    const basis = (ORDER as string[]).includes(o.parentType ?? "") ? (o.parentType as OwnerBasis) : "OTHER";
    const parent = (bn && o.parentNameBn) || o.parentName || null;
    if (o.parentName && basis !== "INDEPENDENT") parents.add(o.parentName.trim().toLowerCase());
    const logo = o.logoPermission && o.logoMediaId ? logos.get(o.logoMediaId) : undefined;
    const list = by.get(basis) ?? [];
    list.push({ name: tr.name, parent, url: o.websiteUrl, logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : null });
    by.set(basis, list);
  }
  const groups = ORDER.filter((b) => by.get(b)?.length).map((b) => ({ basis: b, label: LABELS[b][bn ? "bn" : "en"][0], blurb: LABELS[b][bn ? "bn" : "en"][1], houses: by.get(b)! }));
  const houses = groups.reduce((n, g) => n + g.houses.length, 0);
  if (!houses && s.capitalCrore === null) return null;
  return {
    title: (bn && s.titleBn) || s.titleEn,
    intro: (bn && s.introBn) || s.introEn,
    capital: s.capitalCrore !== null ? { crore: s.capitalCrore, source: s.capitalSource, asOf: s.capitalAsOf || null } : null,
    groups,
    houses,
    parents: parents.size,
    board,
  };
});
