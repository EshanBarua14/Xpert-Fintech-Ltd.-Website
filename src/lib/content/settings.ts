import "server-only";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import type { AppLocale } from "@/lib/i18n/config";

export type SocialLink = { label: string; url: string };

export type SiteInfo = {
  companyName: string;
  summary: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  /** Office hours, if set. */
  hours: string | null;
  /** Google Maps embed address for the office (from the admin link, or built from the address). */
  mapEmbed: string | null;
  /** "Get directions" link. */
  mapLink: string | null;
  registration: string | null;
  regulatory: string | null;
  socialLinks: SocialLink[];
};

/** A Google Maps link or embed address → an embeddable map; else a map of the address. */
export function mapFor(mapUrl: string | null | undefined, address: string | null): { embed: string | null; link: string | null } {
  const q = address ? encodeURIComponent(address.replace(/\s+/g, " ")) : null;
  const link = mapUrl && !/\/maps\/embed/.test(mapUrl) ? mapUrl : q ? `https://www.google.com/maps/search/?api=1&query=${q}` : null;
  if (mapUrl && /^https:\/\/www\.google\.[a-z.]+\/maps\/embed/.test(mapUrl)) return { embed: mapUrl, link };
  // Coordinates in a share link ("@23.73,90.41,17z") give an exact pin.
  const at = mapUrl ? /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(mapUrl) : null;
  if (at) return { embed: `https://www.google.com/maps?q=${at[1]},${at[2]}&z=17&output=embed`, link };
  return { embed: q ? `https://www.google.com/maps?q=${q}&z=17&output=embed` : null, link };
}

/** Reads a localized setting value such as { en: "…", bn: "…" } or a plain string. */
function localized(value: unknown, locale: AppLocale): string | null {
  if (typeof value === "string") return value || null;
  if (value && typeof value === "object") {
    const map = value as Record<string, unknown>;
    const text = map[locale] ?? map.en;
    return typeof text === "string" && text ? text : null;
  }
  return null;
}

function socialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is SocialLink =>
      !!v && typeof v === "object" && typeof (v as SocialLink).label === "string" && typeof (v as SocialLink).url === "string",
  );
}

/**
 * Company name, contact details, address and social links — all edited in
 * Admin → Settings and Admin → Offices. Never hardcoded in components.
 */
export async function getSiteInfo(locale: AppLocale): Promise<SiteInfo> {
  try {
    const [settings, office] = await Promise.all([
      db.siteSetting.findMany({
        where: { key: { in: ["company.name", "company.summary", "contact.email", "contact.phone", "social.links", "company.registration", "company.regulatory"] } },
      }),
      db.office.findFirst({
        where: { ...publishedWhere(), isPrimary: true },
        include: { translations: true },
      }),
    ]);
    const get = (key: string) => settings.find((s) => s.key === key)?.value;
    const officeText =
      office?.translations.find((t) => t.locale === locale) ?? office?.translations.find((t) => t.locale === "en");

    const address = officeText?.address ?? null;
    const map = mapFor(office?.mapUrl, office?.translations.find((t) => t.locale === "en")?.address ?? address);
    return {
      companyName: localized(get("company.name"), locale) ?? "Xpert Fintech Ltd.",
      summary: localized(get("company.summary"), locale),
      email: localized(get("contact.email"), locale),
      phone: localized(get("contact.phone"), locale),
      address,
      hours: officeText?.hours ?? null,
      mapEmbed: map.embed,
      mapLink: map.link,
      registration: localized(get("company.registration"), locale),
      regulatory: localized(get("company.regulatory"), locale),
      socialLinks: socialLinks(get("social.links")),
    };
  } catch (error) {
    console.error("[settings] could not load site info", error);
    return { companyName: "Xpert Fintech Ltd.", summary: null, email: null, phone: null, address: null, hours: null, mapEmbed: null, mapLink: null, registration: null, regulatory: null, socialLinks: [] };
  }
}
