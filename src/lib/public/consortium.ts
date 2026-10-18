import { focusStyle } from "@/lib/media/focal";
import { rankOf, type BrokerRank } from "./rank";
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import type { AppLocale } from "@/lib/i18n/config";
import { publishedWhere } from "@/lib/db/publishing";
import { pick } from "@/lib/public/text";
import { getOrganizations, mediaMap } from "@/lib/public/content";

/**
 * The consortium as relations, all from the database (nothing assumed):
 *  - each member brokerage house (Admin → Organizations, kind Consortium member)
 *  - who represents it on Xpert's Board or as a consultant (People whose
 *    position names the house, e.g. "CEO & Director, Apex Investments Ltd.")
 *  - the branded trading app(s) it runs on Xpert's platform (Admin → Deployments)
 */
export type ConsortiumApp = { name: string; playStoreUrl: string | null; appStoreUrl: string | null; webUrl: string | null };
export type ConsortiumRep = {
  name: string;
  title: string | null;
  position: string | null;
  group: "BOARD" | "CONSULTANT";
  photo: string | null;
  photoStyle?: import("react").CSSProperties;
  /** From Admin → People: icons beside the representative. */
  linkedin?: string | null;
  email?: string | null;
  /** Their own website (else the house's). */
  website?: string | null;
};
export type ConsortiumMember = {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  websiteUrl: string | null;
  dseTrec: string | null;
  cseTrec: string | null;
  rank: BrokerRank | null;
  logo: { url: string; width: number | null; height: number | null } | null;
  apps: ConsortiumApp[];
  reps: ConsortiumRep[];
};

const norm = (v: string) =>
  v
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,()'’]/g, " ")
    .replace(/\b(limited|ltd|plc)\b/g, " ")
    .replace(/(লিমিটেড|লিঃ|পিএলসি)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getConsortium = cache(async (locale: AppLocale): Promise<ConsortiumMember[]> => {
  const orgs = await getOrganizations("CONSORTIUM_MEMBER");
  if (!orgs.length) return [];
  const ids = orgs.map((o) => o.id);
  const [deployments, people] = await Promise.all([
    db.deployment
      .findMany({ where: { ...publishedWhere(), organizationId: { in: ids }, appName: { not: null } }, orderBy: { sortOrder: "asc" } })
      .catch(() => []),
    db.person
      .findMany({
        where: { ...publishedWhere(), isPlaceholder: false, roles: { some: { group: { in: ["BOARD", "CONSULTANT"] } } } },
        include: { translations: true, roles: { include: { translations: true } } },
        orderBy: { sortOrder: "asc" },
      })
      .catch(() => []),
  ]);
  const media = await mediaMap([...orgs.map((o) => (o.logoPermission ? o.logoMediaId : null)), ...people.map((p) => p.photoMediaId)], locale);

  // Every name a house goes by (English, Bangla, short), longest first, to find it in a person's position.
  const names = orgs.map((o) => ({ id: o.id, names: o.translations.flatMap((t) => [t.name, t.shortName]).filter((n): n is string => !!n && n.trim().length > 3).map(norm) }));
  const houseOf = (text: string | null | undefined) => {
    if (!text) return null;
    const t = norm(text);
    let best: string | null = null;
    let len = 0;
    for (const o of names) for (const n of o.names) if (t.includes(n) && n.length > len) ((best = o.id), (len = n.length));
    return best;
  };

  return orgs
    .map((o): ConsortiumMember => {
      const tr = pick(o.translations, locale);
      const logo = o.logoPermission && o.logoMediaId ? media.get(o.logoMediaId) : undefined;
      const reps = people
        .filter((p) => houseOf(p.translations.find((x) => x.locale === "en")?.affiliation) === o.id || houseOf(pick(p.translations, locale)?.affiliation) === o.id)
        .flatMap((p) => {
          const ptr = pick(p.translations, locale);
          const role = p.roles.find((r) => r.group === "BOARD") ?? p.roles.find((r) => r.group === "CONSULTANT");
          if (!ptr?.name || !role) return [];
          const photo = p.photoMediaId ? media.get(p.photoMediaId) : undefined;
          return [
            {
              name: ptr.name,
              title: pick(role.translations, locale)?.title ?? null,
              position: ptr.affiliation ?? null,
              group: role.group as "BOARD" | "CONSULTANT",
              photo: photo?.url ?? null,
              photoStyle: photo ? focusStyle(photo, 1) : undefined,
              linkedin: p.linkedinUrl || null,
              email: p.email || null,
              website: p.websiteUrl || null,
            },
          ];
        });
      return {
        id: o.id,
        name: tr?.name ?? "",
        shortName: tr?.shortName ?? null,
        description: tr?.description ?? null,
        websiteUrl: o.websiteUrl,
        dseTrec: o.dseTrec ?? null,
        cseTrec: o.cseTrec ?? null,
        rank: rankOf(o),
        logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : null,
        apps: deployments
          .filter((d) => d.organizationId === o.id)
          .map((d) => ({ name: d.appName!, playStoreUrl: d.playStoreUrl, appStoreUrl: d.appStoreUrl, webUrl: d.webUrl })),
        reps,
      };
    })
    .filter((m) => m.name);
});
