import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand, PageHero, Shell } from "@/components/flagship/Sections";
import { MarketBoard } from "@/components/market/MarketBoard";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getMarketPayload } from "@/lib/market/data";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string; exchange: string }> };

export const dynamic = "force-dynamic";

const code = (s: string) => (s === "dse" ? "DSE" : s === "cse" ? "CSE" : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, exchange } = await params;
  const ex = code(exchange);
  if (!isLocale(locale) || !ex) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: `${ex} · ${t.marketsNav}`, description: t.marketsBody, paths: { en: `markets/${exchange}`, bn: `markets/${exchange}` } });
}

/** One exchange's live board. */
export default async function ExchangePage({ params }: Props) {
  const { locale, exchange } = await params;
  const ex = code(exchange);
  if (!isLocale(locale) || !ex) notFound();
  const t = getMessages(locale);
  const market = await getMarketPayload();
  const other = ex === "DSE" ? "CSE" : "DSE";
  return (
    <>
      <PageHero eyebrow={t.marketsNav} title={ex === "DSE" ? t.dseName : t.cseName}>
        <nav aria-label={t.marketsNav} className="flex flex-wrap gap-2 text-sm">
          <Link href={`/${locale}/markets`} className="rounded-full border border-fg/15 px-4 py-2 font-semibold hover:border-brand-sky/60">
            ← {t.marketsNav}
          </Link>
          <Link href={`/${locale}/markets/${other.toLowerCase()}`} className="rounded-full border border-fg/15 px-4 py-2 font-semibold hover:border-brand-sky/60">
            {t.openBoard.replace("{exchange}", other)}
          </Link>
        </nav>
      </PageHero>
      <Shell className="pb-14 md:pb-16">
        <MarketBoard initial={market} exchange={ex} t={t} locale={locale} basePath={`/${locale}/markets/${exchange}`} />
      </Shell>
      <CtaBand t={t} locale={locale} />
    </>
  );
}
