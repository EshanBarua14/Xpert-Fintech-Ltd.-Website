import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { MediaInfo } from "@/lib/public/content";

/** A block's text, already picked for the page language (English fallback per field). */
export type BlockText = {
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type CardData = {
  id: string;
  mediaId: string | null;
  linkUrl: string | null;
  iconName: string | null;
  props: Record<string, unknown>;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
};

export type BlockData = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  text: BlockText;
  items: CardData[];
};

export type BlockContext = {
  locale: AppLocale;
  t: Messages;
  media: Map<string, MediaInfo>;
  /** Contact email from settings, used by blocks that point people to Xpert. */
  contactEmail: string | null;
};

export const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
export const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : typeof v === "string" && v ? Number(v) || fallback : fallback);
export const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
