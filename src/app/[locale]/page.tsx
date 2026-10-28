import { plain } from "@/components/ui/Emph";
import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { getReviewSeconds } from "@/lib/content/reviews";
import { getDesign, type HomeSection } from "@/lib/content/design";
import { contentSlots, editorHints } from "@/lib/env/hints";
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
import { getLiveApps, getOtherClients } from "@/lib/public/company";
import { getShowcase } from "@/lib/public/showcase";
import { RoleGuide } from "@/components/flagship/RoleGuide";
import { FiguresStrip } from "@/components/flagship/FiguresStrip";
import { ContentSlot } from "@/components/ui/ContentSlot";
import { digits } from "@/lib/i18n/digits";
import { getFigures } from "@/lib/content/figures";
import { rmsLabels, showcaseLabels } from "@/lib/public/labels";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getEvents, getPageByKey, getSeo, getTestimonials } from "@/lib/public/content";
import { TestimonialSlider } from "@/components/organizations/TestimonialSlider";
import { getFlagshipData, getFlowProducts, getRiskPageHref } from "@/lib/public/flagship";
import { RmsPipeline } from "@/components/products/RmsPipeline";
import { ecosystemInDatabase, getEcosystem, withEcosystem } from "@/lib/public/ecosystem";
import { getMarketPayload } from "@/lib/market/data";
import { MarketPulse } from "@/components/market/MarketPulse";
import { MarketReach } from "@/components/market/MarketReach";
import { HeroIndices } from "@/components/market/HeroIndices";
import { CoreStrengths } from "@/components/flagship/CoreStrengths";
import { SavingsGraphic } from "@/components/flagship/SavingsGraphic";
import { PhoneStage } from "@/components/flagship/PhoneStage";
import { OwnershipShowcase } from "@/components/flagship/OwnershipShowcase";
import { HomeSectionNav } from "@/components/flagship/HomeSectionNav";
import { IntegrationSection } from "@/components/flagship/IntegrationSection";
import { getOwnership } from "@/lib/public/ownership";
import { getSavings, getStrengths } from "@/lib/content/highlights";
import { exchangeLogos } from "@/components/market/ExchangeMark";
import { CredentialsInline } from "@/components/blocks/CredentialsBand";
import { getCredentials } from "@/lib/content/credentials";
import { getHeadlineShare, getMarketGoal } from "@/lib/content/leaders";
import { blockContext, buildMetadata, JsonLd, SITE_URL } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageByKey("home");
  const seo = page ? await getSeo("PAGE", page.id, locale) : null;
  const meta = await buildMetadata({
    locale,
    title: seo?.title ?? getMessages(locale).seoHomeTitle,
    description: seo?.description ?? getMessages(locale).seoHomeDesc,
    paths: { en: "", ...(page?.translations.some((t) => t.locale === "bn") ? { bn: "" } : {}) },
    ogImageId: seo?.ogImageId,
  });
  // The home page title stands alone, without the " · Xpert Fintech Ltd." suffix.
  return { ...meta, title: { absolute: seo?.title ?? getMessages(locale).seoHomeTitle } };
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
        alternateName: ["Xpert Fintech", "এক্সপার্ট ফিনটেক"],
        description: getMessages(locale).seoHomeDesc,
        areaServed: { "@type": "Country", name: "Bangladesh" },
        knowsAbout: ["Order management system (OMS)", "Risk management system (RMS)", "eKYC", "BO account opening", "Brokerage back office", "Document management", "Dhaka Stock Exchange", "Chittagong Stock Exchange"],
      }}
    />
  );
  // The site itself, with its search, so Google can offer a search box for it.
  const siteLd = (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: info.companyName,
        url: `${SITE_URL}/${locale}`,
        inLanguage: locale === "bn" ? "bn-BD" : "en",
        publisher: { "@type": "Organization", name: info.companyName, url: SITE_URL },
        potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/${locale}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
      }}
    />
  );

  const t = getMessages(locale);
  // Everything the page needs, read at the same time (not one batch after another).
  const [[data, events, market, showcase, credentials], [apps, eco, ecoInDb, testimonials, goal, flowProducts, headline, design, reviewSeconds, figures, riskHref]] = await Promise.all([
    Promise.all([getFlagshipData(locale), getEvents(3), getMarketPayload(), getShowcase(locale), getCredentials(locale)]),
    Promise.all([getLiveApps(locale), getEcosystem(locale), ecosystemInDatabase(), getTestimonials(locale), getMarketGoal(), getFlowProducts(locale), getHeadlineShare(), getDesign(), getReviewSeconds(), getFigures(), getRiskPageHref(locale)]),
  ]);
  const [otherClients, strengths, savings, ownership] = await Promise.all([getOtherClients(locale), getStrengths(locale), getSavings(locale, { drafts: editorHints() }), getOwnership(locale)]);
  const proof = [
    { value: data.members.length, label: t.proofMembers },
    { value: data.clients.length, label: t.proofClients },
    { value: data.offerings.length, label: t.proofProducts },
    { value: apps.length, label: t.proofApps },
    { value: data.exchanges.length, label: t.proofExchanges },
  ].filter((p) => p.value > 0);
  const hasMarket = market.mode !== "none" || market.shares.length > 0;
  // Market share and client base, with the goal (Admin → Market data). Replaces the plain figures grid.
  const showReach = market.shares.length > 0 || goal !== null || headline !== null;
  // Client institutions first: the client base is what this panel shows off.
  const clientBase = [...proof.filter((p) => p.label === t.proofClients), ...proof.filter((p) => p.label !== t.proofClients && p.label !== t.proofProducts)];
  // Sections switched off in Admin → Design → Home page.
  const show = (key: HomeSection) => !design.hidden.includes(key);
  const sections = page ? toSections(page, locale) : [];
  const ctx = sections.length ? await blockContext(locale, mediaIdsOf(sections)) : null;

  // Each home section as its own block, so Admin → Design can set the order.
  const homeBlocks: Record<HomeSection, ReactNode> = {
    clients: (
    <>
      {show("clients") && data.clients.length > 0 && (
        <section id="clients" data-nav={locale === "bn" ? "গ্রাহক" : "Clients"} className="relative scroll-mt-28 overflow-hidden border-y border-fg/[0.06] py-12 md:py-16">
          <div className="mx-auto mb-8 w-full max-w-7xl px-4 md:px-8">
            <SectionHeader eyebrow={t.clientsEyebrow} title={t.clientsTitle.replace("{n}", new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(data.clients.length))} />
          </div>
          <ClientMarquee clients={data.clients} label={t.clientsEyebrow} />
        </section>
      )}
    </>
  ),
    reach: (
    <>
      {show("reach") && showReach && (
        <Shell id="reach" nav={locale === "bn" ? "বাজারের অংশ" : "Market share"} className="py-12 md:py-16">
          <div className="flex flex-col gap-12">
            {/* The headline figure (Admin → Market data) leads the section when there is one. */}
            <SectionHeader
              title={
                headline?.dse
                  ? t.reachTitleShare.replace("{pct}%", `${digits(headline.dse, locale === "bn")}%${headline.plus ? "+" : ""}`)
                  : headline?.cse
                    ? t.reachTitleShareCse.replace("{pct}%", `${digits(headline.cse, locale === "bn")}%${headline.plus ? "+" : ""}`)
                    : t.reachTitle
              }
            />
            <MarketReach
              shares={market.shares}
              headline={headline}
              goal={goal ? { targetPct: goal.targetPct, year: goal.year, note: (locale === "bn" ? goal.bn : goal.en) || goal.en || null } : null}
              clientBase={clientBase}
              // Admin → Figures join the client base in one card ("Xpert Fintech in numbers").
              figures={figures.map((f) => ({
                value: digits(f.value, locale === "bn"),
                label: (locale === "bn" && f.labelBn) || f.labelEn,
                source: `${t.marketSource}: ${f.source}${f.asOf ? ` (${new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${f.asOf}T00:00:00Z`))})` : ""}`,
              }))}
              figureSlot={figures.length === 0 && contentSlots() ? <ContentSlot kind="figure" locale={locale} title={`${t.figureSlotOrders}, ${t.figureSlotYears}, ${t.figureSlotMembers}`} adminHref="/admin/figures" className="min-h-0" /> : undefined}
              numbersTitle={t.figuresTitle}
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
                overall: t.reachOverall,
                exchange: t.reachExchangeShare,
                pending: t.reachPending,
                source: t.source,
              }}
            />
          </div>
        </Shell>
      )}
    </>
  ),
    figures: (
    <>
      {/* Figures sit in the market-share card; on their own only when that section is not shown. */}
      {show("figures") && !(show("reach") && showReach) && (figures.length > 0 || contentSlots()) && (
        <Shell id="figures" nav={locale === "bn" ? "সংখ্যায়" : "In numbers"} className="py-12 md:py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.figuresTitle} />
            <FiguresStrip figures={figures} t={t} locale={locale} slots={contentSlots()} />
          </div>
        </Shell>
      )}
    </>
  ),
    showcase: (
    <>
      {show("showcase") && showcase.length > 0 && (
        <Shell id="products" nav={locale === "bn" ? "পণ্য" : "Products"} className="py-12 md:py-16">
          <div className="flex flex-col gap-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <SectionHeader eyebrow={t.showcaseEyebrow} title={t.showcaseTitle} />
              <GhostButton href={`/${locale}/products`}>{t.exploreProducts}</GhostButton>
            </div>
            <ProductShowcase products={showcase} labels={showcaseLabels(t)} />
          </div>
        </Shell>
      )}
    </>
  ),
    integration: (
    <>
      {show("integration") && (
        <Shell id="integration" nav={locale === "bn" ? "ইন্টিগ্রেশন" : "Integration"} className="py-12 md:py-16">
          <IntegrationSection t={t} locale={locale} />
        </Shell>
      )}
    </>
  ),
    phones: (
    <>
      {show("phones") && (
        <Shell id="mobile" nav={locale === "bn" ? "মোবাইল" : "Mobile"} className="py-12 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="flex flex-col gap-6">
              <SectionHeader
                title={locale === "bn" ? "আপনার ব্রোকারেজ, *প্রতিটি পকেটে*।" : "Your brokerage, *in every pocket*."}
                body={
                  locale === "bn"
                    ? "যে প্ল্যাটফর্মে ডিলিং ডেস্ক চলে, সেটিই চালায় প্রতিটি হাউসের নিজস্ব ট্রেডিং অ্যাপ। বিও অ্যাকাউন্ট খোলা থেকে প্রথম অর্ডার পর্যন্ত, সবই ফোনে।"
                    : "The platform that runs the dealing desk also powers each house's own trading app. From opening a BO account to the first order, all on a phone."
                }
              />
              {apps.length > 0 && (
                <p className="flex items-baseline gap-3">
                  <span className="font-display text-5xl font-semibold text-text-primary tabular-nums">{digits(apps.length, locale === "bn")}</span>
                  <span className="text-sm text-text-secondary">{locale === "bn" ? "টি ব্র্যান্ডেড অ্যাপ ইতিমধ্যে চালু" : "branded apps already live"}</span>
                </p>
              )}
              <GhostButton href={`/${locale}/consortium`}>{locale === "bn" ? "চালু অ্যাপগুলো দেখুন" : "See the live apps"}</GhostButton>
            </div>
            <PhoneStage
              shots={showcase.flatMap((p) => p.shots.filter((s) => s.device === "PHONE" || (s.width && s.height && s.height > s.width * 1.4)))}
              labels={
                locale === "bn"
                  ? { trade: "ট্রেড", buy: "কিনুন", sell: "বিক্রি", account: "বিও অ্যাকাউন্ট খুলুন", steps: ["ব্যক্তিগত তথ্য", "এনআইডি যাচাই", "নমিনি", "ব্যাংক হিসাব"], verify: "ই-কেওয়াইসি", verifying: "যাচাই চলছে", illustration: "চিত্রিত উদাহরণ" }
                  : { trade: "Trade", buy: "Buy", sell: "Sell", account: "Open a BO account", steps: ["Personal details", "NID check", "Nominee", "Bank account"], verify: "eKYC", verifying: "Verifying", illustration: "Illustration" }
              }
            />
          </div>
        </Shell>
      )}
    </>
  ),
    apps: (
    <>
      {show("apps") && ((!showReach && proof.length > 0) || apps.length > 0) && (
        <Shell id="proof" nav={locale === "bn" ? "চালু অ্যাপ" : "Live apps"} className="py-12 md:py-16">
          <div className="flex flex-col gap-12">
            <SectionHeader eyebrow={t.proofEyebrow} title={t.proofTitle} />
            {!showReach && proof.length > 0 && <StatGrid items={proof} locale={locale} />}
            {apps.length > 0 && (
              <div className="flex flex-col gap-5">
                <p className="text-xs font-semibold text-text-secondary">{t.liveAppsTitle}</p>
                <LiveApps apps={apps} others={otherClients} labels={{ android: t.getAndroidApp, ios: t.getIosApp, web: t.openWebApp, site: t.brokerWebsite, othersTitle: t.otherClientsTitle, featured: t.featuredApp, rank: { broker: t.rankBroker, asOf: t.rankAsOf, source: t.rankSourceLabel }, locale }} />
              </div>
            )}
          </div>
        </Shell>
      )}
    </>
  ),
    savings: (
    <>
      {show("savings") && savings && (
        <Shell id="savings" nav={locale === "bn" ? "সাশ্রয়" : "Savings"} className="py-12 md:py-16">
          <SavingsGraphic data={savings} locale={locale} />
        </Shell>
      )}
      {show("savings") && !savings && editorHints() && (
        <Shell id="savings" className="py-12 md:py-16">
          <ContentSlot kind="figure" locale={locale} title="Cost savings graphic: enter the cost before and with Xpert Fintech, with its source" adminHref="/admin/highlights" className="min-h-0" />
        </Shell>
      )}
    </>
  ),
    roles: (
    <>
      {show("roles") && showcase.length > 0 && (
        <Shell id="roles" nav={locale === "bn" ? "ডেস্ক অনুযায়ী" : "By desk"} className="py-12 md:py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.rolesTitle} />
            <RoleGuide t={t} products={showcase} />
          </div>
        </Shell>
      )}
    </>
  ),
    flow: (
    <>
      {show("flow") && (
      <Shell id="flow" nav={locale === "bn" ? "অর্ডার ফ্লো" : "Order flow"} className="py-12 md:py-16">
        <div className="flex flex-col gap-16">
          <SectionHeader eyebrow={t.flowEyebrow} title={t.flowTitle} align="center" />
          <FlowStory t={t} products={flowProducts} exchanges={exchangeLogos(data.logos.parties)} riskHref={riskHref} />
        </div>
      </Shell>
      )}
    </>
  ),
    rms: (
    <>
      {/* RMS, built into the OMS: sample orders checked live (Admin → Design can hide it). */}
      {show("rms") && data.publishedSlugs.has("trading-platform") && (
      <Shell id="rms" nav={locale === "bn" ? "ঝুঁকি যাচাই" : "Risk checks"} className="py-12 md:py-16">
        <div className="flex flex-col gap-10">
          <SectionHeader title={t.rmsTitle} body={t.rmsBody} />
          <div data-reveal>
            <RmsPipeline labels={rmsLabels(t, riskHref)} locale={locale} />
          </div>
        </div>
      </Shell>
      )}
    </>
  ),
    ownership: (
    <>
      {/* Who owns Xpert Fintech: paid-up capital and the owner houses by basis (Admin → Home highlights, Organizations). */}
      {show("ownership") && ownership && (
        <Shell id="ownership" nav={locale === "bn" ? "মালিকানা" : "Owners"} className="py-12 md:py-16">
          <OwnershipShowcase data={ownership} locale={locale} />
        </Shell>
      )}
    </>
  ),
    strengths: (
    <>
      {show("strengths") && strengths.items.length > 0 && (
        <Shell id="strengths" nav={locale === "bn" ? "শক্তি" : "Strengths"} className="py-12 md:py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={strengths.title} body={strengths.intro || null} />
            <CoreStrengths items={strengths.items} locale={locale} label={plain(strengths.title)} />
          </div>
        </Shell>
      )}
    </>
  ),
    testimonials: (
    <>
      {/* Outside production, an empty reviews section says how to fill it instead of disappearing. */}
      {show("testimonials") && testimonials.length === 0 && editorHints() && (
        <Shell id="testimonials" className="py-12 md:py-16">
          <div className="flex flex-col gap-8">
            <SectionHeader title={t.testimonialsTitle} />
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-gold/50 bg-gold/[0.04] p-6 md:p-8">
              <p className="font-semibold text-gold">Only visible outside the live site: no client reviews yet.</p>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                Add one in Admin → Testimonials with the client&rsquo;s photo, name, job title, company and quote. Tick &ldquo;Written approval on file&rdquo; and publish it, and this
                section shows the review cards on the live site.
              </p>
              <Link href="/admin/testimonials/new" className="inline-flex h-10 items-center rounded-full border border-gold/50 px-4 text-sm font-semibold text-gold hover:bg-gold/10">
                Add a client review
              </Link>
            </div>
          </div>
        </Shell>
      )}

      {show("testimonials") && testimonials.length > 0 && (
        <Shell id="testimonials" nav={locale === "bn" ? "মতামত" : "Reviews"} className="py-12 md:py-16">
          <div className="flex flex-col gap-14">
            <SectionHeader title={t.testimonialsTitle} />
            <TestimonialSlider
              items={testimonials}
              seconds={reviewSeconds}
              labels={{
                region: t.testimonialsRegion,
                prev: t.testimonialPrev,
                next: t.testimonialNext,
                pause: t.testimonialPause,
                play: t.testimonialPlay,
                slide: t.testimonialSlide,
                rating: t.testimonialRating,
                ratingShort: t.testimonialRatingShort,
                digits: locale === "bn" ? "০১২৩৪৫৬৭৮৯" : undefined,
                pending: locale === "bn" ? "মতামত শিগগিরই আসছে।" : "Review coming soon.",
                unnamed: locale === "bn" ? "নাম শিগগিরই যোগ হবে" : "Name to be added",
                contact: { linkedin: t.linkedinProfile, email: t.emailPerson, linkedinSearch: t.linkedinSearch, emailMissing: t.emailMissing, website: locale === "bn" ? "ওয়েবসাইট" : "Website" },
              }}
            />
          </div>
        </Shell>
      )}
    </>
  ),
    consortium: (
    <>
      {show("consortium") && (
      <Shell id="consortium" nav={locale === "bn" ? "কনসোর্টিয়াম" : "Consortium"} className="py-12 md:py-16">
        <div className="flex flex-col gap-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeader eyebrow={t.consortiumEyebrow} title={t.consortiumTitle} />
            <GhostButton href={`/${locale}/consortium`}>{t.meetConsortium}</GhostButton>
          </div>
          <LogoWall members={data.members} size="sm" />
        </div>
      </Shell>
      )}
    </>
  ),
    principles: (
    <>
      {show("principles") && (
      <Shell id="principles" nav={locale === "bn" ? "নীতি" : "Principles"} className="py-12 md:py-16">
        <div className="flex flex-col gap-14">
          <SectionHeader title={t.principlesTitle} />
          <Principles t={t} />
        </div>
      </Shell>
      )}
    </>
  ),
    market: (
    <>
      {design.homeMarket && hasMarket && (
        <Shell id="market" nav={locale === "bn" ? "আজকের বাজার" : "Today's market"} className="py-12 md:py-16">
          <div className="flex flex-col gap-12">
            <SectionHeader eyebrow={t.marketEyebrow} title={t.marketTitle} />
            <MarketPulse initial={market} t={t} locale={locale} logos={exchangeLogos(data.logos.parties)} />
          </div>
        </Shell>
      )}
    </>
  ),
    custom: (
    <>
      {/* Sections added in Admin → Pages → Home appear here. */}
      {ctx && <Sections sections={sections} ctx={ctx} />}
    </>
  ),
    events: (
    <>
      {show("events") && events.length > 0 && (
        <Shell id="events" nav={locale === "bn" ? "ইভেন্ট" : "Events"} className="py-12 md:py-16">
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
    </>
  ),
  };

  return (
    <>
      {orgLd}
      {siteLd}
      <FlagshipHero
        t={t}
        locale={locale}
        memberCount={data.members.length}
        modules={withEcosystem(ecosystemModules(data.offerings, locale), eco, ecoInDb)}
        graph={eco}
        logos={data.logos}
        credentials={credentials.length ? <CredentialsInline items={credentials} label={t.credentialsTitle} /> : undefined}
        // The figures follow right below in "Our share of the market".
        // Who built it, in three real numbers: the brokerage houses that own Xpert Fintech, the institutions on it, the apps live.
        facts={[
          { value: data.members.length, label: t.proofMembers },
          { value: data.clients.length, label: t.proofClients },
          { value: apps.length, label: t.proofApps },
        ].filter((f) => f.value > 0)}
        market={design.heroIndices && market.mode !== "none" ? <HeroIndices initial={market} t={t} locale={locale} logos={exchangeLogos(data.logos.parties)} /> : undefined}
      />

      {/* Sections in the order set in Admin → Design → Home page (hidden ones are skipped inside each block). */}
      {design.order.map((key) => (
        <Fragment key={key}>{homeBlocks[key]}</Fragment>
      ))}

      <CtaBand t={t} locale={locale} />
      <HomeSectionNav label={locale === "bn" ? "এই পাতায়" : "On this page"} />
    </>
  );
}
