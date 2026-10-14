"use client";

import Link from "next/link";
import { useState } from "react";
import { useAutoTour } from "@/components/motion/useAutoTour";
import { cn } from "@/lib/utils/cn";

export type RmsLabels = {
  tryOrder: string;
  sample: string;
  buy: string;
  sell: string;
  shares: string;
  value: string;
  routeTo: string;
  oms: string;
  rms: string;
  rmsNote: string;
  checking: string;
  passed: string;
  stopped: string;
  waiting: string;
  sentTo: string;
  returned: string;
  exchanges: string;
  trader: string;
  play: string;
  pause: string;
  next: string;
  prev: string;
  illustration: string;
  learnMore?: string;
  learnHref?: string;
  /** The six checks, in the order the OMS runs them in this illustration. */
  checks: { title: string; body: string }[];
  /** One note per sample order (what makes it pass or fail). */
  notes: string[];
};

type Side = "buy" | "sell";
/** Sample orders (fictional stock and prices): two pass, four are stopped at different checks. */
const ORDERS: { side: Side; qty: number; price: number; ex: "DSE" | "CSE"; fail: number | null }[] = [
  { side: "buy", qty: 500, price: 48.2, ex: "DSE", fail: null },
  { side: "sell", qty: 1000, price: 48.1, ex: "DSE", fail: 1 },
  { side: "buy", qty: 200, price: 62, ex: "CSE", fail: 4 },
  { side: "buy", qty: 20000, price: 48.3, ex: "DSE", fail: 2 },
  { side: "buy", qty: 100, price: 48.2, ex: "DSE", fail: 0 },
  { side: "sell", qty: 300, price: 47.9, ex: "CSE", fail: null },
];

const STEP_MS = 620;
const HOLD_MS = 3200;
const CHECKS = 6;
/** Steps an order takes: entry, each check up to the one that stops it, the result, then a beat. */
const stepsOf = (i: number) => (ORDERS[i]!.fail ?? CHECKS) + 3;
const dwellOf = (i: number) => stepsOf(i) * STEP_MS + HOLD_MS;

function StatusMark({ state }: { state: "wait" | "run" | "ok" | "stop" }) {
  if (state === "ok")
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 text-market-up">
        <circle cx="8" cy="8" r="7" className="fill-current opacity-15" />
        <path d="m4.8 8.2 2.1 2.1 4.3-4.6" className="fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "stop")
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 text-market-down">
        <circle cx="8" cy="8" r="7" className="fill-current opacity-15" />
        <path d="m5.5 5.5 5 5m0-5-5 5" className="fill-none stroke-current stroke-[1.8]" strokeLinecap="round" />
      </svg>
    );
  if (state === "run")
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 animate-spin text-brand-sky motion-reduce:animate-none">
        <circle cx="8" cy="8" r="6" className="fill-none stroke-current opacity-25 stroke-2" />
        <path d="M8 2a6 6 0 0 1 6 6" className="fill-none stroke-current stroke-2" strokeLinecap="round" />
      </svg>
    );
  return <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-fg/20" />;
}

/** A short line between stages; a light runs along it while the order travels. */
function Wire({ on, bad }: { on: boolean; bad?: boolean }) {
  return (
    <span aria-hidden="true" className="relative mx-auto block h-8 w-px overflow-hidden bg-fg/15 lg:h-px lg:w-full lg:min-w-8">
      <span
        className={cn(
          "absolute inset-0 origin-top transition-transform duration-500 lg:origin-left",
          bad ? "bg-market-down/70" : "bg-brand-sky",
          on ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}

/**
 * The Risk Management System inside the Xpert Trading OMS, shown with sample
 * orders: each order is checked line by line (blocked BO account, short sell,
 * buying power and margin, order limits, price band, exposure) and either
 * goes on to DSE or CSE or comes back to the trader with the reason. The
 * orders play by themselves; any order or check can be picked. A fictional
 * stock and prices are used, and the panel says so.
 */
export function RmsPipeline({ labels, locale, className }: { labels: RmsLabels; locale: "en" | "bn"; className?: string }) {
  const tour = useAutoTour(ORDERS.length, { dwell: dwellOf });
  const [open, setOpen] = useState<number | null>(null);
  const i = tour.active;
  const o = ORDERS[i]!;
  const step = Math.floor(tour.elapsed / STEP_MS);
  const limit = o.fail ?? CHECKS;
  const resolved = Math.max(0, Math.min(step - 1, o.fail === null ? CHECKS : o.fail + 1));
  const done = step >= stepsOf(i) - 1;
  const passed = done && o.fail === null;
  const stopped = done && o.fail !== null;
  const nf = (v: number, d = 0) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const ex = (e: "DSE" | "CSE") => (locale === "bn" ? (e === "DSE" ? "ডিএসই" : "সিএসই") : e);
  const sideLabel = (s: Side) => (s === "buy" ? labels.buy : labels.sell);
  const stateOf = (k: number): "wait" | "run" | "ok" | "stop" => {
    if (k < resolved) return o.fail === k ? "stop" : "ok";
    if (k === resolved && step >= 1 && k <= limit && !done) return "run";
    return "wait";
  };
  const outcome = passed
    ? labels.sentTo.replace("{exchange}", ex(o.ex))
    : stopped
      ? `${labels.returned}: ${labels.checks[o.fail!]?.title ?? ""}`
      : "";

  return (
    <div ref={tour.rootRef} {...tour.holdProps} className={cn("glass relative overflow-hidden rounded-[1.75rem] border border-fg/10 p-4 sm:p-6 lg:p-7", className)}>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-fg/[0.06]">
        <span ref={tour.barRef} className="block h-full origin-left bg-gradient-to-r from-brand-sky to-gold" style={{ transform: "scaleX(0)" }} />
      </span>

      {/* Sample orders to pick from, and the controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary">{labels.tryOrder}</p>
          <ul className="flex flex-wrap gap-1.5">
            {ORDERS.map((x, k) => (
              <li key={k}>
                <button
                  type="button"
                  aria-pressed={k === i}
                  onClick={() => tour.choose(k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    k === i ? "border-brand-sky bg-brand-sky/15 text-text-primary" : "border-fg/10 text-text-secondary hover:border-brand-sky/50 hover:text-text-primary",
                  )}
                >
                  <span className={x.side === "buy" ? "text-market-up" : "text-market-down"}>{sideLabel(x.side)}</span>
                  <span className="tabular-nums">{nf(x.qty)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => tour.choose(i - 1)} aria-label={labels.prev} className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="M10 3 5 8l5 5" /></svg>
          </button>
          <button type="button" onClick={tour.togglePlaying} aria-label={tour.playing ? labels.pause : labels.play} aria-pressed={!tour.playing} className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg">
            {tour.playing ? (
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current"><path d="M4 2.5v11l9-5.5z" /></svg>
            )}
          </button>
          <button type="button" onClick={() => tour.choose(i + 1)} aria-label={labels.next} className="flex size-9 items-center justify-center rounded-full border border-fg/15 text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[1.8]"><path d="m6 3 5 5-5 5" /></svg>
          </button>
        </div>
      </div>

      <div className="mt-6 grid items-center gap-1 lg:grid-cols-[minmax(0,0.9fr)_2.5rem_minmax(0,1.45fr)_2.5rem_minmax(0,0.9fr)] lg:gap-0">
        {/* The order */}
        <div key={`t${i}`} className="cx-panel flex flex-col gap-3 rounded-2xl border border-fg/10 bg-fg/[0.03] p-4">
          <p className="flex items-center justify-between gap-2">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", o.side === "buy" ? "bg-market-up/15 text-market-up" : "bg-market-down/15 text-market-down")}>{sideLabel(o.side)}</span>
            <span className="text-xs text-text-secondary">{labels.routeTo.replace("{exchange}", ex(o.ex))}</span>
          </p>
          <p className="font-display text-lg font-semibold text-text-primary">{labels.sample}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <dt className="text-xs text-text-secondary">{labels.shares}</dt>
              <dd className="font-mono tabular-nums text-text-primary">
                {nf(o.qty)} × {nf(o.price, 2)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-text-secondary">{labels.value}</dt>
              <dd className="font-mono tabular-nums text-text-primary">৳ {nf(o.qty * o.price)}</dd>
            </div>
          </dl>
          <p className="border-t border-fg/10 pt-3 text-xs leading-relaxed text-text-secondary">{labels.notes[i]}</p>
        </div>

        <Wire on={step >= 1} />

        {/* The OMS, with RMS inside it */}
        <div className="rounded-2xl border border-dashed border-brand-sky/35 p-2.5 sm:p-3">
          <p className="flex items-center justify-between gap-2 px-1.5 pb-2 text-xs font-semibold text-text-secondary">
            <span>{labels.oms}</span>
            <span className="text-brand-sky">{labels.rmsNote}</span>
          </p>
          <div className={cn("rounded-xl border bg-ink-950/40 p-3 transition-colors duration-500", stopped ? "border-market-down/50" : passed ? "border-market-up/40" : "border-fg/10")}>
            <p className="flex items-center gap-2 pb-2">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 text-brand-sky">
                <path d="M10 2 3.5 4.5v5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5v-5z" className="fill-current opacity-15 stroke-current stroke-[1.4]" />
              </svg>
              <span className="font-display font-semibold text-text-primary">{labels.rms}</span>
            </p>
            <ol className="flex flex-col gap-1">
              {labels.checks.slice(0, CHECKS).map((c, k) => {
                const st = stateOf(k);
                const isOpen = open === k;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : k)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                        st === "stop" ? "bg-market-down/10 text-text-primary" : st === "run" ? "bg-brand-sky/10 text-text-primary" : "text-text-secondary hover:bg-fg/[0.04] hover:text-text-primary",
                      )}
                    >
                      <StatusMark state={st} />
                      <span className="min-w-0 flex-1">{c.title}</span>
                      <span className={cn("shrink-0 text-xs", st === "ok" ? "text-market-up" : st === "stop" ? "font-semibold text-market-down" : st === "run" ? "text-brand-sky" : "text-text-secondary/70")}>
                        {st === "ok" ? labels.passed : st === "stop" ? labels.stopped : st === "run" ? labels.checking : k > limit && done ? "" : labels.waiting}
                      </span>
                    </button>
                    {isOpen && <p className="cx-panel px-2 pt-1 pb-2 pl-[2.1rem] text-xs leading-relaxed text-text-secondary">{c.body}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <Wire on={done} bad={stopped} />

        {/* Where it ends up */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary">{labels.exchanges}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["DSE", "CSE"] as const).map((e) => {
              const lit = passed && o.ex === e;
              return (
                <span
                  key={e}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-xl border font-display text-sm font-semibold transition-all duration-500",
                    lit ? "scale-105 border-market-up/60 bg-market-up/10 text-text-primary shadow-[0_0_30px_-8px_rgb(34_197_94/0.6)]" : "border-fg/10 text-text-secondary",
                  )}
                >
                  {ex(e)}
                </span>
              );
            })}
          </div>
          <span
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all duration-500",
              stopped ? "border-market-down/50 bg-market-down/10 text-text-primary" : "border-fg/10 text-text-secondary",
            )}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-current stroke-[1.6]"><path d="M6 4 2.5 7.5 6 11M3 7.5h7a3.5 3.5 0 0 1 0 7H8" /></svg>
            {labels.trader}
          </span>
        </div>
      </div>

      <p aria-live={tour.playing ? "off" : "polite"} className={cn("mt-5 min-h-6 text-sm font-semibold transition-opacity duration-300", done ? "opacity-100" : "opacity-0", passed ? "text-market-up" : "text-market-down")}>
        {outcome}
      </p>
      <div className="mt-3 flex flex-col gap-2 border-t border-fg/10 pt-4 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>{labels.illustration}</p>
        {labels.learnMore && labels.learnHref && (
          <Link href={labels.learnHref} className="font-semibold text-brand-sky underline-offset-4 hover:underline">
            {labels.learnMore}
          </Link>
        )}
      </div>
    </div>
  );
}
