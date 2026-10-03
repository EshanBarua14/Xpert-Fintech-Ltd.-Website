"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CapabilityVisual } from "@/components/flagship/Visuals";
import type { ShowcaseProduct } from "@/lib/public/showcase";
import { cn } from "@/lib/utils/cn";

/**
 * Interactive product showcase: a product rail on one side, a large product
 * stage on the other with the product's interface (screenshot) or animated
 * illustration, its workflow drawn as a live lane and its key capabilities.
 * Cycles through products while on screen; stops when the visitor interacts,
 * hovers, focuses, or prefers reduced motion.
 */

export type ShowcaseLabels = {
  explore: string;
  workflow: string;
  capabilities: string;
  conceptual: string;
  typeLabels: Record<string, string>;
};

const CYCLE_MS = 7000;

export function ProductShowcase({ products, labels }: { products: ShowcaseProduct[]; labels: ShowcaseLabels }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
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
    if (!auto || hold || !visible || reduce || products.length < 2) return;
    const id = window.setTimeout(() => {
      if (!document.hidden) setActive((a) => (a + 1) % products.length);
    }, CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [active, auto, hold, visible, reduce, products.length]);

  if (!products.length) return null;
  const p = products[active] ?? products[0]!;

  const choose = (i: number, focus = false) => {
    const next = (i + products.length) % products.length;
    setActive(next);
    setAuto(false);
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
                "group relative flex min-w-[13rem] shrink-0 flex-col gap-1 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-[border-color,background-color] duration-300 lg:min-w-0",
                on ? "border-brand-sky/50 bg-brand-sky/[0.08]" : "border-fg/10 bg-fg/[0.02] hover:border-fg/25",
              )}
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-text-secondary uppercase">
                <span className={cn("size-1.5 rounded-full transition-colors", on ? "bg-cyan-300 shadow-[0_0_10px_2px_rgb(103_232_249/0.6)]" : "bg-fg/25")} />
                {labels.typeLabels[item.type] ?? item.type}
              </span>
              <span className={cn("font-display text-base leading-snug font-semibold transition-colors", on ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>
                {item.name}
              </span>
              {on && auto && !reduce && products.length > 1 && (
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

      {/* Product stage */}
      <div
        id="showcase-stage"
        role="tabpanel"
        aria-labelledby={`showcase-tab-${p.id}`}
        className="beam glass relative overflow-hidden rounded-[2rem] p-2"
      >
        <div key={p.id} className="showcase-stage relative grid gap-0 overflow-hidden rounded-[1.6rem] bg-navy-900/70 xl:grid-cols-[1.15fr_1fr]">
          {/* Interface window */}
          <div className="relative flex flex-col border-b border-fg/[0.06] xl:border-r xl:border-b-0">
            <div className="flex items-center gap-2 border-b border-fg/[0.06] px-4 py-3">
              <span className="size-2.5 rounded-full bg-fg/15" />
              <span className="size-2.5 rounded-full bg-fg/15" />
              <span className="size-2.5 rounded-full bg-fg/15" />
              <span className="ml-3 truncate font-mono text-[11px] tracking-wider text-text-secondary">{p.name}</span>
              {!p.image && (
                <span className="ml-auto rounded-full border border-fg/10 px-2 py-0.5 text-[10px] tracking-wider text-text-secondary uppercase">{labels.conceptual}</span>
              )}
            </div>
            <div className="relative flex min-h-[18rem] flex-1 items-center justify-center p-5 md:min-h-[22rem]">
              <div className="grid-fade pointer-events-none absolute inset-0 opacity-50" />
              {p.image ? (
                <Image
                  src={p.image.url}
                  alt={p.image.alt || p.name}
                  width={p.image.width ?? 1280}
                  height={p.image.height ?? 800}
                  sizes="(min-width: 1280px) 40vw, (min-width: 1024px) 60vw, 100vw"
                  className="showcase-shot relative h-auto max-h-[24rem] w-full rounded-xl object-contain shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-fg/10"
                />
              ) : (
                <div className="showcase-shot relative h-full min-h-[14rem] w-full">
                  <CapabilityVisual kind={p.visual} />
                </div>
              )}
            </div>
            {p.steps.length > 1 && (
              <div className="border-t border-fg/[0.06] px-5 py-4">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-text-secondary uppercase">{labels.workflow}</p>
                <ol className="showcase-lane relative flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {p.steps.map((s, i) => (
                    <li key={s} className="showcase-step flex items-center gap-1.5" style={{ animationDelay: `${150 + i * 120}ms` }}>
                      <span className="rounded-full border border-brand-sky/30 bg-brand-sky/10 px-2.5 py-1 font-mono text-[11px] text-cyan-300">{s}</span>
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
              <h3 className="showcase-rise font-display text-3xl leading-[1.05] font-semibold tracking-[-0.025em] text-balance md:text-4xl">{p.name}</h3>
              {p.tagline && <p className="showcase-rise text-gradient-brand text-lg font-medium" style={{ animationDelay: "80ms" }}>{p.tagline}</p>}
              {p.summary && (
                <p className="showcase-rise line-clamp-5 leading-relaxed text-text-secondary" style={{ animationDelay: "140ms" }}>
                  {p.summary}
                </p>
              )}
            </div>
            {p.capabilities.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-text-secondary uppercase">{labels.capabilities}</p>
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
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
