"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

export type StrengthCard = { icon: string; title: string; body: string };

const AUTO_MS = 6000;

/**
 * Admin → Home highlights → Core strengths, as an explorer: the strengths as a
 * list on one side and, on the other, a large stage with a moving picture of
 * the chosen one (brokers around one platform, a shield being scanned, orders
 * taking a backup route, institutions holding up a roof, servers with a
 * heartbeat). It moves on by itself with a progress line, pausing on hover,
 * focus, a hidden tab and for visitors who prefer reduced motion.
 */
export function CoreStrengths({ items, locale, label }: { items: StrengthCard[]; locale: "en" | "bn"; label: string }) {
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [seen, setSeen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver((e) => setSeen(e.some((x) => x.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = items.length > 1 && !hold && !reduce && seen;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      if (!document.hidden) setActive((a) => (a + 1) % items.length);
    }, AUTO_MS);
    return () => clearTimeout(id);
  }, [active, running, items.length]);

  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)]!;
  const n = (i: number) => digits(String(i + 1).padStart(2, "0"), locale === "bn");

  return (
    <div
      ref={root}
      className="cs grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      {/* The strengths */}
      <div role="tablist" aria-label={label} aria-orientation="vertical" className="cs-list -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {items.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={`${s.title}-${i}`}
              type="button"
              role="tab"
              id={`cs-tab-${i}`}
              aria-selected={on}
              aria-controls="cs-panel"
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setActive((i + 1) % items.length);
                  (e.currentTarget.parentElement?.children[(i + 1) % items.length] as HTMLElement | undefined)?.focus();
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const p = (i - 1 + items.length) % items.length;
                  setActive(p);
                  (e.currentTarget.parentElement?.children[p] as HTMLElement | undefined)?.focus();
                }
              }}
              className={cn(
                "cs-tab group relative flex shrink-0 snap-start items-center gap-4 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-colors duration-300 lg:px-5 lg:py-4",
                on ? "border-brand-sky/40 bg-fg/[0.05]" : "border-transparent hover:bg-fg/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
                  on ? "bg-gradient-to-br from-brand-royal to-brand-sky text-white shadow-lg shadow-brand-sky/25" : "bg-fg/[0.06] text-text-secondary group-hover:text-text-primary",
                )}
              >
                <Icon name={s.icon} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={cn("font-mono text-[11px] tabular-nums transition-colors", on ? "text-gold" : "text-text-secondary")}>{n(i)}</span>
                <span className={cn("font-display text-base leading-snug font-semibold whitespace-nowrap transition-colors lg:text-lg lg:whitespace-normal", on ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary")}>
                  {s.title}
                </span>
              </span>
              {/* Time until the next one */}
              {on && items.length > 1 && (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-fg/[0.06]">
                  <span key={`${active}-${running}`} className={cn("cs-progress block h-full origin-left bg-gradient-to-r from-brand-sky to-gold", running ? "is-running" : "is-paused")} style={{ "--cs-ms": `${AUTO_MS}ms` } as CSSProperties} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The stage */}
      <div id="cs-panel" role="tabpanel" aria-labelledby={`cs-tab-${active}`} className="cs-stage relative flex flex-col overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70">
        <span aria-hidden="true" className="cs-aurora pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-brand-sky/15 blur-3xl" />
        <span aria-hidden="true" className="cs-aurora cs-aurora-2 pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-gold/10 blur-3xl" />
        <div key={`art-${active}`} className="cs-art relative aspect-[16/9] w-full text-brand-sky">
          <Art icon={current.icon} />
        </div>
        <div key={`text-${active}`} className="cs-text relative flex flex-col gap-3 border-t border-fg/[0.08] p-6 md:p-8">
          <span className="font-mono text-xs text-gold tabular-nums">
            {n(active)} / {n(items.length - 1)}
          </span>
          <h3 className="font-display text-2xl leading-tight font-semibold text-balance text-text-primary md:text-3xl">{current.title}</h3>
          {current.body && <p className="max-w-xl leading-relaxed text-text-secondary">{current.body}</p>}
        </div>
      </div>
    </div>
  );
}

/** A small moving picture for each kind of strength (chosen by its icon). */
function Art({ icon }: { icon: string }) {
  switch (icon) {
    case "users":
      return <ArtBrokers />;
    case "shield":
    case "lock":
      return <ArtShield />;
    case "network":
    case "exchange":
      return <ArtFailover />;
    case "briefcase":
      return <ArtInstitutions />;
    case "cloud":
    case "bolt":
      return <ArtServers />;
    default:
      return <ArtOrbit icon={icon} />;
  }
}

const svg = "absolute inset-0 size-full";

/** Brokers around one platform: they circle slowly and send pulses to the centre. */
function ArtBrokers() {
  const nodes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 200 + Math.cos(a) * 130, y: 112 + Math.sin(a) * 78, i };
  });
  return (
    <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
      <ellipse cx="200" cy="112" rx="130" ry="78" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 6" />
      <g className="cs-spin" style={{ transformOrigin: "200px 112px" }}>
        {nodes.map((p) => (
          <g key={p.i}>
            <line x1={p.x} y1={p.y} x2="200" y2="112" stroke="currentColor" strokeOpacity="0.18" />
            <circle className="cs-pulse-dot" cx={p.x} cy={p.y} r="3" fill="var(--color-gold)" style={{ "--tx": `${200 - p.x}px`, "--ty": `${112 - p.y}px`, animationDelay: `${p.i * 0.35}s` } as CSSProperties} />
            <circle cx={p.x} cy={p.y} r="11" fill="var(--color-navy-900)" stroke="currentColor" strokeOpacity="0.6" />
            <circle cx={p.x} cy={p.y - 2} r="3" fill="currentColor" fillOpacity="0.8" />
            <path d={`M${p.x - 5} ${p.y + 6} q5 -6 10 0`} fill="none" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
          </g>
        ))}
      </g>
      <circle cx="200" cy="112" r="34" fill="currentColor" fillOpacity="0.08" className="cs-breathe" style={{ transformOrigin: "200px 112px" }} />
      <circle cx="200" cy="112" r="24" fill="url(#cs-g1)" />
      <text x="200" y="117" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="var(--font-display, serif)">X</text>
      <defs>
        <linearGradient id="cs-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-royal)" />
          <stop offset="100%" stopColor="var(--color-brand-sky)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** A shield, scanned top to bottom, with ticks appearing around it. */
function ArtShield() {
  return (
    <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
      <defs>
        <clipPath id="cs-shield">
          <path d="M200 38 L254 58 V108 C254 146 230 172 200 186 C170 172 146 146 146 108 V58 Z" />
        </clipPath>
        <linearGradient id="cs-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-sky)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--color-brand-sky)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx="200" cy="112" r="70" fill="none" stroke="currentColor" strokeOpacity="0.25" className="cs-ripple" style={{ transformOrigin: "200px 112px", animationDelay: `${i * 1.2}s` }} />
      ))}
      <path d="M200 38 L254 58 V108 C254 146 230 172 200 186 C170 172 146 146 146 108 V58 Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
      <g clipPath="url(#cs-shield)">
        <rect className="cs-scanline" x="140" y="0" width="120" height="36" fill="url(#cs-scan)" />
      </g>
      <rect x="186" y="104" width="28" height="22" rx="4" fill="currentColor" fillOpacity="0.85" />
      <path d="M191 104 v-7 a9 9 0 0 1 18 0 v7" fill="none" stroke="currentColor" strokeWidth="3" />
      {[
        [96, 70],
        [304, 82],
        [110, 160],
        [292, 154],
      ].map(([x, y], i) => (
        <g key={i} className="cs-pop" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${0.6 + i * 0.5}s` }}>
          <circle cx={x} cy={y} r="11" fill="var(--color-gold)" fillOpacity="0.15" stroke="var(--color-gold)" strokeOpacity="0.7" />
          <path d={`M${x! - 4} ${y} l3 3 l5 -6`} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}

/** Orders from a broker to the exchanges on two routes: when the main one dims, the backup carries on. */
function ArtFailover() {
  return (
    <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
      <path id="cs-route-a" d="M84 112 C150 40 250 40 316 112" fill="none" stroke="currentColor" strokeWidth="2" className="cs-route-a" />
      <path id="cs-route-b" d="M84 112 C150 184 250 184 316 112" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeDasharray="4 6" className="cs-route-b" />
      {[0, 1, 2].map((i) => (
        <circle key={`a${i}`} r="4" fill="currentColor" className="cs-flow-a">
          <animateMotion dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite">
            <mpath href="#cs-route-a" />
          </animateMotion>
        </circle>
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={`b${i}`} r="4" fill="var(--color-gold)" className="cs-flow-b">
          <animateMotion dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite">
            <mpath href="#cs-route-b" />
          </animateMotion>
        </circle>
      ))}
      <g>
        <rect x="44" y="90" width="44" height="44" rx="12" fill="var(--color-navy-900)" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="54" y="102" width="24" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M60 124 h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g>
        <rect x="312" y="84" width="56" height="56" rx="14" fill="url(#cs-g2)" />
        <path d="M326 124 V108 M334 124 V100 M342 124 V112 M350 124 V96" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
      <defs>
        <linearGradient id="cs-g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-royal)" />
          <stop offset="100%" stopColor="var(--color-brand-sky)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Institutions as pillars rising to hold up one roof. */
function ArtInstitutions() {
  const cols = [0, 1, 2, 3, 4, 5];
  return (
    <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
      <path className="cs-roof" d="M110 74 L200 34 L290 74 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="112" y="76" width="176" height="8" rx="2" fill="currentColor" fillOpacity="0.5" />
      {cols.map((i) => (
        <rect
          key={i}
          className="cs-pillar"
          x={124 + i * 28}
          y="90"
          width="12"
          height="82"
          rx="3"
          fill={i % 2 ? "currentColor" : "var(--color-gold)"}
          fillOpacity={i % 2 ? 0.75 : 0.8}
          style={{ transformOrigin: `${130 + i * 28}px 172px`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <rect x="100" y="174" width="200" height="10" rx="3" fill="currentColor" fillOpacity="0.35" />
      <rect x="88" y="186" width="224" height="8" rx="3" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

/** Server racks with blinking lights, under a calm heartbeat line. */
function ArtServers() {
  return (
    <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
      <path className="cs-beat" d="M40 56 H150 L162 36 L176 78 L190 30 L204 66 L214 56 H360" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={112 + r * 64} y="92" width="48" height="104" rx="8" fill="var(--color-navy-900)" stroke="currentColor" strokeOpacity="0.55" />
          {[0, 1, 2, 3].map((u) => (
            <g key={u}>
              <rect x={120 + r * 64} y={102 + u * 23} width="32" height="16" rx="3" fill="currentColor" fillOpacity="0.1" />
              <circle className="cs-led" cx={128 + r * 64} cy={110 + u * 23} r="2.4" fill={u === 3 ? "var(--color-gold)" : "currentColor"} style={{ animationDelay: `${(r * 4 + u) * 0.23}s` }} />
              <path d={`M${134 + r * 64} ${110 + u * 23} h12`} stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Any other icon: the icon at the centre of slowly turning rings. */
function ArtOrbit({ icon }: { icon: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 400 225" className={svg} aria-hidden="true">
        <circle cx="200" cy="112" r="80" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 8" className="cs-spin" style={{ transformOrigin: "200px 112px" }} />
        <circle cx="200" cy="112" r="56" fill="none" stroke="var(--color-gold)" strokeOpacity="0.3" strokeDasharray="30 200" className="cs-spin-rev" style={{ transformOrigin: "200px 112px" }} />
      </svg>
      <span className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-royal to-brand-sky text-white shadow-xl shadow-brand-sky/30">
        <Icon name={icon} className="size-8" />
      </span>
    </div>
  );
}
