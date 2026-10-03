"use client";

/**
 * Interactive OMS product preview. Fully simulated: fictional instruments, no network calls,
 * no real orders. The "simulated" banner is permanent and cannot be hidden by props.
 *
 * Text comes from `labels` (pass translated strings from the CMS; English defaults below).
 */

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./OmsPreview.module.css";
import {
  cancelOrder, createState, placeOrder, priceBand, step,
  type Order, type RiskCheck, type Side, type SimState,
} from "./simulation";

export const DEFAULT_LABELS = {
  banner: "Product preview — simulated data. No real market data and no real orders.",
  title: "OMS preview",
  tabs: { watch: "Market watch", orders: "Orders", positions: "Positions", risk: "Risk" },
  symbol: "Symbol", name: "Name", ltp: "Last", change: "Change", volume: "Volume",
  side: "Side", buy: "Buy", sell: "Sell", qty: "Quantity", price: "Limit price",
  place: "Place order", reset: "Reset preview", pause: "Pause market", resume: "Resume market",
  status: { WORKING: "Working", FILLED: "Filled", REJECTED: "Rejected", CANCELLED: "Cancelled" },
  statusCol: "Status", cancel: "Cancel", passed: "Passed", failed: "Failed",
  avgPrice: "Avg. price", marketValue: "Market value", pnl: "Unrealised P/L",
  buyingPower: "Buying power", maxOrderValue: "Max order value", priceBand: "Price band",
  noOrders: "No orders yet. Select a symbol and place an order.",
  noPositions: "No positions yet.",
  ticket: "Order ticket",
  checksTitle: "Pre-trade risk checks",
  checks: {
    qty: "Quantity is a whole number above zero",
    band: "Price is within the daily price band",
    maxValue: "Order value is within the maximum order value",
    buyingPower: "Order value is within buying power",
    holding: "Quantity is within current holding",
  },
  up: "up", down: "down", unchanged: "unchanged",
  currency: "Tk",
};
export type OmsPreviewLabels = typeof DEFAULT_LABELS;

type Tab = keyof OmsPreviewLabels["tabs"];
const TABS: Tab[] = ["watch", "orders", "positions", "risk"];

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setR(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return r;
}

export default function OmsPreview({ labels: partial, tickMs = 1500, seed = 42 }: {
  labels?: Partial<OmsPreviewLabels>;
  tickMs?: number;
  seed?: number;
}) {
  const L = useMemo(() => ({ ...DEFAULT_LABELS, ...partial }), [partial]);
  const [sim, setSim] = useState<SimState>(() => createState(seed));
  const [tab, setTab] = useState<Tab>("watch");
  const [symbol, setSymbol] = useState(sim.instruments[0]!.symbol);
  const [side, setSide] = useState<Side>("BUY");
  const [qty, setQty] = useState("100");
  const [price, setPrice] = useState(String(sim.instruments[0]!.ltp.toFixed(1)));
  const [lastChecks, setLastChecks] = useState<{ order: Order; checks: RiskCheck[] } | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reduced motion: the market starts paused; the visitor can still resume it.
  useEffect(() => { if (reduced) setUserPaused(true); }, [reduced]);

  const running = visible && !userPaused;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setSim((s) => step(s));
    }, tickMs);
    return () => window.clearInterval(id);
  }, [running, tickMs]);

  const inst = sim.instruments.find((i) => i.symbol === symbol)!;
  const [bandLo, bandHi] = priceBand(inst, sim.limits.priceBandPct);

  const selectSymbol = (s: string) => {
    setSymbol(s);
    const i = sim.instruments.find((x) => x.symbol === s);
    if (i) setPrice(i.ltp.toFixed(1));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = placeOrder(sim, symbol, side, Number(qty), Number(price));
    setSim(r.state);
    setLastChecks({ order: r.order, checks: r.checks });
  };

  const reset = () => {
    const s = createState(seed);
    setSim(s);
    setLastChecks(null);
    setSymbol(s.instruments[0]!.symbol);
    setPrice(s.instruments[0]!.ltp.toFixed(1));
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = TABS[(next + TABS.length) % TABS.length]!;
    setTab(t);
    tabRefs.current[t]?.focus();
  };

  const move = (ltp: number, prev: number) => {
    const d = ltp - prev;
    const pct = (d / prev) * 100;
    const dir = d > 0.0001 ? "up" : d < -0.0001 ? "down" : "flat";
    const icon = dir === "up" ? "▲" : dir === "down" ? "▼" : "■";
    const word = dir === "up" ? L.up : dir === "down" ? L.down : L.unchanged;
    return (
      <span className={styles.move} data-dir={dir}>
        <span aria-hidden="true">{icon}</span> {d > 0 ? "+" : ""}{fmt(d)} ({d > 0 ? "+" : ""}{fmt(pct)}%)
        <span className={styles.srOnly}> {word}</span>
      </span>
    );
  };

  return (
    <section ref={rootRef} className={styles.root} aria-label={L.title}>
      <p className={styles.banner} role="note"><span aria-hidden="true">◆</span> {L.banner}</p>

      <div className={styles.toolbar}>
        <span className={styles.title}>{L.title}</span>
        <span className={styles.toolbarRight}>
          <span className={styles.stat}>{L.buyingPower}: <strong>{L.currency} {fmt(sim.buyingPower)}</strong></span>
          <button type="button" className={styles.ghost} onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused}>
            {userPaused ? L.resume : L.pause}
          </button>
          <button type="button" className={styles.ghost} onClick={reset}>{L.reset}</button>
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div role="tablist" aria-label={L.title} className={styles.tabs}>
            {TABS.map((t, i) => (
              <button
                key={t}
                ref={(el) => { tabRefs.current[t] = el; }}
                role="tab"
                id={`oms-tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`oms-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                className={styles.tab}
                onClick={() => setTab(t)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {L.tabs[t]}
                {t === "orders" && sim.orders.length > 0 && <span className={styles.count}>{sim.orders.length}</span>}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`oms-panel-${tab}`} aria-labelledby={`oms-tab-${tab}`} className={styles.panel} tabIndex={0}>
            {tab === "watch" && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption className={styles.srOnly}>{L.tabs.watch}</caption>
                  <thead><tr>
                    <th scope="col">{L.symbol}</th><th scope="col" className={styles.hideSm}>{L.name}</th>
                    <th scope="col" className={styles.num}>{L.ltp}</th><th scope="col" className={styles.num}>{L.change}</th>
                    <th scope="col" className={`${styles.num} ${styles.hideSm}`}>{L.volume}</th>
                  </tr></thead>
                  <tbody>
                    {sim.instruments.map((i) => (
                      <tr key={i.symbol} data-selected={i.symbol === symbol || undefined}>
                        <th scope="row">
                          <button type="button" className={styles.rowBtn} onClick={() => selectSymbol(i.symbol)} aria-pressed={i.symbol === symbol}>
                            {i.symbol}
                          </button>
                        </th>
                        <td className={styles.hideSm}>{i.name}</td>
                        <td className={styles.num}>{fmt(i.ltp)}</td>
                        <td className={styles.num}>{move(i.ltp, i.prevClose)}</td>
                        <td className={`${styles.num} ${styles.hideSm}`}>{i.volume.toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "orders" && (sim.orders.length === 0 ? <p className={styles.empty}>{L.noOrders}</p> : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption className={styles.srOnly}>{L.tabs.orders}</caption>
                  <thead><tr>
                    <th scope="col">#</th><th scope="col">{L.symbol}</th><th scope="col">{L.side}</th>
                    <th scope="col" className={styles.num}>{L.qty}</th><th scope="col" className={styles.num}>{L.price}</th>
                    <th scope="col">{L.statusCol}</th><th scope="col"><span className={styles.srOnly}>{L.cancel}</span></th>
                  </tr></thead>
                  <tbody>
                    {sim.orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.id}</td><th scope="row">{o.symbol}</th>
                        <td data-side={o.side}>{o.side === "BUY" ? L.buy : L.sell}</td>
                        <td className={styles.num}>{o.qty.toLocaleString("en-US")}</td>
                        <td className={styles.num}>{fmt(o.price)}</td>
                        <td><span className={styles.badge} data-status={o.status}>{L.status[o.status]}</span>
                          {o.reason && <span className={styles.reason}> — {L.checks[o.reason as keyof typeof L.checks]}</span>}</td>
                        <td>{o.status === "WORKING" && (
                          <button type="button" className={styles.ghost} onClick={() => setSim((s) => cancelOrder(s, o.id))}>{L.cancel}</button>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {tab === "positions" && (sim.positions.length === 0 ? <p className={styles.empty}>{L.noPositions}</p> : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption className={styles.srOnly}>{L.tabs.positions}</caption>
                  <thead><tr>
                    <th scope="col">{L.symbol}</th><th scope="col" className={styles.num}>{L.qty}</th>
                    <th scope="col" className={styles.num}>{L.avgPrice}</th><th scope="col" className={styles.num}>{L.ltp}</th>
                    <th scope="col" className={styles.num}>{L.marketValue}</th><th scope="col" className={styles.num}>{L.pnl}</th>
                  </tr></thead>
                  <tbody>
                    {sim.positions.map((p) => {
                      const i = sim.instruments.find((x) => x.symbol === p.symbol)!;
                      return (
                        <tr key={p.symbol}>
                          <th scope="row">{p.symbol}</th>
                          <td className={styles.num}>{p.qty.toLocaleString("en-US")}</td>
                          <td className={styles.num}>{fmt(p.avgPrice)}</td>
                          <td className={styles.num}>{fmt(i.ltp)}</td>
                          <td className={styles.num}>{fmt(p.qty * i.ltp)}</td>
                          <td className={styles.num}>{move(p.qty * i.ltp, p.qty * p.avgPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {tab === "risk" && (
              <dl className={styles.riskGrid}>
                <div><dt>{L.buyingPower}</dt><dd>{L.currency} {fmt(sim.buyingPower)}</dd></div>
                <div><dt>{L.maxOrderValue}</dt><dd>{L.currency} {fmt(sim.limits.maxOrderValue)}</dd></div>
                <div><dt>{L.priceBand}</dt><dd>±{sim.limits.priceBandPct}%</dd></div>
              </dl>
            )}
          </div>
        </div>

        <form className={styles.ticket} onSubmit={submit} aria-label={L.ticket}>
          <p className={styles.ticketTitle}>{L.ticket}: <strong>{symbol}</strong> <span className={styles.muted}>{fmt(inst.ltp)}</span></p>
          <fieldset className={styles.sideToggle}>
            <legend className={styles.srOnly}>{L.side}</legend>
            {(["BUY", "SELL"] as const).map((s) => (
              <label key={s} data-side={s} data-checked={side === s || undefined}>
                <input type="radio" name="oms-side" value={s} checked={side === s} onChange={() => setSide(s)} />
                {s === "BUY" ? L.buy : L.sell}
              </label>
            ))}
          </fieldset>
          <label className={styles.field}>
            <span>{L.qty}</span>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          <label className={styles.field}>
            <span>{L.price}</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} aria-describedby="oms-band" />
            <small id="oms-band" className={styles.muted}>{L.priceBand}: {fmt(bandLo)} – {fmt(bandHi)}</small>
          </label>
          <button type="submit" className={styles.primary} data-side={side}>{L.place}</button>

          {lastChecks && (
            <div className={styles.checks} aria-live="polite">
              <p className={styles.checksTitle}>
                {L.checksTitle} — <span className={styles.badge} data-status={lastChecks.order.status}>{L.status[lastChecks.order.status]}</span>
              </p>
              <ul>
                {lastChecks.checks.map((c) => (
                  <li key={c.id} data-passed={c.passed}>
                    <span aria-hidden="true">{c.passed ? "✓" : "✕"}</span>
                    <span className={styles.srOnly}>{c.passed ? L.passed : L.failed}: </span>
                    {L.checks[c.id]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
