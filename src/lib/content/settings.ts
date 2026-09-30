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
  socialLinks: SocialLink[];
};

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
        where: { key: { in: ["company.name", "company.summary", "contact.email", "contact.phone", "social.links"] } },
      }),
      db.office.findFirst({
        where: { ...publishedWhere(), isPrimary: true },
        include: { translations: true },
      }),
    ]);
    const get = (key: string) => settings.find((s) => s.key === key)?.value;
    const officeText =
      office?.translations.find((t) => t.locale === locale) ?? office?.translations.find((t) => t.locale === "en");

    return {
      companyName: localized(get("company.name"), locale) ?? "Xpert Fintech Ltd.",
      summary: localized(get("company.summary"), locale),
      email: localized(get("contact.email"), locale),
      phone: localized(get("contact.phone"), locale),
      address: officeText?.address ?? null,
      socialLinks: socialLinks(get("social.links")),
    };
  } catch (error) {
    console.error("[settings] could not load site info", error);
    return { companyName: "Xpert Fintech Ltd.", summary: null, email: null, phone: null, address: null, socialLinks: [] };
  }
}
