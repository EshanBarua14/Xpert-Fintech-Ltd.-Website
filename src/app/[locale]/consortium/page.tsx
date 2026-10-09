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
        <Shell className="py-10 md:py-12">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(8rem+var(--ticker-h))]">
              <SectionHeader title={t.members} />
              <div data-reveal className="relative mx-auto aspect-square w-full max-w-md">
                <MarketGlobe routes={data.members.length} />
              </div>
            </div>
            <LogoWall members={data.members} columns={2} />
          </div>
        </Shell>
      )}

      {data.exchanges.length > 0 && (
        <Shell className="py-12">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.exchanges} />
            <ul className="grid gap-4 md:grid-cols-2">
              {data.exchanges.map((e, i) => {
                const inner = (
                  <>
                    {e.logo ? (
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ring-black/5">
                        <Image src={e.logo.url} alt="" width={e.logo.width ?? 160} height={e.logo.height ?? 64} className="size-full object-contain" />
                      </span>
                    ) : (
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-sky/10 font-mono text-sm font-semibold text-accent">
                        {monogram(e.name, e.shortName)}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-display text-xl font-semibold">{e.name}</span>
                      {e.websiteUrl && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-sky group-hover:underline">
                          {e.websiteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          <span aria-hidden="true">↗</span>
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={e.id} data-reveal style={{ "--d": i } as CSSProperties} className="flex">
                    {e.websiteUrl ? (
                      <a
                        href={e.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center gap-5 rounded-2xl border border-fg/10 p-6 transition-colors hover:border-brand-sky/50 hover:bg-brand-sky/[0.04] sm:p-8"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex w-full items-center gap-5 rounded-2xl border border-fg/10 p-6 sm:p-8">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Shell>
      )}

      <CtaBand t={t} locale={locale} />
    </>
  );
}
