"use client";

import Link from "next/link";
import { useState } from "react";
import { ExchangeMark, type ExchangeLogo, type ExchangeLogos } from "./ExchangeMark";
import type { Messages } from "@/lib/i18n/messages";
import { compact, crore, dhakaTime, fmt, signed } from "@/lib/market/format";
import { INDEX_SLOTS, movers, type ExchangeSnapshot, type MarketPayload, type Quote } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
import { SessionStatus } from "./SessionStatus";
import { MarketBadge } from "./MarketBadge";
import { useMarket } from "./useMarket";

type Locale = "en" | "bn";

function Change({ pct, abs, locale, big = false }: { pct: number; abs?: number; locale: Locale; big?: boolean }) {
  const up = pct > 0;
  const down = pct < 0;
  return (
    <span className={cn("font-mono font-semibold tabular-nums", big ? "text-sm" : "text-xs", up && "text-market-up", down && "text-market-down", !up && !down && "text-text-secondary")}>
      {up ? "▲" : down ? "▼" : "•"} {abs !== undefined && `${signed(locale, abs)} · `}
      {signed(locale, pct, 2, "%")}
    </span>
  );
}

/** Compact top-5 list (gainers or losers) with a bar showing the size of the move. */
function Movers({ title, rows, locale, t, tone, exchange }: { title: string; rows: Quote[]; locale: Locale; t: Messages; tone: "up" | "down"; exchange: "DSE" | "CSE" }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.changePct)), 1);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <span className={cn("size-2 rounded-full", tone === "up" ? "bg-market-up" : "bg-market-down")} />
        {title}
      </h4>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">{t.noMovers}</p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">
            {exchange} {title}
          </caption>
          <thead className="sr-only">
            <tr>
              <th>{t.symbol}</th>
              <th>{t.lastPrice}</th>
              <th>{t.changeLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.symbol} className="border-t border-fg/[0.06] first:border-t-0">
                <td className="py-2 pr-2 font-mono text-[max(13px,0.8125rem)] font-semibold whitespace-nowrap">
                  <Link href={`/${locale}/markets/${exchange.toLowerCase()}/${encodeURIComponent(q.symbol)}`} className="hover:text-brand-sky">
                    {q.symbol}
                  </Link>
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums text-text-secondary">{fmt(locale, q.ltp)}</td>
                <td className="relative w-24 py-2 text-right">
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-y-1.5 right-0 rounded-md opacity-10", tone === "up" ? "bg-market-up" : "bg-market-down")}
                    style={{ width: `${(Math.abs(q.changePct) / max) * 100}%` }}
                  />
                  <span className="relative pr-1.5">
                    <Change pct={q.changePct} locale={locale} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const DASH = "—";

/**
 * One exchange at a glance. DSE and CSE cards have exactly the same parts in
 * the same order (status, three indices, breadth, day
 * totals, top gainers and losers); a figure the exchange does not publish
 * shows as a dash instead of the part disappearing.
 */
function ExchangeGlance({ exchange, ex, t, locale, className, logo }: { exchange: "DSE" | "CSE"; ex?: ExchangeSnapshot; t: Messages; locale: Locale; className?: string; logo?: ExchangeLogo }) {
  const { gainers, losers } = ex ? movers(ex) : { gainers: [], losers: [] };
  const hasBreadth = !!ex && (ex.advancers !== undefined || ex.decliners !== undefined);
  const breadthTotal = ex ? (ex.advancers ?? 0) + (ex.decliners ?? 0) + (ex.unchanged ?? 0) : 0;
  const count = (v: number | undefined) => (hasBreadth ? fmt(locale, v ?? 0, 0) : DASH);
  const totals: [string, string][] = [
    [t.turnover, ex?.turnover !== undefined ? crore(locale, ex.turnover) : DASH],
    [t.volume, ex?.volume !== undefined ? compact(locale, ex.volume) : DASH],
    [t.trades, ex?.trades !== undefined ? fmt(locale, ex.trades, 0) : DASH],
  ];
  const indices = INDEX_SLOTS[exchange].map((name) => ({ name, i: ex?.indices.find((x) => x.name.toUpperCase() === name) }));
  return (
    <article aria-labelledby={`glance-${exchange}`} className={cn("glass flex-col gap-6 rounded-3xl p-5 sm:p-6", className)}>
      <header className="flex flex-wrap items-center gap-3">
        <ExchangeMark logo={logo} className="size-9 rounded-lg" />
        <h3 id={`glance-${exchange}`} className="font-mono text-xl font-semibold tracking-widest">
          {exchange}
        </h3>
        <SessionStatus status={ex?.status} label={ex?.status ? (t[`marketStatus${ex.status}` as keyof Messages] as string) : DASH} pill />
        <Link href={`/${locale}/markets/${exchange.toLowerCase()}`} className="ml-auto text-sm font-semibold text-brand-sky hover:underline">
          {t.tickerBoard.replace("{exchange}", exchange)}
        </Link>
        {ex?.lastSession && <p className="w-full text-xs text-text-secondary">{t.marketLastSession}</p>}
      </header>


      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {indices.map(({ name, i }) => (
          <li key={name} className="flex min-w-0 flex-col gap-1 rounded-2xl border border-fg/[0.07] bg-fg/[0.02] p-3">
            <span className="font-mono text-[max(11px,0.6875rem)] tracking-widest text-accent">{name}</span>
            <span className="truncate font-display text-lg font-semibold tabular-nums sm:text-xl">{i ? fmt(locale, i.value) : DASH}</span>
            {i ? <Change pct={i.changePct} abs={i.change} locale={locale} /> : <span className="text-xs text-text-secondary">{t.notPublished}</span>}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <div data-reveal className="bar-grow flex h-2 overflow-hidden rounded-full bg-fg/[0.06]" aria-hidden="true">
          {breadthTotal > 0 && (
            <>
              <span className="bg-market-up" style={{ width: `${((ex!.advancers ?? 0) / breadthTotal) * 100}%` }} />
              <span className="bg-text-secondary/50" style={{ width: `${((ex!.unchanged ?? 0) / breadthTotal) * 100}%` }} />
              <span className="bg-market-down" style={{ width: `${((ex!.decliners ?? 0) / breadthTotal) * 100}%` }} />
            </>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <dt className="text-text-secondary">{t.advanced}</dt>
            <dd className="font-mono text-base font-semibold text-market-up">{count(ex?.advancers)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t.unchanged}</dt>
            <dd className="font-mono text-base font-semibold">{count(ex?.unchanged)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t.declined}</dt>
            <dd className="font-mono text-base font-semibold text-market-down">{count(ex?.decliners)}</dd>
          </div>
        </dl>
        <dl className="grid grid-cols-3 gap-2 border-t border-fg/[0.06] pt-3 text-xs">
          {totals.map(([k, v]) => (
            <div key={k}>
              <dt className="text-text-secondary">{k}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Movers title={t.topGainers} rows={gainers} locale={locale} t={t} tone="up" exchange={exchange} />
        <Movers title={t.topLosers} rows={losers} locale={locale} t={t} tone="down" exchange={exchange} />
      </div>
    </article>
  );
}

/**
 * Market at a glance: DSE and CSE side by side on wide screens (a DSE/CSE
 * switch on phones), each with status, indices,
 * breadth and totals and the top gainers and losers, in identical layouts. Refreshes itself every 20 s.
 */
export function MarketPulse({ initial, t, locale, logos, only }: { initial: MarketPayload; t: Messages; locale: Locale; logos?: ExchangeLogos; only?: "DSE" | "CSE" }) {
  const { data, loaded } = useMarket(initial);
  const snapOf = (x: "DSE" | "CSE") => data.snapshot?.exchanges.find((e) => e.exchange === x);
  // Both cards always, side by side, so DSE and CSE read the same way.
  // On an exchange's own page (only), just that exchange.
  const list: ("DSE" | "CSE")[] = only ? (snapOf(only) ? [only] : []) : (["DSE", "CSE"] as const).some((x) => snapOf(x)) ? ["DSE", "CSE"] : [];
  const [tab, setTab] = useState<"DSE" | "CSE">(list[0] ?? "DSE");
  if (!list.length) {
    // Prices are on but not here yet (the exchange answered slowly): say so; they appear by themselves.
    if (data.mode === "none") return null;
    return (
      <p className="glass rounded-3xl p-6 text-sm text-text-secondary" aria-live="polite">
        {loaded ? t.tickerUnavailable : t.tickerLoading}
      </p>
    );
  }
  const active = list.includes(tab) ? tab : list[0]!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {list.length > 1 && (
          <div role="tablist" aria-label={t.tickerLabel} className="relative inline-flex rounded-full border border-fg/10 bg-fg/[0.04] p-1 lg:hidden">
            {list.map((x) => (
              <button
                key={x}
                role="tab"
                type="button"
                aria-selected={active === x}
                aria-controls={`glance-panel-${x}`}
                onClick={() => setTab(x)}
                className={cn(
                  "h-9 rounded-full px-5 font-mono text-sm font-semibold transition-colors",
                  active === x ? "bg-gradient-to-br from-brand-royal to-brand-mid text-white shadow-[0_4px_16px_-4px_rgb(34_188_235/0.6)]" : "text-text-secondary hover:text-fg",
                )}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        {data.snapshot && <MarketBadge data={data} t={t} />}
        {data.snapshot && (
          <span className="ml-auto text-xs text-text-secondary">
            {t.asOf} {dhakaTime(locale, data.snapshot.asOf)}
            {data.providerName && ` · ${t.marketSource}: ${data.providerName}`}
          </span>
        )}
      </div>

      <div className={cn("grid gap-6", list.length > 1 && "lg:grid-cols-2")}>
        {list.map((x) => (
          <div key={x} id={`glance-panel-${x}`} className={cn(x === active ? "flex" : "hidden lg:flex", "min-w-0 flex-col")}>
            <ExchangeGlance exchange={x} ex={snapOf(x)} t={t} locale={locale} logo={logos?.[x]} className="flex h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
