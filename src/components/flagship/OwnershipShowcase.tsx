"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Emph } from "@/components/ui/Emph";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";
import type { OwnershipView } from "@/lib/public/ownership";

const TEXT = {
  en: {
    capital: "Paid-up capital",
    crore: "crore",
    coin: "Each coin is ৳{v} crore",
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
    coin: "প্রতিটি কয়েন ৳{v} কোটি",
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

const MAX_COINS = 40;
const PER_STACK = 10;
const CYCLE_MS = 4800;

/**
 * Who owns Xpert, in 3D (Admin → Home highlights → Who owns Xpert, and Admin →
 * Organizations → Owned by):
 *  - the paid-up capital as gold coins dropping into stacks while the figure counts up;
 *  - the owner houses as blocks standing on one platform per basis (banks, insurers,
 *    corporate groups…), each platform's count floating above it. One basis is lit at a
 *    time (by itself, or the one chosen) and its houses are listed with their parents;
 *  - the totals underneath: houses, parent institutions, board directors, capital.
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

  // The capital counts up while the coins drop in.
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
    const length = 500 + coins * 55;
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

  const lean = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const rest = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  };

  const group = data.groups[Math.min(active, Math.max(0, n - 1))];
  // Platforms along the floor's diagonal (reads left to right); blocks two abreast.
  const W = 2.4;
  const gap = 0.5;
  const plat = data.groups.map((g) => {
    const rows = Math.ceil(g.houses.length / 2);
    return { w: 2 * W + gap + 1.4, d: rows * (W + gap) - gap + 1.4, rows };
  });
  const spacing = 11;
  const span = (n - 1) * spacing;
  const at = (i: number) => (n === 1 ? 0 : -span / 2 + i * spacing) / Math.SQRT2;
  const stacks = Math.ceil(coins / PER_STACK);
  const stackAt = (s: number) => {
    // A small cluster: two rows of stacks.
    const col = s % 2;
    const row = Math.floor(s / 2);
    return { x: (col - 0.5) * 5.4 + row * 1.4, y: row * 5.2 - (Math.ceil(stacks / 2) - 1) * 2.6 };
  };

  return (
    <div ref={root} className={cn("ow flex flex-col gap-6", on && "is-on")}>
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          <Emph text={data.title} />
        </h3>
        {data.intro && <p className="max-w-2xl leading-relaxed text-text-secondary">{data.intro}</p>}
      </div>

      <div className={cn("grid gap-5", cap && n ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]" : "")}>
        {/* Paid-up capital */}
        {cap && (
          <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-gold/25 bg-navy-900/70">
            <div className="relative z-10 flex flex-col gap-1 px-6 pt-6 md:px-7 md:pt-7">
              <p className="text-sm font-semibold text-text-secondary">{t.capital}</p>
              <p className="flex items-baseline gap-2 font-display leading-none font-semibold" aria-label={`${t.capital}: ৳${nf(cap.crore)} ${t.crore}`}>
                <span aria-hidden="true" className="stat3d text-6xl tracking-[-0.03em] tabular-nums md:text-7xl">
                  ৳<span ref={capNum}>{nf(cap.crore)}</span>
                </span>
                <span aria-hidden="true" className="text-2xl text-gold">{t.crore}</span>
              </p>
            </div>
            <div className="x3 oc3" onPointerMove={lean} onPointerLeave={rest} aria-hidden="true">
              <div className="x3-world">
                <div className="oc3-floor" />
                {Array.from({ length: stacks }, (_, s) => {
                  const p = stackAt(s);
                  const count = Math.min(PER_STACK, coins - s * PER_STACK);
                  return (
                    <div key={s}>
                      <div className="oc3-shadow" style={{ "--x": `${p.x}em`, "--y": `${p.y}em` } as CSSProperties} />
                      {Array.from({ length: count }, (_, k) => {
                        const i = s * PER_STACK + k;
                        return (
                          <div key={k} className="oc3-coin" style={{ "--x": `${p.x}em`, "--y": `${p.y}em`, "--z": `${k * 0.62}em`, "--i": i, "--r": `${((i * 47) % 11) - 5}deg` } as CSSProperties}>
                            <i className="l0" />
                            <i className="l1" />
                            <i className="l2" />
                            <i className="l3" />
                            <i className="top" />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-fg/[0.08] px-6 py-4 text-xs text-text-secondary md:px-7">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full bg-gradient-to-br from-[#f6d995] to-gold" />
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

        {/* The owners, by basis */}
        {n > 0 && group && (
          <div
            className="relative flex flex-col overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
          >
            <div className="x3 ow3" onPointerMove={lean} onPointerLeave={rest} aria-hidden="true">
              <div className="x3-world">
                <div className="ow3-floor" />
                {data.groups.map((g, gi) => {
                  const cx = at(gi);
                  const cy = -at(gi);
                  const P = plat[gi]!;
                  const lit = gi === active;
                  return (
                    <div key={g.basis} className={cn("ow3-group", `is-${g.basis.toLowerCase()}`, lit && "is-lit")} style={{ "--gi": gi } as CSSProperties}>
                      <div className="x3-box ow3-plat" style={{ "--x": `${cx}em`, "--y": `${cy}em`, "--w": `${P.w}em`, "--d": `${P.d}em`, "--h": "0.5em" } as CSSProperties}>
                        <i className="t" />
                        <i className="s" />
                        <i className="e" />
                      </div>
                      {g.houses.map((h, hi) => {
                        const col = hi % 2;
                        const row = Math.floor(hi / 2);
                        const bx = cx - (W + gap) / 2 + col * (W + gap);
                        const by = cy - (P.d - 1.4) / 2 + W / 2 + row * (W + gap);
                        return (
                          <div
                            key={h.name}
                            className="x3-box ow3-block"
                            style={{ "--x": `${bx}em`, "--y": `${by}em`, "--w": `${W}em`, "--d": `${W}em`, "--h": "2.8em", "--z": "0.5em", "--k": gi * 3 + hi } as CSSProperties}
                          >
                            <i className="t" />
                            <i className="s" />
                            <i className="e" />
                          </div>
                        );
                      })}
                      <div className="x3-bill ow3-label" style={{ "--x": `${cx}em`, "--y": `${cy}em`, "--z": `${4.8 + (lit ? 1 : 0)}em` } as CSSProperties}>
                        <span className="flex flex-col items-center leading-none">
                          <b className="ow3-count">{digits(g.houses.length, bn)}</b>
                          <span className="ow3-name">{g.label}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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

      {/* The totals */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          data.houses > 0 && { v: digits(data.houses, bn), l: t.houses },
          data.parents > 0 && { v: digits(data.parents, bn), l: t.parents },
          data.board > 0 && { v: digits(data.board, bn), l: t.board },
          cap && { v: `৳${nf(cap.crore)} ${t.crore}`, l: t.capital },
        ]
          .filter((x): x is { v: string; l: string } => Boolean(x))
          .map((x, i) => (
            <div key={x.l} data-reveal style={{ "--d": i } as CSSProperties} className="ow-stat flex flex-col gap-1 rounded-2xl border border-fg/10 bg-navy-900/60 px-5 py-4">
              <dd className="order-1 stat3d font-display text-3xl leading-none font-semibold tabular-nums md:text-4xl">{x.v}</dd>
              <dt className="order-2 text-sm text-text-secondary">{x.l}</dt>
            </div>
          ))}
      </dl>
    </div>
  );
}
