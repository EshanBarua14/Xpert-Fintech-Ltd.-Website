import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { EventCards } from "@/components/blocks/DataBlocks";
import { ProductCard } from "@/components/products/ProductCard";
import { MarketNetwork } from "@/components/diagrams/MarketNetwork";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getEvents, getOfferings, getPageByKey, getSeo } from "@/lib/public/content";
import { blockContext, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [page, info] = await Promise.all([getPageByKey("home"), getSiteInfo(locale)]);
  const seo = page ? await getSeo("PAGE", page.id, locale) : null;
  const meta = await buildMetadata({
    locale,
    title: seo?.title ?? info.companyName,
    description: seo?.description,
    paths: { en: "", ...(page?.translations.some((t) => t.locale === "bn") ? { bn: "" } : {}) },
    ogImageId: seo?.ogImageId,
  });
  // The home page title stands alone, without the " · Xpert Fintech Ltd." suffix.
  return { ...meta, title: { absolute: seo?.title ?? info.companyName } };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [page, info] = await Promise.all([getPageByKey("home"), getSiteInfo(locale)]);

  const orgLd = (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: info.companyName,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/xpert-logo.png`,
        ...(info.email && { email: info.email }),
        ...(info.phone && { telephone: info.phone }),
        ...(info.address && { address: { "@type": "PostalAddress", streetAddress: info.address, addressCountry: "BD" } }),
        sameAs: info.socialLinks.map((s) => s.url),
      }}
    />
  );

  const sections = page ? toSections(page, locale) : [];
  if (sections.length) {
    const ctx = await blockContext(locale, mediaIdsOf(sections));
    return (
      <>
        {orgLd}
        <Sections sections={sections} ctx={ctx} />
      </>
    );
  }

  // Until a Home page is built and published in Admin → Pages, show a simple,
  // factual home built from Settings, Products and Events.
  return (
    <>
      {orgLd}
      <DefaultHome locale={locale} companyName={info.companyName} summary={info.summary} />
    </>
  );
}

async function DefaultHome({ locale, companyName, summary }: { locale: "en" | "bn"; companyName: string; summary: string | null }) {
  const t = getMessages(locale);
  const [offerings, events] = await Promise.all([getOfferings({ limit: 8 }), getEvents(3)]);
  return (
    <>
      <section className="bg-grid">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl">{companyName}</h1>
            {summary && <p className="max-w-xl text-lg text-text-secondary">{summary}</p>}
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/${locale}/request-demo`} size="lg">
                {t.requestDemo}
              </ButtonLink>
              {offerings.length > 0 && (
                <ButtonLink href={`/${locale}/products`} size="lg" variant="secondary">
                  {t.exploreProducts}
                </ButtonLink>
              )}
            </div>
          </div>
          <MarketNetwork caption={t.conceptualView} />
        </Container>
      </section>
      {offerings.length > 0 && (
        <section>
          <Container className="flex flex-col gap-10 py-16 md:py-24">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">{t.products}</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {offerings.map((o) => (
                <li key={o.id}>
                  <ProductCard offering={o} locale={locale} t={t} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
      {events.length > 0 && (
        <section className="bg-navy-900">
          <Container className="flex flex-col gap-10 py-16 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold md:text-4xl">{t.events}</h2>
              <Link href={`/${locale}/events`} className="text-sm text-brand-sky hover:underline">
                {t.allEvents} →
              </Link>
            </div>
            <EventCards events={events} locale={locale} />
          </Container>
        </section>
      )}
    </>
  );
}
