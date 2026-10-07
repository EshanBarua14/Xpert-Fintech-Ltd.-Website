import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { mediaMap } from "@/lib/public/content";

export const LEADER_KEYS = ["chairman", "md"] as const;
export type LeaderKey = (typeof LEADER_KEYS)[number];

/** Which group's title to show under the signature. */
const ROLE_GROUP = { chairman: "BOARD", md: "MANAGEMENT" } as const;

export type LeaderMessageSetting = { personKey: string; published: boolean; en: string; bn: string };
export type MarketGoal = { targetPct: number; year: number; en: string; bn: string };

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function readLeaderSetting(value: unknown): LeaderMessageSetting {
  const o = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { personKey: str(o.personKey), published: o.published === true, en: str(o.en), bn: str(o.bn) };
}

export function readGoal(value: unknown): MarketGoal | null {
  const o = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  if (!o) return null;
  const targetPct = Number(o.targetPct);
  const year = Number(o.year);
  if (!(targetPct > 0 && targetPct <= 100) || !(year >= 2000 && year <= 2100)) return null;
  return { targetPct, year, en: str(o.en), bn: str(o.bn) };
}

export type LeaderMessage = {
  key: LeaderKey;
  paragraphs: string[];
  name: string | null;
  title: string | null;
  photo: { url: string; width: number | null; height: number | null } | null;
};

/**
 * A published leader's message with the signatory's name, title and photo
 * from Admin → People. Null until it is published in Admin → Messages.
 */
export const getLeaderMessage = cache(async (key: LeaderKey, locale: AppLocale): Promise<LeaderMessage | null> => {
  const row = await db.siteSetting.findUnique({ where: { key: `message.${key}` } }).catch(() => null);
  if (!row) return null;
  const m = readLeaderSetting(row.value);
  const text = (locale === "bn" && m.bn.trim()) || m.en.trim();
  if (!m.published || !text) return null;
  const person = m.personKey
    ? await db.person.findFirst({
        where: { ...publishedWhere(), key: m.personKey },
        include: { translations: true, roles: { where: { group: ROLE_GROUP[key] }, include: { translations: true } } },
      })
    : null;
  const tr = person?.translations.find((t) => t.locale === locale) ?? person?.translations.find((t) => t.locale === "en");
  const roleTr = person?.roles[0]?.translations;
  const title = roleTr?.find((t) => t.locale === locale)?.title ?? roleTr?.find((t) => t.locale === "en")?.title ?? null;
  const photos = person?.photoMediaId ? await mediaMap([person.photoMediaId], locale) : null;
  const photo = person?.photoMediaId ? photos?.get(person.photoMediaId) : null;
  return {
    key,
    paragraphs: text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    name: tr?.name ?? null,
    title,
    photo: photo ? { url: photo.url, width: photo.width, height: photo.height } : null,
  };
});

export const getMarketGoal = cache(async (): Promise<MarketGoal | null> => {
  const row = await db.siteSetting.findUnique({ where: { key: "market.goal" } }).catch(() => null);
  return row ? readGoal(row.value) : null;
});
