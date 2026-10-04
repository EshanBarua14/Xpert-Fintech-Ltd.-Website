import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { MarketPulse } from "@/components/market/MarketPulse";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getMarketPayload } from "@/lib/market/data";
import { fmt, signed } from "@/lib/market/format";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

// Prices change all day: render on request, never from a stale cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.marketsNav, description: t.marketsBody, paths: { en: "markets", bn: "markets" } });
}

/** Markets overview: both exchanges at a glance, then the shared market pulse. */
export default async function MarketsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const market = await getMarketPayload();
  const exchanges = market.snapshot?.exchanges ?? [];

  return (
    <>
      <PageHero eyebrow={t.marketsNav} title={t.marketsTitle} body={t.marketsBody} />
      <Shell className="pb-16">
        <div className="flex flex-col gap-10">
          <div className="grid gap-4 md:grid-cols-2">
            {(["DSE", "CSE"] as const).map((code) => {
              const ex = exchanges.find((e) => e.exchange === code);
              const idx = ex?.indices[0];
              return (
                <Link
                  key={code}
                  href={`/${locale}/markets/${code.toLowerCase()}`}
                  className="spotlight glass group flex flex-col gap-5 rounded-[2rem] p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-8"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold tracking-widest text-accent">{code}</span>
                    <span className="text-xs text-text-secondary">{code === "DSE" ? t.dseName : t.cseName}</span>
                  </span>
                  {idx ? (
                    <span className="flex items-end justify-between gap-4">
                      <span>
                        <span className="block font-mono text-xs text-text-secondary">{idx.name}</span>
                        <span className="font-display text-4xl font-semibold tabular-nums">{fmt(locale, idx.value)}</span>
                      </span>
                      <span className={idx.changePct > 0 ? "font-mono text-market-up" : idx.changePct < 0 ? "font-mono text-market-down" : "font-mono text-text-secondary"}>
                        {idx.changePct > 0 ? "▲" : idx.changePct < 0 ? "▼" : "•"} {signed(locale, idx.changePct, 2, "%")}
                      </span>
                    </span>
                  ) : ex ? (
                    <span className="font-mono text-lg">
                      <span className="text-market-up">▲ {fmt(locale, ex.advancers ?? 0, 0)}</span> <span className="text-text-secondary">• {fmt(locale, ex.unchanged ?? 0, 0)}</span>{" "}
                      <span className="text-market-down">▼ {fmt(locale, ex.decliners ?? 0, 0)}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-text-secondary">{t.marketsOffTitle}</span>
                  )}
                  <span className="text-sm font-semibold text-brand-sky group-hover:text-fg">{t.openBoard.replace("{exchange}", code)} →</span>
                </Link>
              );
            })}
          </div>
          <MarketPulse initial={market} t={t} locale={locale} />
        </div>
      </Shell>
      <CtaBand t={t} locale={locale} />
    </>
  );
}
