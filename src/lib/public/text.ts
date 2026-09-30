import type { AppLocale } from "@/lib/i18n/config";

/** Picks the row for the locale, falling back to English. */
export function pick<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en");
}

/** True when the requested locale has its own row (not a fallback). */
export function hasLocale(rows: { locale: string }[], locale: AppLocale) {
  return rows.some((r) => r.locale === locale);
}

/** Admin text is plain text: blank lines separate paragraphs. Never HTML. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Turns a link typed in the admin into a safe href.
 * "request-demo" → "/en/request-demo"; "https://…" stays; anything else
 * (javascript:, data:, protocol-relative) is dropped.
 */
export function resolveHref(href: string | null | undefined, locale: AppLocale): { href: string; external: boolean } | null {
  const value = href?.trim();
  if (!value) return null;
  if (/^https:\/\/\S+$/i.test(value)) return { href: value, external: true };
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(value) || /^tel:\+?[\d\s()-]+$/i.test(value)) return { href: value, external: true };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return null;
  const [path = "", hash] = value.split("#");
  const clean = path.replace(/^\/+/, "").replace(/^(en|bn)(\/|$)/, "");
  if (!/^[a-z0-9\-/]*$/i.test(clean)) return null;
  return { href: `/${locale}${clean ? `/${clean}` : ""}${hash ? `#${hash}` : ""}`, external: false };
}

const monthFmt = (locale: AppLocale) =>
  new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka", month: "long", year: "numeric" });
const dayFmt = (locale: AppLocale) =>
  new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric" });

/** Event dates; approximate dates show month and year only. */
export function formatEventDate(date: Date | null, approx: boolean, locale: AppLocale) {
  if (!date) return null;
  return approx ? monthFmt(locale).format(date) : dayFmt(locale).format(date);
}

/** YouTube/Vimeo watch URL → privacy-friendly embed URL, or null. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}?dnt=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}
