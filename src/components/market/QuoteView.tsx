"use client";

import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages";
import { compact, dhakaTime, fmt, signed } from "@/lib/market/format";
import type { MarketPayload } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
import { Move, Star } from "./MarketBoard";
import { MarketBadge } from "./MarketBadge";
import { useMarket } from "./useMarket";
import { useWatchlist } from "./useWatchlist";

/**
 * One symbol's live quote on one exchange: last price, change, volume, its
 * rank among today's movers, and the same symbol on the other exchange.
 * Only fields the data source provides are shown; there is no price history.
 */
export function QuoteView({ initial, exchange, symbol, t, locale }: { initial: MarketPayload; exchange: "DSE" | "CSE"; symbol: string; t: Messages; locale: "en" | "bn" }) {
  const { data, moves } = useMarket(initial);
  const watch = useWatchlist();
  const ex = data.snapshot?.exchanges.find((e) => e.exchange === exchange);
  const q = ex?.quotes.find((x) => x.symbol === symbol);
  const other = data.snapshot?.exchanges.find((e) => e.exchange !== exchange);
  const otherQ = other?.quotes.find((x) => x.symbol === symbol);
  const id = `${exchange}:${symbol}`;

  if (!ex || !q) {
    return (
      <div className="glass rounded-[2rem] p-8 sm:p-12">
        <p className="font-display text-2xl font-semibold">{ex ? t.notListed.replace("{symbol}", symbol).replace("{exchange}", exchange) : t.marketsOffTitle}</p>
        {!ex && <p className="mt-3 max-w-xl text-text-secondary">{t.marketsOffBody}</p>}
      </div>
    );
  }
  const rank = [...ex.quotes].sort((a, b) => b.changePct - a.changePct).findIndex((x) => x.symbol === symbol) + 1;
  const move = moves[id];
  const tone = q.changePct > 0 ? "text-market-up" : q.changePct < 0 ? "text-market-down" : "text-text-primary";

  return (
    <div className="flex flex-col gap-6">
      <section className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
        <div aria-hidden="true" className={cn("pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl", q.changePct >= 0 ? "bg-market-up/15" : "bg-market-down/15")} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm tracking-widest text-accent">{exchange}</p>
            <h1 className="font-mono text-4xl font-semibold tracking-tight sm:text-5xl">{symbol}</h1>
          </div>
          <Star on={watch.has(id)} label={(watch.has(id) ? t.removeWatch : t.addWatch).replace("{symbol}", symbol)} onClick={() => watch.toggle(id)} />
        </div>
        <div className="relative mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
          <p className={cn("font-display text-5xl font-semibold tabular-nums sm:text-6xl", tone, move === "up" && "tick-flash-up", move === "down" && "tick-flash-down")}>৳{fmt(locale, q.ltp)}</p>
          <Move pct={q.changePct} abs={q.change} locale={locale} t={t} className="pb-2 text-lg" />
        </div>
        <dl className="relative mt-8 grid grid-cols-2 gap-4 border-t border-fg/[0.08] pt-6 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-text-secondary">{t.colChange}</dt>
            <dd className="font-mono font-semibold tabular-nums">{signed(locale, q.change)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">{t.colPct}</dt>
            <dd className="font-mono font-semibold tabular-nums">{signed(locale, q.changePct, 2, "%")}</dd>
          </div>
          {q.volume !== undefined && (
            <div>
              <dt className="text-xs text-text-secondary">{t.colVolume}</dt>
              <dd className="font-mono font-semibold tabular-nums">{compact(locale, q.volume)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-text-secondary">{t.rankLabel}</dt>
            <dd className="font-mono font-semibold">{t.rankOfMovers.replace("{n}", fmt(locale, rank, 0))}</dd>
          </div>
        </dl>
      </section>

      {otherQ && other && (
        <Link href={`/${locale}/markets/${other.exchange.toLowerCase()}/${encodeURIComponent(symbol)}`} className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5 hover:border-brand-sky/40">
          <span className="text-sm text-text-secondary">{t.alsoOn.replace("{exchange}", other.exchange)}</span>
          <span className="flex items-center gap-4">
            <span className="font-mono font-semibold tabular-nums">৳{fmt(locale, otherQ.ltp)}</span>
            <Move pct={otherQ.changePct} locale={locale} t={t} />
          </span>
        </Link>
      )}

      <p className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <MarketBadge data={data} t={t} />
        {data.snapshot && (
          <span>
            {t.asOf} {dhakaTime(locale, data.snapshot.asOf)}
          </span>
        )}
        <span>{t.dataNotice}</span>
      </p>
    </div>
  );
}
