/**
 * Locale configuration. Content locales are stored in the database as the
 * Prisma enum `Locale` (en | bn); UI strings live in src/messages/<locale>.json.
 */
export const locales = ["en", "bn"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  bn: "বাংলা",
};

export function isLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}
