"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Emph } from "@/components/ui/Emph";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";
import type { OwnershipView } from "@/lib/public/ownership";

const TEXT = {
  en: {
    capital: "Paid-up capital",
    crore: "crore",
    coin: "Each mark is ৳{v} crore",
    source: "Source",
    houses: "Owner brokerage houses",
    parents: "Parent institutions",
    board: "Board directors",
    owned: "Subsidiary of {p}",
    part: "Part of {p}",
    of: "of {n} owners",
    pick: "Choose a group to see its houses",
  },
  bn: {
    capital: "পরিশোধিত মূলধন",
    crore: "কোটি",
    coin: "প্রতিটি দাগ ৳{v} কোটি",
    source: "সূত্র",
    houses: "মালিক ব্রোকারেজ হাউস",
    parents: "মূল প্রতিষ্ঠান",
    board: "পরিচালনা পর্ষদের সদস্য",
    owned: "{p}-এর সাবসিডিয়ারি",
    part: "{p}-এর অংশ",
    of: "{n} মালিকের মধ্যে",
    pick: "হাউসগুলো দেখতে একটি দল বেছে নিন",
  },
};

const MAX_COINS = 60;
const CYCLE_MS = 4800;

/**
 * Who owns Xpert Fintech, in 3D (Admin → Home highlights → Who owns Xpert Fintech, and Admin →
 * Organizations → Owned by):
 *  - the paid-up capital as a meter: one fine mark per crore, lit in turn round a ring while the figure counts up;
 *  - the owner houses as a unit chart, one logo tile per house grouped by basis (banks,
 *    insurers, corporate groups…), each group's count above it. One basis is lit at a
 *    time (by itself, or the one chosen) and its houses are listed with their parents;
 *  - beside the capital, the owners in figures and as one bar of their mix (synced with the platforms).
 * The board's size is told under Key strengths (governance), not repeated here.
 * Everything comes from the admin; nothing is drawn that is not entered there.
 * Reduced motion: the final state, no cycling.
 */
export function OwnershipShowcase({ data, locale }: { data: OwnershipView; locale: "en" | "bn" }) {
  const t = TEXT[locale];
  const bn = locale === "bn";
  const root = useRef<HTMLDivElement>(null);
  const capNum = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [reduce, setReduce] = useState(false);

  const cap = data.capital;
  const coins = cap ? Math.max(1, Math.min(MAX_COINS, Math.round(cap.crore))) : 0;
  const perCoin = cap ? cap.crore / coins : 0;
  const nf = (v: number, max = 2) => new Intl.NumberFormat(bn ? "bn-BD" : "en-US", { maximumFractionDigits: max }).format(v);

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(r);
    const el = root.current;
    if (!el || r || !("IntersectionObserver" in window)) {
      setOn(true);
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(Boolean(e?.isIntersecting));
        if (e?.isIntersecting) setOn(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The capital counts up while the marks light round the ring.
  useEffect(() => {
    if (!cap || !capNum.current) return;
    if (reduce) {
      capNum.current.textContent = nf(cap.crore);
      return;
    }
    if (!on) {
      capNum.current.textContent = nf(0);
      return;
    }
    let raf = 0;
    const start = performance.now() + 300;
    const length = 400 + coins * 35;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - start) / length));
      if (capNum.current) capNum.current.textContent = nf(Math.round(cap.crore * (1 - Math.pow(1 - k, 2)) * 10) / 10, 1);
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (capNum.current) capNum.current.textContent = nf(cap.crore);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, reduce, cap?.crore]);

  // One basis after another, until someone chooses.
  const n = data.groups.length;
  useEffect(() => {
    if (held || reduce || !visible || n < 2) return;
    const id = setTimeout(() => {
      if (!document.hidden) setActive((a) => (a + 1) % n);
    }, CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, held, reduce, visible, n]);

  const group = data.groups[Math.min(active, Math.max(0, n - 1))];
  return (
    <div ref={root} className={cn("ow flex flex-col gap-6", on && "is-on")}>
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          <Emph text={data.title} />
        </h3>
        {data.intro && <p className="max-w-2xl leading-relaxed text-text-secondary">{data.intro}</p>}
      </div>

      <div className={cn("grid gap-5", (cap || n) && n ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]" : "")}>
        {/* Left: the paid-up capital, then the owners in figures and as one bar (the same colours as the platforms). */}
        {(cap || n > 0) && (
        <div className="flex flex-col gap-4">
        {cap && (
          <div className="pro-beam pro-mesh relative flex flex-1 flex-col overflow-hidden rounded-[2rem]">
            <p className="px-6 pt-6 text-sm font-semibold text-text-secondary md:px-7 md:pt-7">{t.capital}</p>
            {/* A capital meter: one fine mark per unit, lit in turn around the ring; the figure in the centre. */}
            <div className="relative mx-auto my-auto w-full max-w-[16rem] px-6 py-4" aria-hidden="true">
              <span className="cap-sweep" />
              <svg viewBox="0 0 200 200" className="block w-full">
                <circle cx="100" cy="100" r="70" className="cap-ring" />
                {Array.from({ length: coins }, (_, i) => {
                  const a = ((i / coins) * 360 - 90) * (Math.PI / 180);
                  const x1 = 100 + Math.cos(a) * 80;
                  const y1 = 100 + Math.sin(a) * 80;
                  const x2 = 100 + Math.cos(a) * 94;
                  const y2 = 100 + Math.sin(a) * 94;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="cap-mark" style={{ "--i": i } as CSSProperties} />;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-5xl leading-none font-semibold tracking-[-0.03em] text-text-primary tabular-nums md:text-6xl">
                  ৳<span ref={capNum}>{nf(cap.crore)}</span>
                </span>
                <span className="mt-1 text-sm font-semibold text-gold">{t.crore}</span>
              </div>
            </div>
            <span className="sr-only">{`${t.capital}: ৳${nf(cap.crore)} ${t.crore}`}</span>
            <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-fg/[0.08] px-6 py-4 text-xs text-text-secondary md:px-7">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-3 w-0.5 rounded-full bg-gold" />
                {t.coin.replace("{v}", nf(perCoin))}
              </span>
              {cap.source && (
                <span>
                  {t.source}: {cap.source}
                  {cap.asOf &&
                    ` (${new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${cap.asOf}T00:00:00Z`))})`}
                </span>
              )}
            </div>
          </div>
        )}
        {n > 0 && (
          <div className="flex flex-col gap-4 rounded-[2rem] border border-fg/10 bg-navy-900/70 p-5 md:p-6">
            <dl className="grid grid-cols-2 gap-4">
              {[
                { v: digits(data.houses, bn), l: t.houses },
                data.parents > 0 && { v: digits(data.parents, bn), l: t.parents },
              ]
                .filter((x): x is { v: string; l: string } => Boolean(x))
                .map((x) => (
                  <div key={x.l} className="flex flex-col gap-1">
                    <dd className="order-1 font-display text-4xl text-text-primary leading-none font-semibold tabular-nums">{x.v}</dd>
                    <dt className="order-2 text-sm leading-snug text-text-secondary">{x.l}</dt>
                  </div>
                ))}
            </dl>
            {/* The mix of owners: one segment per basis, in step with the platforms and tabs. */}
            <div className="flex flex-col gap-2">
              <div className="ow-mix flex h-3 gap-1 overflow-hidden rounded-full" aria-hidden="true">
                {data.groups.map((g, gi) => (
                  <button
                    key={g.basis}
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setActive(gi);
                      setHeld(true);
                    }}
                    onMouseEnter={() => setActive(gi)}
                    className={cn("ow-seg h-full rounded-full transition-[opacity,transform] duration-500", `is-${g.basis.toLowerCase()}`, gi === active ? "is-lit" : "opacity-45")}
                    style={{ flex: g.houses.length }}
                  />
                ))}
              </div>
              <p className="text-xs text-text-secondary">
                {data.groups.map((g, gi) => (
                  <span key={g.basis} className={cn("mr-3 inline-flex items-center gap-1.5", gi === active && "font-semibold text-text-primary")}>
                    <span aria-hidden="true" className={cn("ow-seg size-2 rounded-full", `is-${g.basis.toLowerCase()}`)} />
                    {digits(g.houses.length, bn)} {g.label}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
        </div>
        )}

        {/* The owners, by basis */}
        {n > 0 && group && (
          <div
            className="pro-mesh relative flex flex-col overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
          >
            {/* The owners as a unit chart: one tile per house, grouped by basis; the chosen basis is lit. */}
            <div className="flex flex-wrap gap-x-5 gap-y-6 p-5 md:p-6" aria-hidden="true">
              {data.groups.map((g, gi) => {
                const lit = gi === active;
                return (
                  <button
                    key={g.basis}
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setActive(gi);
                      setHeld(true);
                    }}
                    onMouseEnter={() => setActive(gi)}
                    className={cn("ow-unit flex min-w-[8.5rem] flex-col gap-2.5 text-left", `is-${g.basis.toLowerCase()}`, lit && "is-lit")}
                    style={{ flex: `${Math.max(1, Math.ceil(g.houses.length / 2))} 1 0` }}
                  >
                    <span className="flex items-baseline gap-2">
                      <b className="ow-unit-count font-display text-3xl leading-none font-semibold tabular-nums">{digits(g.houses.length, bn)}</b>
                      <span className="text-xs leading-tight font-semibold text-text-secondary">{g.label}</span>
                    </span>
                    <span className="grid grid-cols-[repeat(auto-fill,minmax(3.6rem,1fr))] gap-1.5">
                      {g.houses.map((h, hi) => (
                        <span key={h.name} className="ow-tile pro-shimmer flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-white p-1.5" style={{ "--k": gi * 4 + hi } as CSSProperties}>
                          {h.logo ? (
                            <Image src={h.logo.url} alt="" width={h.logo.width ?? 96} height={h.logo.height ?? 72} className="h-full w-full object-contain" />
                          ) : (
                            <span className="font-display text-[11px] font-semibold text-[#0b1c31]">
                              {h.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
                            </span>
                          )}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Choose a basis */}
            <div role="tablist" aria-label={t.pick} className="relative z-10 flex flex-wrap gap-2 border-t border-fg/[0.08] px-5 pt-4 md:px-6">
              {data.groups.map((g, gi) => (
                <button
                  key={g.basis}
                  type="button"
                  role="tab"
                  aria-selected={gi === active}
                  onClick={() => {
                    setActive(gi);
                    setHeld(true);
                  }}
                  onMouseEnter={() => setActive(gi)}
                  className={cn(
                    "ow-tab inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                    `is-${g.basis.toLowerCase()}`,
                    gi === active ? "border-transparent text-text-primary" : "border-fg/10 text-text-secondary hover:border-fg/25",
                  )}
                >
                  <span aria-hidden="true" className="ow-dot size-2.5 rounded-full" />
                  {g.label}
                  <span className="font-mono text-xs tabular-nums opacity-80">{digits(g.houses.length, bn)}</span>
                </button>
              ))}
            </div>

            {/* The chosen basis, house by house */}
            <div role="tabpanel" key={group.basis} className="ow-panel relative z-10 flex flex-col gap-3 px-5 pt-4 pb-5 md:px-6 md:pb-6">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {digits(group.houses.length, bn)} {t.of.replace("{n}", digits(data.houses, bn))}
                </span>{" "}
                · {group.blurb}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.houses.map((h, i) => (
                  <li key={h.name} className="ow-house flex items-center gap-3 rounded-2xl border border-fg/[0.08] bg-fg/[0.02] p-2.5" style={{ "--i": i } as CSSProperties}>
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5">
                      {h.logo ? (
                        <Image src={h.logo.url} alt="" width={h.logo.width ?? 112} height={h.logo.height ?? 80} className="h-full w-full object-contain" />
                      ) : (
                        <span className="font-display text-xs font-semibold text-[#0b1c31]">{h.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}</span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      {h.url ? (
                        <a href={h.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-semibold text-text-primary hover:text-brand-sky">
                          {h.name}
                        </a>
                      ) : (
                        <span className="truncate text-sm font-semibold text-text-primary">{h.name}</span>
                      )}
                      {h.parent && group.basis !== "INDEPENDENT" && <span className="truncate text-xs text-text-secondary">{(group.basis === "CORPORATE" ? t.part : t.owned).replace("{p}", h.parent)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
