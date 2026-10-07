import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import type { AppLocale } from "./config";

/**
 * Interface text (buttons, labels, headings, ARIA text) in English and Bangla.
 * The defaults live in src/messages/{en,bn}.json; editors can change any of
 * them in Admin → Site text. Those edits are kept in the database and loaded
 * into the server's memory (see ./overrides.ts), and win over the defaults.
 */
export type Messages = typeof en;
export type MessageKey = keyof Messages;

const catalogs: Record<AppLocale, Messages> = { en, bn };

export type TextOverrides = Partial<Record<AppLocale, Partial<Record<MessageKey, string>>>>;

type Store = { overrides: TextOverrides; version: number; merged: Partial<Record<AppLocale, { version: number; value: Messages }>>; loadedAt: number };
const g = globalThis as unknown as { __xflText?: Store };
function store(): Store {
  return (g.__xflText ??= { overrides: {}, version: 0, merged: {}, loadedAt: 0 });
}

/** Replaces the in-memory overrides (called by the loader and after a save in the admin). */
export function setTextOverrides(overrides: TextOverrides) {
  const s = store();
  s.overrides = overrides;
  s.version++;
  s.merged = {};
  s.loadedAt = Date.now();
}

export function textOverridesAge(): number {
  return Date.now() - store().loadedAt;
}

/** The defaults shipped with the site, without editor changes. */
export function defaultMessages(locale: AppLocale): Messages {
  return catalogs[locale];
}

export function getMessages(locale: AppLocale): Messages {
  const s = store();
  const own = s.overrides[locale];
  if (!own || Object.keys(own).length === 0) return catalogs[locale];
  const cached = s.merged[locale];
  if (cached && cached.version === s.version) return cached.value;
  const value = { ...catalogs[locale] } as Messages;
  for (const [k, v] of Object.entries(own)) if (typeof v === "string" && v.trim() && k in value) (value as Record<string, string>)[k] = v;
  s.merged[locale] = { version: s.version, value };
  return value;
}
