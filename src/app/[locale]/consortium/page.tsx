import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { MarketGlobe } from "@/components/flagship/MarketGlobe";
import { LogoWall, monogram } from "@/components/organizations/LogoWall";
import Image from "next/image";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getFlagshipData } from "@/lib/public/flagship";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.consortiumPageTitle, description: t.consortiumPageBody, paths: { en: "consortium", bn: "consortium" } });
}

/** The member brokerage houses and exchanges, from Admin → Organizations. */
export default async function ConsortiumPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const data = await getFlagshipData(locale);

  return (
    <>
      <PageHero eyebrow={t.consortiumEyebrow} title={t.consortiumPageTitle} body={t.consortiumPageBody} />


      {data.members.length > 0 && (
        <Shell className="py-16 md:py-24">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="flex flex-col gap-8 lg:sticky lg:top-32">
              <SectionHeader title={t.members} />
              <div data-reveal className="relative mx-auto aspect-square w-full max-w-md">
                <MarketGlobe routes={data.members.length} />
                <span className="glass absolute right-2 bottom-2 rounded-full px-3 py-1 text-xs text-text-secondary">{t.conceptualView}</span>
              </div>
            </div>
            <LogoWall members={data.members} columns={2} />
          </div>
        </Shell>
      )}

      {data.exchanges.length > 0 && (
        <Shell className="py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.exchanges} />
            <ul className="grid gap-4 md:grid-cols-2">
              {data.exchanges.map((e, i) => (
                <li key={e.id} data-reveal style={{ "--d": i } as CSSProperties} className="group flex items-center gap-5 rounded-2xl border border-fg/10 p-8">
                  {e.logo ? (
                    <Image src={e.logo.url} alt="" width={e.logo.width ?? 160} height={e.logo.height ?? 64} className="member-logo h-14 w-auto max-w-[8rem] object-contain" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-sky/10 font-mono text-sm font-semibold text-cyan-300">
                      {monogram(e.name, e.shortName)}
                    </span>
                  )}
                  <span className="font-display text-xl font-semibold">{e.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </Shell>
      )}

      <CtaBand t={t} locale={locale} />
    </>
  );
}
