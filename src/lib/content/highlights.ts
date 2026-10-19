import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { ICON_NAMES } from "@/components/ui/Icon";
import type { AppLocale } from "@/lib/i18n/config";

/**
 * Admin → Home highlights: the "core strengths" cards, the cost-savings graphic
 * and the WhatsApp button. Each is one setting; Admin → Design → Home page
 * switches the two home sections on and off.
 */
export const STRENGTHS_KEY = "home.strengths";
export const SAVINGS_KEY = "home.savings";
export const WHATSAPP_KEY = "site.whatsapp";
export const OWNERSHIP_KEY = "home.ownership";

/** "Who owns Xpert": paid-up capital and the owner houses by basis (bases from Admin → Organizations → Owned by). */
export type OwnershipSetting = {
  published: boolean;
  titleEn: string;
  titleBn: string;
  introEn: string;
  introBn: string;
  /** Paid-up capital in crore taka (e.g. 33); null hides the capital. */
  capitalCrore: number | null;
  capitalSource: string;
  capitalAsOf: string;
};
export const DEFAULT_OWNERSHIP: OwnershipSetting = {
  published: false,
  titleEn: "Who owns *Xpert*",
  titleBn: "এক্সপার্টের *মালিক* কারা",
  introEn: "The capital behind the platform and the institutions that own it, house by house.",
  introBn: "প্ল্যাটফর্মের পেছনের মূলধন এবং এর মালিক প্রতিষ্ঠানগুলো, হাউস ধরে ধরে।",
  capitalCrore: null,
  capitalSource: "",
  capitalAsOf: "",
};
export const MAX_STRENGTHS = 10;

/** `statEn`/`statBn`: an optional figure shown large on the card (e.g. "৳33 cr", "7"); only real, sourced numbers. */
export type Strength = { icon: string; titleEn: string; titleBn: string; bodyEn: string; bodyBn: string; statEn?: string; statBn?: string };
export type StrengthsSetting = { titleEn: string; titleBn: string; introEn: string; introBn: string; items: Strength[] };

export type SavingsSetting = {
  /** Shown on the live site only when published and both figures are entered. */
  published: boolean;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  /** What was paid before Xpert, and with Xpert, in the same unit. */
  before: number | null;
  after: number | null;
  /** The share saved, when only the percentage is known (used when the two figures are not entered). */
  pct: number | null;
  /** Written before the number ("৳") and after it ("lakh a month", "% of revenue"). */
  prefix: string;
  unitEn: string;
  unitBn: string;
  beforeLabelEn: string;
  beforeLabelBn: string;
  afterLabelEn: string;
  afterLabelBn: string;
  source: string;
  sourceUrl: string;
  asOf: string;
  noteEn: string;
  noteBn: string;
};

export type WhatsAppSetting = {
  number: string;
  labelEn: string;
  labelBn: string;
  /** Typed into WhatsApp for the visitor. */
  messageEn: string;
  messageBn: string;
  /** The welcome line in the little panel the button opens. */
  greetingEn: string;
  greetingBn: string;
};

export const DEFAULT_STRENGTHS: StrengthsSetting = {
  titleEn: "Built by brokers. *Trusted* by brokers.",
  titleBn: "ব্রোকারদের হাতে গড়া। ব্রোকারদের *আস্থায়*।",
  introEn: "Five reasons the houses that own Xpert also run their business on it.",
  introBn: "যে হাউসগুলো এক্সপার্টের মালিক, তারাই কেন এতে তাদের ব্যবসা চালায়: পাঁচটি কারণ।",
  items: [
    {
      icon: "users",
      titleEn: "Built by the market's top brokers",
      titleBn: "বাজারের শীর্ষ ব্রোকারদের হাতে গড়া",
      bodyEn: "Designed with the brokerage houses that own Xpert and trade on it every day, so every screen follows how a dealing desk really works.",
      bodyBn: "এক্সপার্টের মালিক ও প্রতিদিন এতে লেনদেনকারী ব্রোকারেজ হাউসগুলোর সঙ্গে মিলে তৈরি, তাই প্রতিটি স্ক্রিন ডিলিং ডেস্কের বাস্তব কাজের ধারা মেনে চলে।",
    },
    {
      icon: "shield",
      titleEn: "Enterprise-grade security",
      titleBn: "এন্টারপ্রাইজ-মানের নিরাপত্তা",
      bodyEn: "Access controls on every desk, encrypted connections and pre-trade risk checks protect each account and every order.",
      bodyBn: "প্রতিটি ডেস্কে প্রবেশাধিকার নিয়ন্ত্রণ, এনক্রিপ্টেড সংযোগ ও লেনদেনের আগে ঝুঁকি যাচাই প্রতিটি অ্যাকাউন্ট ও অর্ডার সুরক্ষিত রাখে।",
    },
    {
      icon: "network",
      titleEn: "High-availability network",
      titleBn: "উচ্চ প্রাপ্যতার নেটওয়ার্ক",
      bodyEn: "A redundant network built to keep orders flowing to DSE and CSE through the busiest hours of the trading day.",
      bodyBn: "লেনদেনের সবচেয়ে ব্যস্ত সময়েও ডিএসই ও সিএসইতে অর্ডার পৌঁছে দিতে তৈরি রিডানড্যান্ট নেটওয়ার্ক।",
    },
    {
      icon: "briefcase",
      titleEn: "Owned by leading institutions",
      titleBn: "শীর্ষস্থানীয় প্রতিষ্ঠানের মালিকানাধীন",
      bodyEn: "A capital-market fintech owned by a consortium of the country's leading bank-backed and independent brokerage houses.",
      bodyBn: "দেশের শীর্ষস্থানীয় ব্যাংক-সমর্থিত ও স্বতন্ত্র ব্রোকারেজ হাউসগুলোর একটি কনসোর্টিয়ামের মালিকানাধীন পুঁজিবাজার ফিনটেক।",
    },
    {
      icon: "cloud",
      titleEn: "Institutional-grade infrastructure",
      titleBn: "প্রাতিষ্ঠানিক মানের অবকাঠামো",
      bodyEn: "Data-centre hosting, monitoring and backups built for regulated institutions, not for a single office.",
      bodyBn: "একটি অফিসের জন্য নয়, নিয়ন্ত্রিত প্রতিষ্ঠানের জন্য তৈরি ডেটা সেন্টার হোস্টিং, পর্যবেক্ষণ ও ব্যাকআপ।",
    },
  ],
};

export const DEFAULT_SAVINGS: SavingsSetting = {
  published: false,
  titleEn: "Same market. *{pct}% less* to run it.",
  titleBn: "একই বাজার। চালাতে খরচ *{pct}% কম*।",
  bodyEn: "Instead of every brokerage paying for its own systems, the houses on Xpert share one platform and split the bill.",
  bodyBn: "প্রতিটি ব্রোকারেজ আলাদা সিস্টেমের খরচ না দিয়ে, এক্সপার্টের হাউসগুলো একটি প্ল্যাটফর্ম ভাগ করে নেয়, খরচও ভাগ হয়ে যায়।",
  before: null,
  after: null,
  pct: null,
  prefix: "",
  unitEn: "",
  unitBn: "",
  beforeLabelEn: "Before Xpert",
  beforeLabelBn: "এক্সপার্টের আগে",
  afterLabelEn: "With Xpert",
  afterLabelBn: "এক্সপার্টের সঙ্গে",
  source: "",
  sourceUrl: "",
  asOf: "",
  noteEn: "",
  noteBn: "",
};

export const DEFAULT_WHATSAPP: WhatsAppSetting = {
  number: "+880 1684-810100",
  labelEn: "Chat on WhatsApp",
  labelBn: "হোয়াটসঅ্যাপে কথা বলুন",
  messageEn: "Hello Xpert Fintech, I would like to request a demo of your brokerage platform. Please let me know a convenient time.",
  messageBn: "হ্যালো এক্সপার্ট ফিনটেক, আমি আপনাদের ব্রোকারেজ প্ল্যাটফর্মের একটি ডেমো দেখতে চাই। অনুগ্রহ করে সুবিধাজনক সময় জানাবেন।",
  greetingEn: "Hi there! Want to see Xpert in action? Chat with our team on WhatsApp or give us a call, and we'll set up your demo.",
  greetingBn: "স্বাগতম! এক্সপার্ট কীভাবে কাজ করে দেখতে চান? হোয়াটসঅ্যাপে আমাদের টিমের সঙ্গে কথা বলুন বা কল করুন, আমরা আপনার ডেমোর ব্যবস্থা করব।",
};

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function readStrengths(value: unknown): StrengthsSetting {
  if (value === undefined || value === null) return DEFAULT_STRENGTHS;
  const v = obj(value);
  const items = (Array.isArray(v.items) ? v.items : [])
    .map((x) => obj(x))
    .map((x) => ({
      icon: ICON_NAMES.includes(str(x.icon)) ? str(x.icon) : "check",
      titleEn: str(x.titleEn),
      titleBn: str(x.titleBn),
      bodyEn: str(x.bodyEn),
      bodyBn: str(x.bodyBn),
      statEn: str(x.statEn),
      statBn: str(x.statBn),
    }))
    .filter((x) => x.titleEn);
  return { titleEn: str(v.titleEn), titleBn: str(v.titleBn), introEn: str(v.introEn), introBn: str(v.introBn), items: items.slice(0, MAX_STRENGTHS) };
}

export function readOwnership(value: unknown): OwnershipSetting {
  if (value === undefined || value === null) return DEFAULT_OWNERSHIP;
  const v = obj(value);
  const d = DEFAULT_OWNERSHIP;
  const cap = num(v.capitalCrore);
  return {
    published: v.published === true,
    titleEn: str(v.titleEn, d.titleEn),
    titleBn: str(v.titleBn, d.titleBn),
    introEn: str(v.introEn, d.introEn),
    introBn: str(v.introBn, d.introBn),
    capitalCrore: cap !== null && cap > 0 ? cap : null,
    capitalSource: str(v.capitalSource),
    capitalAsOf: /^\d{4}-\d{2}-\d{2}$/.test(str(v.capitalAsOf)) ? str(v.capitalAsOf) : "",
  };
}

export function readSavings(value: unknown): SavingsSetting {
  if (value === undefined || value === null) return DEFAULT_SAVINGS;
  const v = obj(value);
  const d = DEFAULT_SAVINGS;
  return {
    published: v.published === true,
    titleEn: str(v.titleEn, d.titleEn),
    titleBn: str(v.titleBn, d.titleBn),
    bodyEn: str(v.bodyEn),
    bodyBn: str(v.bodyBn),
    before: num(v.before),
    after: num(v.after),
    pct: num(v.pct),
    prefix: str(v.prefix),
    unitEn: str(v.unitEn),
    unitBn: str(v.unitBn),
    beforeLabelEn: str(v.beforeLabelEn, d.beforeLabelEn),
    beforeLabelBn: str(v.beforeLabelBn, d.beforeLabelBn),
    afterLabelEn: str(v.afterLabelEn, d.afterLabelEn),
    afterLabelBn: str(v.afterLabelBn, d.afterLabelBn),
    source: str(v.source),
    sourceUrl: str(v.sourceUrl),
    asOf: str(v.asOf),
    noteEn: str(v.noteEn),
    noteBn: str(v.noteBn),
  };
}

export function readWhatsApp(value: unknown): WhatsAppSetting {
  if (value === undefined || value === null) return DEFAULT_WHATSAPP;
  const v = obj(value);
  return {
    number: str(v.number),
    labelEn: str(v.labelEn, DEFAULT_WHATSAPP.labelEn),
    labelBn: str(v.labelBn, DEFAULT_WHATSAPP.labelBn),
    messageEn: str(v.messageEn),
    messageBn: str(v.messageBn),
    greetingEn: str(v.greetingEn, DEFAULT_WHATSAPP.greetingEn),
    greetingBn: str(v.greetingBn, DEFAULT_WHATSAPP.greetingBn),
  };
}

async function setting(key: string) {
  const row = await db.siteSetting.findUnique({ where: { key } }).catch(() => null);
  return row?.value ?? null;
}

export const getStrengthsSetting = cache(async () => readStrengths(await setting(STRENGTHS_KEY)));
export const getSavingsSetting = cache(async () => readSavings(await setting(SAVINGS_KEY)));
export const getWhatsAppSetting = cache(async () => readWhatsApp(await setting(WHATSAPP_KEY)));
export const getOwnershipSetting = cache(async () => readOwnership(await setting(OWNERSHIP_KEY)));

const pick = (locale: AppLocale, en: string, bn: string) => (locale === "bn" && bn.trim() ? bn : en);

/** The strengths in the visitor's language (Bangla falls back to English field by field). */
export async function getStrengths(locale: AppLocale) {
  const s = await getStrengthsSetting();
  return {
    title: pick(locale, s.titleEn, s.titleBn),
    intro: pick(locale, s.introEn, s.introBn),
    items: s.items.map((i) => ({ icon: i.icon, title: pick(locale, i.titleEn, i.titleBn), body: pick(locale, i.bodyEn, i.bodyBn), stat: pick(locale, i.statEn ?? "", i.statBn ?? "") })),
  };
}

/** Percentage saved, from the two figures; null when they do not describe a saving. */
export function savingPct(before: number | null, after: number | null): number | null {
  if (before === null || after === null || before <= 0 || after < 0 || after >= before) return null;
  return Math.round(((before - after) / before) * 100);
}

/** The savings graphic in the visitor's language, or null when it is not ready to show. */
export async function getSavings(locale: AppLocale, { drafts = false } = {}) {
  const s = await getSavingsSetting();
  const fromFigures = savingPct(s.before, s.after);
  const pct = fromFigures ?? (s.pct !== null && s.pct > 0 && s.pct < 100 ? Math.round(s.pct) : null);
  if (pct === null || (!s.published && !drafts)) return null;
  const fill = (v: string) => v.replace(/\{pct\}/g, String(pct));
  return {
    draft: !s.published,
    pct,
    title: fill(pick(locale, s.titleEn, s.titleBn)),
    body: fill(pick(locale, s.bodyEn, s.bodyBn)),
    // Without the two figures, the bars are drawn to scale (100 → 100 − pct) with no amounts printed.
    before: fromFigures !== null ? s.before! : null,
    after: fromFigures !== null ? s.after! : null,
    prefix: s.prefix,
    unit: pick(locale, s.unitEn, s.unitBn),
    beforeLabel: pick(locale, s.beforeLabelEn, s.beforeLabelBn),
    afterLabel: pick(locale, s.afterLabelEn, s.afterLabelBn),
    source: s.source,
    sourceUrl: s.sourceUrl,
    asOf: s.asOf,
    note: pick(locale, s.noteEn, s.noteBn),
  };
}

/** The wa.me link and label, or null when no number is set. */
export async function getWhatsApp(locale: AppLocale) {
  const w = await getWhatsAppSetting();
  const digits = w.number.replace(/\D/g, "");
  // WhatsApp only: the button appears once a number is saved in Admin → Home highlights.
  if (digits.length < 8) return null;
  const message = pick(locale, w.messageEn, w.messageBn);
  return {
    href: `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    tel: `tel:+${digits}`,
    number: w.number,
    label: pick(locale, w.labelEn, w.labelBn),
    greeting: pick(locale, w.greetingEn, w.greetingBn),
    external: true,
  };
}
