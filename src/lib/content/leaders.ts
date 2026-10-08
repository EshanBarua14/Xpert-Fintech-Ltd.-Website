import "server-only";
import { editorHints } from "@/lib/env/hints";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";
import { mediaMap } from "@/lib/public/content";
import { LEADER_MESSAGES } from "@/content/xfl2/messages";
import { BOARD, MANAGEMENT } from "@/content/xfl2/people";

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
  /** Not published yet: shown only outside production, marked as a draft, so editors can review it in place. */
  draft: boolean;
};

/** Outside production, unpublished messages are shown (marked as drafts) so they can be reviewed on the page. */
const previewDrafts = () => process.env.APP_ENV !== "production";

/**
 * A leader's message with the signatory's name, title and photo from
 * Admin → People (shown on the About page). On the live site, null until it is published in
 * Admin → Messages; elsewhere drafts come back marked `draft`.
 */
export const getLeaderMessage = cache(async (key: LeaderKey, locale: AppLocale): Promise<LeaderMessage | null> => {
  const row = await db.siteSetting.findUnique({ where: { key: `message.${key}` } }).catch(() => null);
  // Not set up yet (the content seed has not run): outside production, preview the starting draft.
  const seed = LEADER_MESSAGES.find((x) => x.key === key);
  if (!row && !(previewDrafts() && seed)) return null;
  const m = row ? readLeaderSetting(row.value) : { personKey: seed!.personKey, published: false, en: seed!.en, bn: seed!.bn };
  const text = (locale === "bn" && m.bn.trim()) || m.en.trim();
  if (!text || (!m.published && !previewDrafts())) return null;
  // The signatory by key; failing that (a profile created by the old-site importer
  // under another key), by the name XFL gave for that person.
  const include = { translations: true, roles: { where: { group: ROLE_GROUP[key] }, include: { translations: true } } } as const;
  const rosterName = [...BOARD, ...MANAGEMENT].find((p) => p.key === m.personKey)?.name;
  const person = m.personKey
    ? ((await db.person.findFirst({ where: { ...publishedWhere(), key: m.personKey }, include })) ??
      (rosterName
        ? await db.person.findFirst({ where: { ...publishedWhere(), translations: { some: { locale: "en", name: { equals: rosterName, mode: "insensitive" } } } }, include })
        : null))
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
    draft: !m.published && editorHints(),
  };
});

export const getMarketGoal = cache(async (): Promise<MarketGoal | null> => {
  const row = await db.siteSetting.findUnique({ where: { key: "market.goal" } }).catch(() => null);
  return row ? readGoal(row.value) : null;
});

/**
 * Xpert's overall share of DSE and CSE turnover as XFL states it (e.g. 45%),
 * set in Admin → Market data. When set, the home page leads with it instead
 * of the figure worked out from the daily turnover entries.
 */
export type HeadlineShare = { pct: number; asOf: string | null };
export const HEADLINE_SHARE_KEY = "market.headlineShare";

export function readHeadlineShare(value: unknown): HeadlineShare | null {
  const o = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  const pct = Number(o?.pct);
  if (!o || !(pct > 0 && pct <= 100)) return null;
  const asOf = typeof o.asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.asOf) ? o.asOf : null;
  return { pct, asOf };
}

export const getHeadlineShare = cache(async (): Promise<HeadlineShare | null> => {
  const row = await db.siteSetting.findUnique({ where: { key: HEADLINE_SHARE_KEY } }).catch(() => null);
  return row ? readHeadlineShare(row.value) : null;
});
