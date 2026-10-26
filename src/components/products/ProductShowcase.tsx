"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { DeviceShowcase } from "./DeviceShowcase";
import { ProductMark, productVars } from "./ProductMark";
import type { ShowcaseProduct } from "@/lib/public/showcase";
import { cn } from "@/lib/utils/cn";

/**
 * Interactive product showcase: a product rail on one side, a large product
 * stage on the other with the product's interface (screenshot) or animated
 * illustration, its workflow drawn as a live lane and its key capabilities.
 * Cycles through products while on screen. Hovering or focusing holds it; a
 * product the visitor picks stays for a while before the tour carries on;
 * the pause button stops it; reduced motion keeps it still. RMS, built into
 * the OMS, is marked on the OMS and on its step in the workflow.
 */

export type ShowcaseLabels = {
  explore: string;
  workflow: string;
  capabilities: string;
  conceptual: string;
  typeLabels: Record<string, string>;
  play?: string;
  pause?: string;
  /** "RMS built in", shown on the Trading OMS. */
  rmsBuiltIn?: string;
  /** "White-label app" (the trading platform's mobile app under a brokerage's own brand). */
  whiteLabel?: string;
};

const CYCLE_MS = 7000;
/** After a visitor picks a product, the tour waits this long before carrying on. */
const RESUME_MS = 15000;

export function ProductShowcase({ products, labels }: { products: ShowcaseProduct[]; labels: ShowcaseLabels }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [picked, setPicked] = useState(false);
  const resumeAt = useRef(0);
  const [hold, setHold] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || hold || !visible || reduce || products.length < 2) return;
    const id = window.setTimeout(() => {
      if (document.hidden) return;
      setPicked(false);
      setActive((a) => (a + 1) % products.length);
    }, Math.max(CYCLE_MS, resumeAt.current - Date.now()));
    return () => window.clearTimeout(id);
  }, [active, paused, hold, visible, reduce, picked, products.length]);

  if (!products.length) return null;
  const p = products[active] ?? products[0]!;

  const choose = (i: number, focus = false) => {
    const next = (i + products.length) % products.length;
    setActive(next);
    setPicked(true);
    resumeAt.current = Date.now() + RESUME_MS;
    if (focus) tabRefs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: products.length - 1 };
    const target = map[e.key];
    if (target === undefined) return;
    e.preventDefault();
    choose(target, true);
  };

  return (
    <div
      ref={rootRef}
      className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_1fr]"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      {/* Product rail */}
      <div className="flex min-w-0 flex-col gap-3">
      <div role="tablist" aria-orientation="vertical" aria-label={labels.capabilities} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {products.map((item, i) => {
          const on = i === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`showcase-tab-${item.id}`}
              aria-selected={on}
              aria-controls="showcase-stage"
              tabIndex={on ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "group relative flex min-w-[15rem] shrink-0 flex-col gap-1 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-[border-color,background-color] duration-300 lg:min-w-0",
                on ? "border-brand-sky/50 bg-brand-sky/[0.08]" : "border-fg/10 bg-fg/[0.02] hover:border-fg/25",
              )}
            >
              <span className="flex items-center gap-3">
                <ProductMark productKey={item.key} logo={item.logo} look={item.look} size="sm" className={cn("transition-[filter,opacity]", !on && "opacity-80 saturate-50 group-hover:opacity-100 group-hover:saturate-100")} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[max(11px,0.6875rem)] font-semibold text-text-secondary">{labels.typeLabels[item.type] ?? item.type}</span>
                  <span className={cn("font-display text-base leading-snug font-semibold transition-colors", on ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>
                    {item.name}
                  </span>
                </span>
              </span>
              {on && !paused && !picked && !reduce && products.length > 1 && (
                <span
                  key={`bar-${active}`}
                  aria-hidden="true"
                  className="showcase-progress absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-brand-sky to-cyan-300"
                  style={{ animationDuration: `${CYCLE_MS}ms`, animationPlayState: hold || !visible ? "paused" : "running" }}
                />
              )}
            </button>
          );
        })}
      </div>
      {!reduce && products.length > 1 && labels.play && labels.pause && (
        <button
          type="button"
          onClick={() => {
            setPaused((v) => !v);
            resumeAt.current = 0;
            setPicked(false);
          }}
          aria-pressed={paused}
          className="inline-flex items-center gap-2 self-start rounded-full border border-fg/15 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-sky/60 hover:text-fg"
        >
          {paused ? (
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current"><path d="M4 2.5v11l9-5.5z" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>
          )}
          {paused ? labels.play : labels.pause}
        </button>
      )}
      </div>

      {/* Product stage */}
      <div
        id="showcase-stage"
        role="tabpanel"
        aria-labelledby={`showcase-tab-${p.id}`}
        className="beam glass relative overflow-hidden rounded-[2rem] p-2"
      >
        <div key={p.id} style={productVars(p.key, p.look)} className="showcase-stage relative grid gap-0 overflow-hidden rounded-[1.6rem] bg-navy-900/70 xl:grid-cols-[1.25fr_1fr]">
          {/* The product on web, tablet and phone, with its workflow underneath */}
          <div className="relative flex flex-col border-b border-fg/[0.06] xl:border-r xl:border-b-0">
            <div className="relative flex flex-1 items-center justify-center p-6 md:p-8">
              <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
              <DeviceShowcase name={p.name} productKey={p.key} logo={p.logo} look={p.look} visual={p.visual} shots={p.shots} size="md" devices="web-phone" className="showcase-shot relative max-w-[38rem]" />
            </div>
            {p.steps.length > 1 && (
              <div className="border-t border-fg/[0.06] px-5 py-4">
                <p className="mb-3 text-[max(11px,0.6875rem)] font-semibold text-text-secondary">{labels.workflow}</p>
                <ol className="showcase-lane relative flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {p.steps.map((s, i) => (
                    <li key={s} className="showcase-step flex items-center gap-1.5" style={{ animationDelay: `${150 + i * 120}ms` }}>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 font-mono text-[max(11px,0.6875rem)] text-text-primary",
                          /\bRMS\b|আরএমএস/.test(s)
                            ? "border-brand-sky/60 bg-brand-sky/15 shadow-[0_0_18px_-6px_rgb(34_188_235/0.8)]"
                            : "border-[color-mix(in_srgb,var(--p-to)_40%,transparent)] bg-[color-mix(in_srgb,var(--p-to)_12%,transparent)]",
                        )}
                      >
                        {s}
                      </span>
                      {i < p.steps.length - 1 && <span aria-hidden="true" className="showcase-arrow text-text-secondary">→</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Story */}
          <div className="flex flex-col gap-6 p-7 md:p-9">
            <div className="flex flex-col gap-3">
              <ProductMark productKey={p.key} logo={p.logo} look={p.look} name={p.name} size="lg" className="showcase-rise" />
              <h3 className="showcase-rise font-display text-3xl leading-[1.05] font-semibold tracking-[-0.025em] text-balance md:text-4xl">{p.name}</h3>
              {p.key === "trading-platform" && (labels.rmsBuiltIn || labels.whiteLabel) && (
                <span className="showcase-rise flex flex-wrap items-center gap-2 self-start">
                  {labels.rmsBuiltIn && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-sky/30 bg-brand-sky/10 px-2.5 py-0.5 text-xs font-semibold text-brand-sky">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-2"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
                      {labels.rmsBuiltIn}
                    </span>
                  )}
                  {labels.whiteLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-2" strokeLinecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
                      {labels.whiteLabel}
                    </span>
                  )}
                </span>
              )}
              {p.tagline && <p className="showcase-rise text-gradient-brand text-lg font-medium" style={{ animationDelay: "80ms" }}>{p.tagline}</p>}
              {p.summary && (
                <p className="showcase-rise line-clamp-8 leading-relaxed text-text-secondary" style={{ animationDelay: "140ms" }}>
                  {p.summary}
                </p>
              )}
            </div>
            {p.capabilities.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[max(11px,0.6875rem)] font-semibold text-text-secondary">{labels.capabilities}</p>
                <ul className="grid gap-2">
                  {p.capabilities.map((c, i) => (
                    <li key={c} className="showcase-rise flex items-start gap-3 text-sm text-text-primary" style={{ animationDelay: `${200 + i * 70}ms` }}>
                      <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-300" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={p.href}
              className="btn-glow group mt-auto inline-flex h-12 items-center gap-2 self-start rounded-full px-6 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              {labels.explore}
             
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
