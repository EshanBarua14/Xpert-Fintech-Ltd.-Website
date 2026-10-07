"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { compact, crore, dhakaTime, fmt, signed } from "@/lib/market/format";
import { movers, type MarketPayload, type Quote } from "@/lib/market/types";
import { cn } from "@/lib/utils/cn";
import { MarketBadge } from "./MarketBadge";
import { useMarket } from "./useMarket";
import { useWatchlist } from "./useWatchlist";

type Locale = "en" | "bn";
type SortKey = "symbol" | "ltp" | "change" | "changePct" | "volume";

/** ▲ +1.25% with the direction also in words for screen readers (never colour alone). */
export function Move({ pct, abs, locale, t, className }: { pct: number; abs?: number; locale: Locale; t: Messages; className?: string }) {
  const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", dir === "up" && "text-market-up", dir === "down" && "text-market-down", dir === "flat" && "text-text-secondary", className)}>
      <span aria-hidden="true">{dir === "up" ? "▲" : dir === "down" ? "▼" : "•"}</span>
      <span className="sr-only">{t[dir]} </span>
      {abs !== undefined && <span>{signed(locale, abs)}</span>}
      <span>{signed(locale, pct, 2, "%")}</span>
    </span>
  );
}

export function Star({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={cn("flex size-9 items-center justify-center rounded-full transition-colors hover:bg-fg/[0.06]", on ? "text-gold" : "text-text-secondary/60 hover:text-text-secondary")}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
      </svg>
    </button>
  );
}

function MiniList({ title, rows, basePath, locale, t, metric }: { title: string; rows: Quote[]; basePath: string; locale: Locale; t: Messages; metric: "pct" | "volume" }) {
  return (
    <section className="glass flex min-w-0 flex-col gap-3 rounded-3xl p-5">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">—</p>
      ) : (
        <ol className="flex flex-col divide-y divide-fg/[0.06]">
          {rows.map((q, i) => (
            <li key={q.symbol}>
              <Link href={`${basePath}/${encodeURIComponent(q.symbol)}`} className="relative flex items-center gap-2.5 py-2 text-sm hover:text-brand-sky">
                <span className="w-4 font-mono text-xs text-text-secondary">{fmt(locale, i + 1, 0)}</span>
                <span className="min-w-0 flex-1 truncate font-mono font-semibold">{q.symbol}</span>
                <span className="font-mono text-text-secondary tabular-nums">{fmt(locale, q.ltp)}</span>
                {metric === "pct" ? <Move pct={q.changePct} locale={locale} t={t} className="w-20 justify-end" /> : <span className="w-20 text-right font-mono tabular-nums">{compact(locale, q.volume ?? 0)}</span>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * One exchange's live board: status, indices, breadth and totals, top movers,
 * and every listed price in a searchable, sortable table with a watchlist.
 * Refreshes with the rest of the site's market widgets (every 20 s).
 */
export function MarketBoard({ initial, exchange, t, locale, basePath }: { initial: MarketPayload; exchange: "DSE" | "CSE"; t: Messages; locale: Locale; basePath: string }) {
  const { data, moves } = useMarket(initial);
  const ex = data.snapshot?.exchanges.find((e) => e.exchange === exchange);
  const watch = useWatchlist();
  const [q, setQ] = useState("");
  const [onlyWatch, setOnlyWatch] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "changePct", dir: -1 });
  const hasVolume = !!ex?.quotes.some((x) => x.volume !== undefined);

  const rows = useMemo(() => {
    if (!ex) return [];
    const needle = q.trim().toUpperCase();
    return ex.quotes
      .filter((x) => (!needle || x.symbol.includes(needle)) && (!onlyWatch || watch.has(`${exchange}:${x.symbol}`)))
      .sort((a, b) => {
        const av = sort.key === "symbol" ? a.symbol : (a[sort.key] ?? 0);
        const bv = sort.key === "symbol" ? b.symbol : (b[sort.key] ?? 0);
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
  }, [ex, q, onlyWatch, sort, watch, exchange]);

  if (!ex) {
    return (
      <div className="glass rounded-[2rem] p-8 text-center sm:p-12">
        <p className="font-display text-2xl font-semibold">{t.marketsOffTitle}</p>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">{t.marketsOffBody}</p>
      </div>
    );
  }

  const { gainers, losers } = movers(ex, 5);
  const active = hasVolume ? [...ex.quotes].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 5) : [];
  const breadth = (ex.advancers ?? 0) + (ex.decliners ?? 0) + (ex.unchanged ?? 0);
  const shown = rows.slice(0, 400);
  const columns: { key: SortKey; label: string; align: "left" | "right"; hide?: boolean }[] = [
    { key: "symbol", label: t.colSymbol, align: "left" },
    { key: "ltp", label: t.colLtp, align: "right" },
    { key: "change", label: t.colChange, align: "right" },
    { key: "changePct", label: t.colPct, align: "right" },
    { key: "volume", label: t.colVolume, align: "right", hide: !hasVolume },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        {ex.status && (
          <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 px-3 py-1 font-semibold">
            <span className={cn("size-1.5 rounded-full", ex.status === "OPEN" ? "animate-pulse bg-market-up" : "bg-text-secondary")} />
            {t[`marketStatus${ex.status}` as keyof Messages]}
          </span>
        )}
        <MarketBadge data={data} t={t} />
        {data.snapshot && (
          <span>
            {t.asOf} {dhakaTime(locale, data.snapshot.asOf)}
            {data.providerName && ` · ${t.marketSource}: ${data.providerName}`}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {ex.indices.length > 0 && (
          <section className="glass grid content-center gap-6 rounded-3xl p-6 sm:grid-cols-2 sm:p-8 lg:col-span-7 lg:grid-cols-3">
            <h2 className="sr-only">{t.indicesTitle}</h2>
            {ex.indices.map((i) => (
              <div key={i.name} className="flex flex-col gap-1">
                <p className="font-mono text-xs tracking-widest text-accent">{i.name}</p>
                <p className="font-display text-3xl font-semibold tabular-nums">{fmt(locale, i.value)}</p>
                <Move pct={i.changePct} abs={i.change} locale={locale} t={t} className="text-sm" />
              </div>
            ))}
          </section>
        )}
        <section className={cn("glass flex flex-col gap-5 rounded-3xl p-6", ex.indices.length ? "lg:col-span-5" : "lg:col-span-12")}>
          <h2 className="text-xs font-semibold text-text-secondary">{t.breadthTitle}</h2>
          {breadth > 0 && (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-fg/[0.06]" aria-hidden="true">
                <span className="bg-market-up" style={{ width: `${((ex.advancers ?? 0) / breadth) * 100}%` }} />
                <span className="bg-text-secondary/50" style={{ width: `${((ex.unchanged ?? 0) / breadth) * 100}%` }} />
                <span className="bg-market-down" style={{ width: `${((ex.decliners ?? 0) / breadth) * 100}%` }} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <dt className="text-text-secondary">{t.advanced}</dt>
                  <dd className="font-mono text-lg font-semibold text-market-up">{fmt(locale, ex.advancers ?? 0, 0)}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">{t.unchanged}</dt>
                  <dd className="font-mono text-lg font-semibold">{fmt(locale, ex.unchanged ?? 0, 0)}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">{t.declined}</dt>
                  <dd className="font-mono text-lg font-semibold text-market-down">{fmt(locale, ex.decliners ?? 0, 0)}</dd>
                </div>
              </dl>
            </>
          )}
          {(ex.turnover !== undefined || ex.volume !== undefined || ex.trades !== undefined) && (
            <dl className="grid grid-cols-3 gap-3 border-t border-fg/[0.06] pt-4 text-sm">
              {ex.turnover !== undefined && (
                <div>
                  <dt className="text-xs text-text-secondary">{t.turnover}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{crore(locale, ex.turnover)}</dd>
                </div>
              )}
              {ex.volume !== undefined && (
                <div>
                  <dt className="text-xs text-text-secondary">{t.volume}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{compact(locale, ex.volume)}</dd>
                </div>
              )}
              {ex.trades !== undefined && (
                <div>
                  <dt className="text-xs text-text-secondary">{t.trades}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{fmt(locale, ex.trades, 0)}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      </div>

      <div className={cn("grid gap-4", active.length ? "md:grid-cols-3" : "md:grid-cols-2")}>
        <MiniList title={t.topGainers} rows={gainers} basePath={basePath} locale={locale} t={t} metric="pct" />
        <MiniList title={t.topLosers} rows={losers} basePath={basePath} locale={locale} t={t} metric="pct" />
        {active.length > 0 && <MiniList title={t.mostActive} rows={active} basePath={basePath} locale={locale} t={t} metric="volume" />}
      </div>

      <section aria-labelledby="board-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="board-title" className="mr-auto font-display text-2xl font-semibold">
            {t.priceBoard}
          </h2>
          <label className="relative">
            <span className="sr-only">{t.searchSymbols}</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchSymbols}
              autoCapitalize="characters"
              className="h-11 w-56 rounded-full border border-fg/15 bg-ink-950/60 px-4 font-mono text-sm placeholder:normal-case focus:border-brand-sky focus:outline-none"
            />
          </label>
          <button
            type="button"
            aria-pressed={onlyWatch}
            onClick={() => setOnlyWatch((v) => !v)}
            className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold", onlyWatch ? "border-gold/60 bg-gold/10 text-gold" : "border-fg/15 text-text-secondary hover:text-fg")}
          >
            ★ {t.watchOnly} ({fmt(locale, watch.list.filter((id) => id.startsWith(`${exchange}:`)).length, 0)})
          </button>
        </div>
        {onlyWatch && rows.length === 0 ? (
          <p className="rounded-2xl border border-fg/10 p-6 text-sm text-text-secondary">{t.watchEmpty}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border border-fg/10 p-6 text-sm text-text-secondary">{t.noMatches}</p>
        ) : (
          <div className="relative overflow-x-auto rounded-3xl border border-fg/10">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="sticky top-0 z-10 bg-navy-900/95 text-xs text-text-secondary backdrop-blur">
                <tr>
                  <th className="w-12 px-2 py-3">
                    <span className="sr-only">{t.watchlist}</span>
                  </th>
                  {columns
                    .filter((c) => !c.hide)
                    .map((c) => {
                      const on = sort.key === c.key;
                      return (
                        <th key={c.key} scope="col" aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("px-3 py-3 font-medium", c.align === "right" ? "text-right" : "text-left")}>
                          <button
                            type="button"
                            onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.key === "symbol" ? 1 : -1 }))}
                            className={cn("inline-flex items-center gap-1 hover:text-fg", on && "text-fg")}
                            aria-label={t.sortBy.replace("{column}", c.label)}
                          >
                            {c.label}
                            <span aria-hidden="true" className="text-[max(10px,0.625rem)]">{on ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                          </button>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/[0.06]">
                {shown.map((x) => {
                  const id = `${exchange}:${x.symbol}`;
                  const on = watch.has(id);
                  const move = moves[id];
                  return (
                    <tr key={x.symbol} className={cn("hover:bg-fg/[0.03]", move === "up" && "tick-flash-up", move === "down" && "tick-flash-down")}>
                      <td className="px-2 py-1">
                        <Star on={on} label={(on ? t.removeWatch : t.addWatch).replace("{symbol}", x.symbol)} onClick={() => watch.toggle(id)} />
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`${basePath}/${encodeURIComponent(x.symbol)}`} className="font-mono font-semibold hover:text-brand-sky">
                          {x.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmt(locale, x.ltp)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn("font-mono tabular-nums", x.change > 0 && "text-market-up", x.change < 0 && "text-market-down")}>{signed(locale, x.change)}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Move pct={x.changePct} locale={locale} t={t} className="justify-end" />
                      </td>
                      {hasVolume && <td className="px-3 py-2 text-right font-mono tabular-nums">{x.volume !== undefined ? compact(locale, x.volume) : "—"}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-text-secondary">
          {t.showing.replace("{n}", fmt(locale, shown.length, 0)).replace("{total}", fmt(locale, ex.quotes.length, 0))} · {t.dataNotice}
        </p>
      </section>
    </div>
  );
}
