import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { MarketGlobe } from "@/components/flagship/MarketGlobe";
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
            <ol className="grid gap-3 sm:grid-cols-2">
              {data.members.map((m, i) => {
                const body = (
                  <>
                                        <span className="font-display text-lg leading-snug font-semibold">{m.name}</span>
                    {m.websiteUrl && <span className="mt-auto text-xs text-text-secondary group-hover:text-cyan-300">{t.visitWebsite} ↗</span>}
                  </>
                );
                const cls = "spotlight glass group flex h-full min-h-36 flex-col gap-3 rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1";
                return (
                  <li key={m.id} data-reveal style={{ "--d": i % 4 } as CSSProperties}>
                    {m.websiteUrl ? (
                      <a href={m.websiteUrl} target="_blank" rel="noopener noreferrer" className={cls}>
                        {body}
                      </a>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </Shell>
      )}

      {data.exchanges.length > 0 && (
        <Shell className="py-16">
          <div className="flex flex-col gap-10">
            <SectionHeader title={t.exchanges} />
            <ul className="grid gap-4 md:grid-cols-2">
              {data.exchanges.map((e, i) => (
                <li key={e.id} data-reveal style={{ "--d": i } as CSSProperties} className="flex items-center gap-5 rounded-2xl border border-fg/10 p-8">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-sky/10 font-mono text-sm font-semibold text-cyan-300">
                    {e.name
                      .split(/\s+/)
                      .filter((w) => /^[A-Z]/.test(w))
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 3)}
                  </span>
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
