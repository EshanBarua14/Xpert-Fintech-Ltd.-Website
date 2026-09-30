"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { compact, crore, dhakaTime, fmt, signed } from "@/lib/market/format";
import { movers, type MarketPayload, type Quote, type ShareFigure } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
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

function MoversTable({ title, rows, locale, t, tone }: { title: string; rows: Quote[]; locale: Locale; t: Messages; tone: "up" | "down" }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.changePct)), 1);
  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        <span className={cn("size-2 rounded-full", tone === "up" ? "bg-market-up" : "bg-market-down")} />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">{t.noMovers}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th>{t.symbol}</th>
              <th>{t.lastPrice}</th>
              <th>{t.changeLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => (
              <tr key={q.symbol} className="border-t border-fg/[0.06] first:border-t-0">
                <td className="py-2.5 pr-3">
                  <span className="mr-2 font-mono text-[11px] text-text-secondary">{fmt(locale, i + 1, 0)}</span>
                  <span className="font-mono font-semibold">{q.symbol}</span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-text-secondary">{fmt(locale, q.ltp, q.ltp >= 1000 ? 0 : 1)}</td>
                <td className="relative w-40 py-2.5 text-right">
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-y-2 right-0 rounded-md opacity-15", tone === "up" ? "bg-market-up" : "bg-market-down")}
                    style={{ width: `${(Math.abs(q.changePct) / max) * 100}%` }}
                  />
                  <span className="relative pr-2">
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

/** Radial gauge for Xpert's share of turnover; animates once in view. */
function ShareCard({ share, t, locale }: { share: ShareFigure; t: Messages; locale: Locale }) {
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
    <div ref={ref} className="beam glass flex h-full flex-col gap-5 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{t.marketShareTitle}</h3>
        <span className="rounded-full border border-fg/10 px-2.5 py-0.5 font-mono text-xs text-accent">{share.exchange}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" className="stroke-fg/[0.08]" />
            <circle cx="70" cy="70" r={R} fill="none" strokeWidth="12" strokeLinecap="round" stroke="url(#share-g)" strokeDasharray={`${C * frac} ${C}`} />
            <defs>
              <linearGradient id="share-g" x1="0" x2="1">
                <stop offset="0" stopColor="#2a5fae" />
                <stop offset="1" stopColor="#22bceb" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-gradient-brand absolute inset-0 flex items-center justify-center font-display text-3xl font-semibold tabular-nums">
            {fmt(locale, shown, 2)}%
          </span>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-text-secondary">{t.xpertTurnover}</dt>
            <dd className="font-mono font-semibold tabular-nums">{crore(locale, share.xpertTurnover)}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{t.marketTurnover}</dt>
            <dd className="font-mono font-semibold tabular-nums">{crore(locale, share.marketTurnover)}</dd>
          </div>
        </dl>
      </div>
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
  );
}

/**
 * Market pulse: indices, breadth, turnover, top gainers and losers per
 * exchange, and Xpert's market share. Refreshes itself every 20 s.
 */
export function MarketPulse({ initial, t, locale }: { initial: MarketPayload; t: Messages; locale: Locale }) {
  const { data } = useMarket(initial);
  const exchanges = data.snapshot?.exchanges ?? [];
  const [tab, setTab] = useState<"DSE" | "CSE">(exchanges[0]?.exchange ?? data.shares[0]?.exchange ?? "DSE");
  const ex = exchanges.find((e) => e.exchange === tab) ?? exchanges[0];
  const share = data.shares.find((s) => s.exchange === tab) ?? data.shares[0];
  const tabs = Array.from(new Set([...exchanges.map((e) => e.exchange), ...data.shares.map((s) => s.exchange)]));

  if (!ex && !share) return null;
  const { gainers, losers } = ex ? movers(ex) : { gainers: [], losers: [] };
  const breadthTotal = ex ? (ex.advancers ?? 0) + (ex.decliners ?? 0) + (ex.unchanged ?? 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {tabs.length > 1 && (
          <div role="tablist" aria-label={t.tickerLabel} className="relative inline-flex rounded-full border border-fg/10 bg-fg/[0.04] p-1">
            {tabs.map((x) => (
              <button
                key={x}
                role="tab"
                type="button"
                aria-selected={tab === x}
                onClick={() => setTab(x)}
                className={cn(
                  "h-9 rounded-full px-5 font-mono text-sm font-semibold transition-colors",
                  tab === x ? "bg-gradient-to-br from-brand-royal to-brand-mid text-white shadow-[0_4px_16px_-4px_rgb(34_188_235/0.6)]" : "text-text-secondary hover:text-fg",
                )}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        {ex?.status && (
          <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 px-3 py-1 text-xs font-semibold text-text-secondary">
            <span className={cn("size-1.5 rounded-full", ex.status === "OPEN" ? "animate-pulse bg-market-up" : "bg-text-secondary")} />
            {t[`marketStatus${ex.status}` as keyof Messages]}
          </span>
        )}
        {data.snapshot && <MarketBadge data={data} t={t} />}
        {data.snapshot && (
          <span className="ml-auto text-xs text-text-secondary">
            {t.asOf} {dhakaTime(locale, data.snapshot.asOf)}
            {data.providerName && ` · ${t.marketSource}: ${data.providerName}`}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {ex && ex.indices.length > 0 && (
          <div className="glass flex flex-col gap-5 rounded-3xl p-6 lg:col-span-5">
            {ex.indices.map((i, n) => (
              <div key={i.name} className={cn("flex items-end justify-between gap-4", n > 0 && "border-t border-fg/[0.06] pt-5")}>
                <div>
                  <p className="font-mono text-xs tracking-widest text-accent">{i.name}</p>
                  <p className="font-display text-3xl font-semibold tabular-nums md:text-4xl">{fmt(locale, i.value)}</p>
                </div>
                <Change pct={i.changePct} abs={i.change} locale={locale} big />
              </div>
            ))}
          </div>
        )}

        {ex && (
          <div className="glass flex flex-col gap-8 rounded-3xl p-6 lg:col-span-3">
            {breadthTotal > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-fg/[0.06]" aria-hidden="true">
                  <span className="bg-market-up" style={{ width: `${((ex.advancers ?? 0) / breadthTotal) * 100}%` }} />
                  <span className="bg-text-secondary/50" style={{ width: `${((ex.unchanged ?? 0) / breadthTotal) * 100}%` }} />
                  <span className="bg-market-down" style={{ width: `${((ex.decliners ?? 0) / breadthTotal) * 100}%` }} />
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <dt className="text-text-secondary">{t.advanced}</dt>
                    <dd className="font-mono text-base font-semibold text-market-up">{fmt(locale, ex.advancers ?? 0, 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t.unchanged}</dt>
                    <dd className="font-mono text-base font-semibold">{fmt(locale, ex.unchanged ?? 0, 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary">{t.declined}</dt>
                    <dd className="font-mono text-base font-semibold text-market-down">{fmt(locale, ex.decliners ?? 0, 0)}</dd>
                  </div>
                </dl>
              </div>
            )}
            <dl className="flex flex-col gap-3 text-sm">
              {ex.turnover !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">{t.turnover}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{crore(locale, ex.turnover)}</dd>
                </div>
              )}
              {ex.volume !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">{t.volume}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{compact(locale, ex.volume)}</dd>
                </div>
              )}
              {ex.trades !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">{t.trades}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{fmt(locale, ex.trades, 0)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {share && (
          <div className={cn(ex ? "lg:col-span-4" : "lg:col-span-6")}>
            <ShareCard share={share} t={t} locale={locale} />
          </div>
        )}

        {ex && (
          <>
            <div className="lg:col-span-6" style={{ "--d": 1 } as CSSProperties}>
              <MoversTable title={t.topGainers} rows={gainers} locale={locale} t={t} tone="up" />
            </div>
            <div className="lg:col-span-6">
              <MoversTable title={t.topLosers} rows={losers} locale={locale} t={t} tone="down" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
