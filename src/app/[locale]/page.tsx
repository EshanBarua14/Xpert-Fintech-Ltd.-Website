import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { EventCards } from "@/components/blocks/DataBlocks";
import {
  capabilities,
  CapabilityBento,
  CtaBand,
  FlagshipHero,
  FlowStory,
  GhostButton,
  MemberBoard,
  Principles,
  SectionHeader,
  Shell,
} from "@/components/flagship/Sections";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getEvents, getPageByKey, getSeo } from "@/lib/public/content";
import { getFlagshipData } from "@/lib/public/flagship";
import { getMarketPayload } from "@/lib/market/data";
import { MarketPulse } from "@/components/market/MarketPulse";
import { MarketTicker } from "@/components/market/MarketTicker";
import { MarketStatusLine } from "@/components/market/MarketStatusLine";
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

  const t = getMessages(locale);
  const [data, events, market] = await Promise.all([getFlagshipData(locale), getEvents(3), getMarketPayload()]);
  const hasMarket = !!market.snapshot || market.shares.length > 0;
  const sections = page ? toSections(page, locale) : [];
  const ctx = sections.length ? await blockContext(locale, mediaIdsOf(sections)) : null;
  const caps = capabilities(t, locale, data.publishedSlugs);

  return (
    <>
      {orgLd}
      <FlagshipHero
        t={t}
        locale={locale}
        memberCount={data.members.length}
        ticker={market.snapshot ? <MarketTicker initial={market} t={t} locale={locale} /> : undefined}
        status={market.snapshot ? <MarketStatusLine initial={market} t={t} locale={locale} /> : undefined}
      />

      {hasMarket && (
        <Shell id="market" className="py-20 md:py-28">
          <div className="flex flex-col gap-12">
            <SectionHeader eyebrow={t.marketEyebrow} title={t.marketTitle} body={t.marketBody} />
            <MarketPulse initial={market} t={t} locale={locale} />
          </div>
        </Shell>
      )}

      <Shell className="py-20 md:py-28">
        <div className="flex flex-col gap-14">
          <SectionHeader eyebrow={t.platformEyebrow} title={t.platformTitle} body={t.platformBody} />
          <CapabilityBento items={caps} />
        </div>
      </Shell>

      <Shell className="py-16 md:py-24">
        <div className="flex flex-col gap-16">
          <SectionHeader eyebrow={t.flowEyebrow} title={t.flowTitle} body={t.flowBody} align="center" />
          <FlowStory t={t} />
        </div>
      </Shell>

      <Shell className="py-16 md:py-24">
        <div className="flex flex-col gap-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeader eyebrow={t.consortiumEyebrow} title={t.consortiumTitle} body={t.consortiumBody} />
            <GhostButton href={`/${locale}/consortium`}>{t.meetConsortium}</GhostButton>
          </div>
          <MemberBoard names={data.members.map((m) => m.name)} />
        </div>
      </Shell>

      <Shell className="py-16 md:py-24">
        <div className="flex flex-col gap-14">
          <SectionHeader title={t.principlesTitle} />
          <Principles t={t} />
        </div>
      </Shell>

      {/* Sections added in Admin → Pages → Home appear here. */}
      {ctx && <Sections sections={sections} ctx={ctx} />}

      {events.length > 0 && (
        <Shell className="py-16 md:py-24">
          <div className="flex flex-col gap-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader eyebrow={t.latestEyebrow} title={t.events} />
              <Link href={`/${locale}/events`} className="text-sm font-semibold text-brand-sky hover:text-fg">
                {t.allEvents}
              </Link>
            </div>
            <EventCards events={events} locale={locale} />
          </div>
        </Shell>
      )}

      <CtaBand t={t} locale={locale} />
    </>
  );
}
