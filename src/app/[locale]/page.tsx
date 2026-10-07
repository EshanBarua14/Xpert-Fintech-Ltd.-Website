import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { EventCards } from "@/components/blocks/DataBlocks";
import {
  CtaBand,
  ecosystemModules,
  FlagshipHero,
  FlowStory,
  GhostButton,
  Principles,
  SectionHeader,
  Shell,
  StatGrid,
} from "@/components/flagship/Sections";
import { getSiteInfo } from "@/lib/content/settings";
import { LogoWall } from "@/components/organizations/LogoWall";
import { ClientMarquee } from "@/components/organizations/ClientMarquee";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { LiveApps } from "@/components/organizations/LiveApps";
import { getLiveApps } from "@/lib/public/company";
import { getShowcase } from "@/lib/public/showcase";
import { showcaseLabels } from "@/lib/public/labels";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getEvents, getPageByKey, getSeo, getTestimonials } from "@/lib/public/content";
import { TestimonialSlider } from "@/components/organizations/TestimonialSlider";
import { getFlagshipData } from "@/lib/public/flagship";
import { ecosystemInDatabase, getEcosystem, withEcosystem } from "@/lib/public/ecosystem";
import { getMarketPayload } from "@/lib/market/data";
import { MarketPulse } from "@/components/market/MarketPulse";
import { MarketReach } from "@/components/market/MarketReach";
import { getMarketGoal } from "@/lib/content/leaders";
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
  const [data, events, market, showcase] = await Promise.all([getFlagshipData(locale), getEvents(3), getMarketPayload(), getShowcase(locale)]);
  const [apps, eco, ecoInDb, testimonials, goal] = await Promise.all([getLiveApps(locale), getEcosystem(locale), ecosystemInDatabase(), getTestimonials(locale), getMarketGoal()]);
  const proof = [
    { value: data.members.length, label: t.proofMembers },
    { value: data.clients.length, label: t.proofClients },
    { value: data.offerings.length, label: t.proofProducts },
    { value: apps.length, label: t.proofApps },
    { value: data.exchanges.length, label: t.proofExchanges },
  ].filter((p) => p.value > 0);
  const hasMarket = market.mode !== "none" || market.shares.length > 0;
  // Market share and client base, with the goal (Admin → Market data). Replaces the plain figures grid.
  const showReach = market.shares.length > 0 || goal !== null;
  // Client institutions first: the client base is what this panel shows off.
  const clientBase = [...proof.filter((p) => p.label === t.proofClients), ...proof.filter((p) => p.label !== t.proofClients && p.label !== t.proofProducts)];
  const sections = page ? toSections(page, locale) : [];
  const ctx = sections.length ? await blockContext(locale, mediaIdsOf(sections)) : null;

  return (
    <>
      {orgLd}
      <FlagshipHero
        t={t}
        locale={locale}
        memberCount={data.members.length}
        modules={withEcosystem(ecosystemModules(data.offerings, locale), eco, ecoInDb)}
        graph={eco}
        // The ticker above already shows the market; the figures follow right below in "Our share of the market".
        facts={showReach ? [] : proof.filter((p) => p.label !== t.proofProducts && p.label !== t.proofExchanges)}
      />

      {data.clients.length > 0 && (
        <section id="clients" className="relative scroll-mt-28 overflow-hidden border-y border-fg/[0.06] py-12 md:py-16">
          <div className="mx-auto mb-8 w-full max-w-7xl px-4 md:px-8">
            <SectionHeader eyebrow={t.clientsEyebrow} title={t.clientsTitle.replace("{n}", new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(data.clients.length))} body={t.clientsBody} />
          </div>
          <ClientMarquee clients={data.clients} label={t.clientsEyebrow} />
        </section>
      )}

      {showReach && (
        <Shell id="reach" className="py-16 md:py-24">
          <div className="flex flex-col gap-12">
            <SectionHeader title={t.reachTitle} body={t.reachBody} />
            <MarketReach
              shares={market.shares}
              goal={goal ? { targetPct: goal.targetPct, year: goal.year, note: (locale === "bn" ? goal.bn : goal.en) || goal.en || null } : null}
              clientBase={clientBase}
              locale={locale}
              labels={{
                share: t.reachShareLabel,
                combined: t.reachCombined,
                goal: t.reachGoal,
                goalLead: t.reachGoalLead,
                goalNote: t.reachGoalNote,
                toGo: t.reachToGo,
                reached: t.reachReached,
                now: t.reachNow,
                clients: t.reachClients,
                progress: t.reachProgressLabel,
              }}
            />
          </div>
        </Shell>
      )}

      {showcase.length > 0 && (
        <Shell id="products" className="py-16 md:py-24">
          <div className="flex flex-col gap-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <SectionHeader eyebrow={t.showcaseEyebrow} title={t.showcaseTitle} body={t.showcaseBody} />
              <GhostButton href={`/${locale}/products`}>{t.exploreProducts}</GhostButton>
            </div>
            <ProductShowcase products={showcase} labels={showcaseLabels(t)} />
          </div>
        </Shell>
      )}

      {testimonials.length > 0 && (
        <Shell id="testimonials" className="py-16 md:py-24">
          <div className="flex flex-col gap-14">
            <SectionHeader title={t.testimonialsTitle} body={t.testimonialsBody} />
            <TestimonialSlider
              items={testimonials}
              labels={{
                region: t.testimonialsRegion,
                prev: t.testimonialPrev,
                next: t.testimonialNext,
                pause: t.testimonialPause,
                play: t.testimonialPlay,
                slide: t.testimonialSlide,
              }}
            />
          </div>
        </Shell>
      )}

      {hasMarket && (
        <Shell id="market" className="py-16 md:py-24">
          <div className="flex flex-col gap-12">
            <SectionHeader eyebrow={t.marketEyebrow} title={t.marketTitle} body={t.marketBody} />
            <MarketPulse initial={market} t={t} locale={locale} />
          </div>
        </Shell>
      )}

      {((!showReach && proof.length > 0) || apps.length > 0) && (
        <Shell id="proof" className="py-16 md:py-24">
          <div className="flex flex-col gap-12">
            <SectionHeader eyebrow={t.proofEyebrow} title={t.proofTitle} body={t.proofBody} />
            {!showReach && proof.length > 0 && <StatGrid items={proof} locale={locale} />}
            {apps.length > 0 && (
              <div className="flex flex-col gap-5">
                <p className="text-xs font-semibold text-text-secondary">{t.liveAppsTitle}</p>
                <LiveApps apps={apps} labels={{ android: t.getAndroidApp, ios: t.getIosApp, web: t.openWebApp }} />
              </div>
            )}
          </div>
        </Shell>
      )}

      {/* The platform's modules are on /platform; the product showcase above already walks through them. */}

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
          <LogoWall members={data.members} size="sm" />
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
