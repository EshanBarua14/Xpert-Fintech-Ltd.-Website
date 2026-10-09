"use client";

import { useEffect, useRef, useState } from "react";
import { ExchangeMark, type ExchangeLogo, type ExchangeLogos } from "./ExchangeMark";
import type { Messages } from "@/lib/i18n/messages";
import { compact, crore, dhakaTime, fmt, signed } from "@/lib/market/format";
import { INDEX_SLOTS, movers, type ExchangeSnapshot, type MarketPayload, type Quote, type ShareFigure } from "@/lib/market/types";
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
                  <a href={`/${locale}/markets/${exchange.toLowerCase()}/${encodeURIComponent(q.symbol)}`} className="hover:text-brand-sky">
                    {q.symbol}
                  </a>
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

/** Xpert's share of the exchange's turnover: a ring that fills once in view. */
function ShareBlock({ share, t, locale, average }: { share: ShareFigure; t: Messages; locale: Locale; average?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(share.sharePct);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        setShown(share.sharePct * (1 - Math.pow(1 - p, 4)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [share.sharePct]);

  const R = 58;
  const C = 2 * Math.PI * R;
  const frac = Math.min(1, shown / 100);
  const date = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${share.tradeDate}T00:00:00Z`));

  return (
    <div ref={ref} className="flex flex-col gap-4 rounded-2xl border border-brand-sky/20 bg-brand-sky/[0.05] p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative size-28 shrink-0 self-center sm:self-auto">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" className="stroke-fg/[0.08]" />
          <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" strokeLinecap="round" stroke={`url(#share-g-${share.exchange})`} strokeDasharray={`${C * frac} ${C}`} />
          <defs>
            <linearGradient id={`share-g-${share.exchange}`} x1="0" x2="1">
              <stop offset="0" stopColor="#2a5fae" />
              <stop offset="1" stopColor="#22bceb" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-gradient-brand absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold tabular-nums">{fmt(locale, shown, 2)}%</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h4 className="flex flex-wrap items-baseline gap-x-3 font-display text-base font-semibold">
          {t.marketShareTitle}
          {average !== undefined && (
            <span className="font-sans text-xs font-semibold text-gold">{t.marketShareAverage.replace("{pct}", fmt(locale, average, Number.isInteger(average) ? 0 : 2))}</span>
          )}
        </h4>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-text-secondary">{t.xpertTurnover}</dt>
            <dd className="font-mono font-semibold tabular-nums">{crore(locale, share.xpertTurnover)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">{t.marketTurnover}</dt>
            <dd className="font-mono font-semibold tabular-nums">{crore(locale, share.marketTurnover)}</dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-text-secondary">
          {t.marketShareBody.replace("{exchange}", share.exchange).replace("{date}", date)}
          {share.sourceNote && (
            <>
              {" "}
              {t.marketSource}: {share.sourceNote}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const DASH = "—";

/** Before a day's figure is entered: Xpert's daily average share (Admin → Market data), when set. */
function AverageBlock({ exchange, pct, t, locale }: { exchange: "DSE" | "CSE"; pct: number; t: Messages; locale: Locale }) {
  const R = 58;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-sky/20 bg-brand-sky/[0.05] p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative size-28 shrink-0 self-center sm:self-auto">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" className="stroke-fg/[0.08]" />
          <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-brand-sky" strokeDasharray={`${(C * Math.min(100, pct)) / 100} ${C}`} />
        </svg>
        <span className="text-gradient-brand absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold tabular-nums">{fmt(locale, pct, Number.isInteger(pct) ? 0 : 2)}%</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h4 className="font-display text-base font-semibold">{t.marketShareTitle}</h4>
        <p className="text-sm leading-relaxed text-text-secondary">{t.marketShareAverageBody.replace("{exchange}", exchange)}</p>
      </div>
    </div>
  );
}

/** Xpert's share before a figure is entered: the same block as ShareBlock, with the ring empty. */
function SharePending({ exchange, t }: { exchange: "DSE" | "CSE"; t: Messages }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-fg/15 p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative size-28 shrink-0 self-center sm:self-auto">
        <svg viewBox="0 0 140 140" className="size-full" aria-hidden="true">
          <circle cx="70" cy="70" r="58" fill="none" strokeWidth="12" className="stroke-fg/[0.08]" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-text-secondary">{DASH}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h4 className="font-display text-base font-semibold">{t.marketShareTitle}</h4>
        <p className="text-sm leading-relaxed text-text-secondary">{t.marketSharePending.replace("{exchange}", exchange)}</p>
      </div>
    </div>
  );
}

/**
 * One exchange at a glance. DSE and CSE cards have exactly the same parts in
 * the same order (status, Xpert's market share, three indices, breadth, day
 * totals, top gainers and losers); a figure the exchange does not publish
 * shows as a dash instead of the part disappearing.
 */
function ExchangeGlance({ exchange, ex, share, average, t, locale, className, logo }: { exchange: "DSE" | "CSE"; ex?: ExchangeSnapshot; share?: ShareFigure; average?: number; t: Messages; locale: Locale; className?: string; logo?: ExchangeLogo }) {
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
        <a href={`/${locale}/markets/${exchange.toLowerCase()}`} className="ml-auto text-sm font-semibold text-brand-sky hover:underline">
          {t.tickerBoard.replace("{exchange}", exchange)}
        </a>
      </header>

      {share ? (
        <ShareBlock share={share} t={t} locale={locale} average={average} />
      ) : average !== undefined ? (
        <AverageBlock exchange={exchange} pct={average} t={t} locale={locale} />
      ) : (
        <SharePending exchange={exchange} t={t} />
      )}

      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {indices.map(({ name, i }) => (
          <li key={name} className="flex min-w-0 flex-col gap-1 rounded-2xl border border-fg/[0.07] bg-fg/[0.02] p-3">
            <span className="font-mono text-[max(11px,0.6875rem)] tracking-widest text-accent">{name}</span>
            <span className="truncate font-display text-lg font-semibold tabular-nums sm:text-xl">{i ? fmt(locale, i.value) : DASH}</span>
            {i ? <Change pct={i.changePct} locale={locale} /> : <span className="text-xs text-text-secondary">{t.notPublished}</span>}
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
 * switch on phones), each with status, Xpert's market share, indices,
 * breadth and totals and the top gainers and losers, in identical layouts. Refreshes itself every 20 s.
 */
export function MarketPulse({ initial, t, locale, logos }: { initial: MarketPayload; t: Messages; locale: Locale; logos?: ExchangeLogos }) {
  const { data, loaded } = useMarket(initial);
  const snapOf = (x: "DSE" | "CSE") => data.snapshot?.exchanges.find((e) => e.exchange === x);
  const shareOf = (x: "DSE" | "CSE") => data.shares.find((f) => f.exchange === x);
  // Both cards always, side by side, so DSE and CSE read the same way.
  const list: ("DSE" | "CSE")[] = (["DSE", "CSE"] as const).some((x) => snapOf(x) || shareOf(x)) ? ["DSE", "CSE"] : [];
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
            <ExchangeGlance exchange={x} ex={snapOf(x)} share={shareOf(x)} average={data.averages?.[x]} t={t} locale={locale} logo={logos?.[x]} className="flex h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
