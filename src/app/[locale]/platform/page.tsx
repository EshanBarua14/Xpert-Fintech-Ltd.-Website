import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  capabilities,
  CapabilityBento,
  CtaBand,
  Ecosystem,
  ecosystemModules,
  FlowStory,
  PageHero,
  PrimaryButton,
  Principles,
  SectionHeader,
  Shell,
} from "@/components/flagship/Sections";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getFlagshipData, getFlowProducts } from "@/lib/public/flagship";
import { exchangeLogos } from "@/components/market/ExchangeMark";
import { ecosystemInDatabase, getEcosystem, withEcosystem } from "@/lib/public/ecosystem";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.platformPageTitle, description: t.platformPageBody, paths: { en: "platform", bn: "platform" } });
}

/** Overview of the whole suite. Each capability links to its product page once that is published. */
export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const [data, eco, ecoInDb, flowProducts] = await Promise.all([getFlagshipData(locale), getEcosystem(locale), ecosystemInDatabase(), getFlowProducts(locale)]);

  return (
    <>
      <PageHero eyebrow={t.platformEyebrow} title={t.platformPageTitle} body={t.platformPageBody}>
        <div data-reveal style={{ "--d": 3 } as CSSProperties}>
          <PrimaryButton href={`/${locale}/request-demo`}>{t.requestDemo}</PrimaryButton>
        </div>
      </PageHero>
      <Shell className="pb-16 md:pb-20">
        <CapabilityBento items={capabilities(t, locale, data.publishedSlugs)} anchors />
      </Shell>
      <Shell className="py-12 md:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow={t.ecosystemEyebrow} title={t.ecosystemTitle} body={t.ecosystemBody} />
          <div data-reveal>
            <Ecosystem t={t} locale={locale} logos={data.logos} modules={withEcosystem(ecosystemModules(data.offerings, locale), eco, ecoInDb)} graph={eco} />
          </div>
        </div>
      </Shell>
      <Shell className="py-12 md:py-16">
        <div className="flex flex-col gap-16">
          <SectionHeader eyebrow={t.flowEyebrow} title={t.flowTitle} align="center" />
          <FlowStory t={t} products={flowProducts} exchanges={exchangeLogos(data.logos.parties)} />
        </div>
      </Shell>
      <Shell className="py-12 md:py-16">
        <div className="flex flex-col gap-14">
          <SectionHeader eyebrow={t.principlesEyebrow} title={t.principlesTitle} />
          <Principles t={t} />
        </div>
      </Shell>
      <CtaBand t={t} locale={locale} />
    </>
  );
}
