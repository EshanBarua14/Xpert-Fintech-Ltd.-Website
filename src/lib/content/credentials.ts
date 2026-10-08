import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { mediaMap } from "@/lib/public/content";
import { pick } from "@/lib/public/text";

/** Settings key holding the list (Admin → Credentials). */
export const CREDENTIALS_KEY = "site.credentials";
export const MAX_CREDENTIALS = 8;

export type CredentialItem = { orgKey: string; en: string; bn: string };
export type CredentialsSetting = { published: boolean; items: CredentialItem[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Items name their organization by key (seeded ones) or by id (any other organization). */
export function orgWhere(refs: string[]) {
  return { OR: [{ key: { in: refs } }, { id: { in: refs.filter((r) => UUID.test(r)) } }] };
}
export const orgRef = (o: { id: string; key: string | null }) => o.key ?? o.id;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function readCredentials(value: unknown): CredentialsSetting {
  const o = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    published: o.published === true,
    items: items
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
      .map((x) => ({ orgKey: str(x.orgKey), en: str(x.en), bn: str(x.bn) }))
      .filter((x) => x.orgKey && x.en)
      .slice(0, MAX_CREDENTIALS),
  };
}

export type Credential = {
  /** The organization's key (e.g. "dse"), or its id. */
  orgKey: string;
  title: string;
  name: string;
  shortName: string | null;
  websiteUrl: string | null;
  logo: { url: string; width: number | null; height: number | null } | null;
};

/**
 * The published memberships and certifications, each with its organization's
 * name, website and logo (the logo only with permission on file). An item
 * whose organization is missing or unpublished is left out.
 */
export const getCredentials = cache(async (locale: AppLocale): Promise<Credential[]> => {
  const row = await db.siteSetting.findUnique({ where: { key: CREDENTIALS_KEY } }).catch(() => null);
  const setting = readCredentials(row?.value);
  if (!setting.published || !setting.items.length) return [];
  const orgs = await db.organization
    .findMany({ where: { ...publishedWhere(), ...orgWhere(setting.items.map((i) => i.orgKey)) }, include: { translations: true } })
    .catch(() => []);
  const media = await mediaMap(orgs.map((o) => (o.logoPermission ? o.logoMediaId : null)), locale);
  return setting.items.flatMap((item) => {
    const org = orgs.find((o) => orgRef(o) === item.orgKey || o.id === item.orgKey);
    if (!org) return [];
    const tr = pick(org.translations, locale);
    const logo = org.logoPermission && org.logoMediaId ? media.get(org.logoMediaId) : undefined;
    return [
      {
        orgKey: item.orgKey,
        title: (locale === "bn" && item.bn) || item.en,
        name: tr?.name ?? item.orgKey.toUpperCase(),
        shortName: tr?.shortName ?? null,
        websiteUrl: org.websiteUrl,
        logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : null,
      },
    ];
  });
});
