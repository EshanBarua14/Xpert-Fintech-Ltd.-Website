"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils/cn";

const fmt = (locale: string, v: number, digits: number) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

type Props = {
  /** The share, 0–100 (Admin → Market data). */
  pct: number;
  /** Under the figure, e.g. "DSE · 21 Sep". */
  caption?: string;
  /** A gold tick on the ring at the goal, with its label (e.g. "Goal 70% by 2028"). */
  goal?: { pct: number; label: string } | null;
  /** Screen-reader text for the whole figure. */
  label: string;
  locale: "en" | "bn";
  size?: "md" | "sm";
  className?: string;
};

const R = 84;
const C = 2 * Math.PI * R;

/**
 * A share of the market as a precise donut: a thin track for the whole
 * turnover and Xpert's share drawn along it when it comes into view, the figure
 * counting up in the centre, and a gold tick at the goal. Calm, exact motion
 * (one ease-out, no bounce); reduced-motion visitors see it drawn.
 * (Kept under its earlier name so callers stay the same.)
 */
export function ShareCoin3D({ pct, caption, goal, label, locale, size = "md", className }: Props) {
  const gid = `donut-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const root = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const head = useRef<SVGCircleElement>(null);
  const p = Math.max(0, Math.min(100, pct));
  const digits = Number.isInteger(p) ? 0 : 2;

  useEffect(() => {
    const el = root.current;
    const set = (k: number) => {
      arc.current?.setAttribute("stroke-dasharray", `${(C * p * k) / 100} ${C}`);
      // The light at the arc's leading edge.
      const a = (((p * k) / 100) * 360 - 90) * (Math.PI / 180);
      head.current?.setAttribute("cx", String(100 + Math.cos(a) * R));
      head.current?.setAttribute("cy", String(100 + Math.sin(a) * R));
      if (num.current) num.current.textContent = fmt(locale, p * k, digits);
    };
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      set(1);
      return;
    }
    set(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const start = performance.now() + 150;
        const tick = (now: number) => {
          const k = Math.max(0, Math.min(1, (now - start) / 1600));
          set(1 - Math.pow(1 - k, 3));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [p, digits, locale]);

  const g = goal ? Math.max(0, Math.min(100, goal.pct)) : null;
  // Angles start at 12 o'clock, clockwise.
  const at = (v: number, r: number) => {
    const a = ((v / 100) * 360 - 90) * (Math.PI / 180);
    return { x: 100 + Math.cos(a) * r, y: 100 + Math.sin(a) * r };
  };

  return (
    <div ref={root} role="img" aria-label={label} className={cn("donut relative mx-auto flex flex-col items-center gap-3", size === "sm" ? "w-40" : "w-full max-w-[17rem]", className)}>
      <div className="relative w-full">
        <svg viewBox="0 0 200 200" className="block w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-brand-sky)" />
              <stop offset="1" stopColor="var(--color-brand-royal)" />
            </linearGradient>
          </defs>
          {/* Fine ticks every 10%. */}
          {Array.from({ length: 10 }, (_, i) => {
            const a = at(i * 10, 99);
            const b = at(i * 10, 95);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="donut-tick" />;
          })}
          <circle cx="100" cy="100" r="68" className="donut-halo" />
          <circle cx="100" cy="100" r={R} className="donut-track" />
          <circle
            ref={arc}
            cx="100"
            cy="100"
            r={R}
            className="donut-arc"
            stroke={`url(#${gid})`}
            strokeDasharray={`${(C * p) / 100} ${C}`}
            transform="rotate(-90 100 100)"
          />
          <circle ref={head} r="4" className="donut-head" cx={100 + Math.cos(((p / 100) * 360 - 90) * (Math.PI / 180)) * R} cy={100 + Math.sin(((p / 100) * 360 - 90) * (Math.PI / 180)) * R} />
          {g !== null && (
            <g className="donut-goal">
              <line x1={at(g, R - 11).x} y1={at(g, R - 11).y} x2={at(g, R + 11).x} y2={at(g, R + 11).y} />
            </g>
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn("font-display leading-none font-semibold tracking-[-0.03em] text-text-primary tabular-nums", size === "sm" ? "text-3xl" : "text-5xl")}>
            <span ref={num}>{fmt(locale, p, digits)}</span>
            <span className="ml-0.5 text-[0.5em] text-text-secondary">%</span>
          </span>
          {caption && size !== "sm" && <span className="mt-2 text-xs font-medium text-text-secondary">{caption}</span>}
        </div>
      </div>
      {goal && goal.label && size !== "sm" && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold">
          <span aria-hidden="true" className="h-3 w-0.5 rounded-full bg-gold" />
          {goal.label}
        </span>
      )}
    </div>
  );
}
