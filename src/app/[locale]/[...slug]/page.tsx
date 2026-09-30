import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { PageHero } from "@/components/flagship/Sections";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { countRedirectHit, findRedirect, getPageByPath, getSeo } from "@/lib/public/content";
import { blockContext, buildMetadata } from "@/lib/public/seo";
import { pick } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string; slug: string[] }> };

async function load(locale: string, slug: string[]) {
  if (!isLocale(locale)) return null;
  let path: string;
  try {
    path = slug.map((s) => decodeURIComponent(s).toLowerCase()).join("/");
  } catch {
    return null; // malformed %-encoding
  }
  if (!/^[a-z0-9\-/]+$/.test(path)) return null;
  const page = await getPageByPath(locale, path);
  return page ? { page, locale: locale as AppLocale, path } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await load(locale, slug);
  if (!found) return {};
  const { page } = found;
  const tr = pick(page.translations, found.locale)!;
  const seo = await getSeo("PAGE", page.id, found.locale);
  const paths: Partial<Record<AppLocale, string>> = {};
  for (const t of page.translations) if (t.locale === "en" || t.locale === "bn") paths[t.locale] = t.path;
  return buildMetadata({
    locale: found.locale,
    title: seo?.title ?? tr.title,
    description: seo?.description ?? tr.intro,
    paths,
    ogImageId: seo?.ogImageId,
    noindex: !page.showInSearch,
  });
}

/**
 * Pages built in Admin → Pages, e.g. /en/company/about.
 * Before giving up with a 404, checks Admin → Redirects for old-site URLs
 * (the middleware has already put the locale in front of them).
 */
export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params;
  const found = await load(locale, slug);

  if (!found) {
    const redirect = await findRedirect(`/${slug.join("/")}`);
    if (redirect) {
      await countRedirectHit(redirect.id);
      permanentRedirect(redirect.toPath);
    }
    notFound();
  }

  const { page } = found;
  const tr = pick(page.translations, found.locale)!;
  const sections = toSections(page, found.locale);
  const ctx = await blockContext(found.locale, mediaIdsOf(sections));
  const startsWithHero = sections[0]?.blocks[0]?.type === "HERO";

  return (
    <>
      {!startsWithHero && <PageHero title={tr.title} body={tr.intro} />}
      <Sections sections={sections} ctx={ctx} />
    </>
  );
}
