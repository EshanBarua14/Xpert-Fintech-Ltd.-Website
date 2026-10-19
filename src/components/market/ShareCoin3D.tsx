"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { cn } from "@/lib/utils/cn";

const BASE_LAYERS = 12;
const WEDGE_LAYERS = 28;

const fmt = (locale: string, v: number, digits: number) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

type Props = {
  /** The share, 0–100 (Admin → Market data). */
  pct: number;
  /** Under the figure, e.g. "of DSE turnover · 12 Oct". */
  caption?: string;
  /** Gold pin on the rim at the goal, with its label (e.g. "Goal 60% · 2028"). */
  goal?: { pct: number; label: string } | null;
  /** Screen-reader text for the whole figure. */
  label: string;
  locale: "en" | "bn";
  size?: "md" | "sm";
  className?: string;
};

/**
 * A share of the market drawn as a 3D pie: a glass disc for the whole turnover
 * and, pulled out of it, a raised wedge for Xpert's share. When it scrolls into
 * view the wedge opens to the figure and rises while the figure counts up; the
 * scene sways gently and leans towards the pointer. CSS 3D only (fx3d.css).
 * The real figure is in the server HTML; reduced-motion visitors see it still.
 */
export function ShareCoin3D({ pct, caption, goal, label, locale, size = "md", className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const p = Math.max(0, Math.min(100, pct));
  const digits = Number.isInteger(p) ? 0 : 2;

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const set = (k: number) => {
      el.style.setProperty("--p", String(p * k));
      el.style.setProperty("--rise", String(k));
      if (num.current) num.current.textContent = fmt(locale, p * k, digits);
    };
    set(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const start = performance.now() + 250;
        const tick = (now: number) => {
          const k = Math.max(0, Math.min(1, (now - start) / 1900));
          set(1 - Math.pow(1 - k, 4));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      set(1);
    };
  }, [p, digits, locale]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  };

  // The wedge is centred on the front of the disc; the goal sits at its own angle from the wedge's start.
  const r = size === "sm" ? 6.4 : 9.5;
  const start = 180 - p * 1.8;
  const goalAngle = goal ? start + Math.max(0, Math.min(100, goal.pct)) * 3.6 : 0;
  const gx = Math.sin((goalAngle * Math.PI) / 180) * r * 0.93;
  const gy = -Math.cos((goalAngle * Math.PI) / 180) * r * 0.93;

  return (
    <div
      ref={root}
      role="img"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("x3 sh3", size === "sm" && "is-sm", className)}
      style={{ "--p": p, "--rise": 1 } as CSSProperties}
    >
      <div className="x3-world" aria-hidden="true">
        <div className="sh3-floor" />
        <div className="sh3-shadow" />
        {Array.from({ length: BASE_LAYERS }, (_, i) => (
          <div key={`b${i}`} className={cn("sh3-l sh3-base", i === BASE_LAYERS - 1 && "is-top")} style={{ "--i": i } as CSSProperties} />
        ))}
        {Array.from({ length: WEDGE_LAYERS }, (_, i) => (
          <div key={`w${i}`} className={cn("sh3-l sh3-wedge", i === WEDGE_LAYERS - 1 && "is-top")} style={{ "--i": i } as CSSProperties} />
        ))}
        {goal && (
          <>
            <div className="sh3-pin" style={{ "--a": `${goalAngle}deg` } as CSSProperties}>
              <b />
            </div>
            <div className="x3-bill" style={{ "--x": `${gx}em`, "--y": `${gy}em`, "--z": "1.5em" } as CSSProperties}>
              <div className="sh3-goalwrap">
                <span className="sh3-goal">{goal.label}</span>
              </div>
            </div>
          </>
        )}
        <div className="x3-bill" style={{ "--x": "0em", "--y": `${r * 0.5 + 1.5}em`, "--z": size === "sm" ? "7em" : "9.5em" } as CSSProperties}>
          <div className="sh3-tag">
            <span className="sh3-num">
              <span ref={num}>{fmt(locale, p, digits)}</span>
              <small>%</small>
            </span>
            {caption && <span className="sh3-cap">{caption}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
