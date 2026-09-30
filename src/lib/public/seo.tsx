import "server-only";
import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import type { AppLocale } from "@/lib/i18n/config";
import { getSiteInfo } from "@/lib/content/settings";
import { getMessages } from "@/lib/i18n/messages";
import type { BlockContext } from "@/components/blocks/types";
import { mediaMap } from "./content";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export async function blockContext(locale: AppLocale, mediaIds: string[] = []): Promise<BlockContext> {
  const [info, media] = await Promise.all([getSiteInfo(locale), mediaMap(mediaIds, locale)]);
  return { locale, t: getMessages(locale), media, contactEmail: info.email };
}

/**
 * Builds page metadata: title, description, canonical URL, hreflang
 * alternates (only for languages the content exists in) and Open Graph.
 *
 * `paths` maps each available locale to its path below the locale, e.g.
 * { en: "company/about", bn: "company/about" }.
 */
export async function buildMetadata({
  locale,
  title,
  description,
  paths,
  ogImageId,
  noindex = false,
  type = "website",
}: {
  locale: AppLocale;
  title: string;
  description?: string | null;
  paths: Partial<Record<AppLocale, string>>;
  ogImageId?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}): Promise<Metadata> {
  const url = (l: AppLocale) => `${SITE_URL}/${l}${paths[l] ? `/${paths[l]}` : ""}`;
  const languages: Record<string, string> = {};
  if (paths.en !== undefined) languages.en = url("en");
  if (paths.bn !== undefined) languages.bn = url("bn");
  if (paths.en !== undefined) languages["x-default"] = url("en");

  let image: { url: string; width?: number; height?: number } | undefined;
  if (ogImageId) {
    const m = await db.media.findFirst({ where: { id: ogImageId, deletedAt: null }, select: { storageKey: true, width: true, height: true } });
    if (m) image = { url: `${SITE_URL}/media/${m.storageKey}`, width: m.width ?? undefined, height: m.height ?? undefined };
  }
  const info = await getSiteInfo(locale);
  const desc = description ?? info.summary ?? undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url(locale), languages },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type,
      url: url(locale),
      siteName: info.companyName,
      title,
      description: desc,
      locale: locale === "bn" ? "bn_BD" : "en_US",
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: desc, images: image ? [image.url] : undefined },
  };
}

/** Structured data, printed as JSON-LD. Only facts from the CMS go in. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // JSON.stringify output with "<" escaped cannot close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}
