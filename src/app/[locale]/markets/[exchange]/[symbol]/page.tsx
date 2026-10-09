import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/flagship/Sections";
import { QuoteView } from "@/components/market/QuoteView";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getMarketPayload } from "@/lib/market/data";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string; exchange: string; symbol: string }> };

export const dynamic = "force-dynamic";

const code = (s: string) => (s === "dse" ? "DSE" : s === "cse" ? "CSE" : null);
const SYMBOL = /^[A-Z0-9&-]{1,24}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, exchange, symbol } = await params;
  const ex = code(exchange);
  const sym = decodeURIComponent(symbol).toUpperCase();
  if (!isLocale(locale) || !ex || !SYMBOL.test(sym)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: `${sym} · ${ex}`, description: t.marketsBody, paths: { en: `markets/${exchange}/${sym}`, bn: `markets/${exchange}/${sym}` }, noindex: true });
}

/** A symbol's live quote. */
export default async function SymbolPage({ params }: Props) {
  const { locale, exchange, symbol } = await params;
  const ex = code(exchange);
  const sym = decodeURIComponent(symbol).toUpperCase();
  if (!isLocale(locale) || !ex || !SYMBOL.test(sym)) notFound();
  const t = getMessages(locale);
  const market = await getMarketPayload();
  return (
    <Shell className="pt-8 pb-16 md:pt-10">
      <div className="flex flex-col gap-6">
        <Link href={`/${locale}/markets/${exchange}`} className="w-fit rounded-full border border-fg/15 px-4 py-2 text-sm font-semibold hover:border-brand-sky/60">
          ← {t.backToBoard.replace("{exchange}", ex)}
        </Link>
        <QuoteView initial={market} exchange={ex} symbol={sym} t={t} locale={locale} />
      </div>
    </Shell>
  );
}
