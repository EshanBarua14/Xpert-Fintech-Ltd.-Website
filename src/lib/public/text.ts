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

/** 225 → "3:45", 3750 → "1:02:30" (Bangla digits on Bangla pages). */
export function formatDuration(sec: number | null | undefined, locale: AppLocale): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  const text = h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  return locale === "bn" ? text.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : text;
}

export type VideoLink = {
  provider: "YOUTUBE" | "VIMEO" | "FACEBOOK";
  /** Privacy-friendly player URL for an iframe. */
  embedUrl: string;
  /** Still image from the provider, when it offers one without an API call. */
  thumbnail: string | null;
};

/**
 * Recognises a YouTube, Vimeo or Facebook video address and returns how to
 * embed it, or null for anything else (so admins cannot embed arbitrary sites).
 */
export function parseVideoUrl(url: string | null | undefined): VideoLink | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);
    const youtube = (id: string | null | undefined): VideoLink | null =>
      id && /^[\w-]{6,20}$/.test(id)
        ? { provider: "YOUTUBE", embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }
        : null;
    if (/(^|\.)youtube\.com$/.test(host)) {
      // watch?v=ID, /embed/ID, /shorts/ID, /live/ID
      if (parts[0] === "watch") return youtube(u.searchParams.get("v"));
      if (["embed", "shorts", "live", "v"].includes(parts[0] ?? "")) return youtube(parts[1]);
      return null;
    }
    if (host === "youtu.be") return youtube(parts[0]);
    if (/(^|\.)vimeo\.com$/.test(host)) {
      const id = [...parts].reverse().find((p) => /^\d+$/.test(p));
      return id ? { provider: "VIMEO", embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`, thumbnail: null } : null;
    }
    if (/(^|\.)facebook\.com$/.test(host) || host === "fb.watch") {
      const isVideo = host === "fb.watch" || parts.includes("videos") || parts[0] === "watch" || parts[0] === "reel";
      if (!isVideo) return null;
      const href = encodeURIComponent(`https://${host === "fb.watch" ? "fb.watch" : "www.facebook.com"}${u.pathname}${u.search}`);
      return { provider: "FACEBOOK", embedUrl: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false`, thumbnail: null };
    }
  } catch {
    return null;
  }
  return null;
}

/** YouTube/Vimeo/Facebook watch URL → embed URL, or null. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  return parseVideoUrl(url)?.embedUrl ?? null;
}
