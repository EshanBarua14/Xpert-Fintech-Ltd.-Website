"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

/** `stat`: an optional figure from the admin (e.g. "৳33 cr", "7"), shown large. */
export type StrengthCard = { icon: string; title: string; body: string; stat?: string };

const AUTO_MS = 5000;

/**
 * Admin → Home highlights → Core strengths, as a constellation: Xpert at the
 * centre, the strengths around it, each joined to the core by a line of light.
 * The highlighted strength (one after another by itself, or the one pointed
 * at) sends a stream along its line and is told in the core. On phones it
 * becomes a vertical chain. Pauses on hover, focus, a hidden tab and for
 * visitors who prefer reduced motion.
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
    if (!el || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
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
  const n = (i: number) => digits(String(i + 1).padStart(2, "0"), locale === "bn");
  const current = items[Math.min(active, items.length - 1)]!;
  // Positions on an ellipse around the core, the first at the top (percent of the stage).
  // Nine or ten strengths: a taller stage, narrower cards and a wider ring so neighbours never touch.
  const many = items.length > 8;
  const rx = many ? 41 : 38;
  const ry = many ? 43 : 41;
  const pos = items.map((_, i) => {
    const a = -Math.PI / 2 + (i / items.length) * Math.PI * 2;
    return { x: 50 + Math.cos(a) * rx, y: 50 + Math.sin(a) * ry };
  });

  return (
    <div
      ref={root}
      className={cn("cn", seen && "is-seen")}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      {/* Large screens: the constellation */}
      <div className={cn("cn-stage relative mx-auto hidden w-full max-w-6xl lg:block", many ? "aspect-[16/12]" : "aspect-[16/10]")} role="group" aria-label={label}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <ellipse cx="50" cy="50" rx={rx} ry={ry} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.15" strokeDasharray="0.6 1.2" className="text-fg" vectorEffect="non-scaling-stroke" />
          {pos.map((p, i) => (
            <g key={i}>
              <line x1="50" y1="50" x2={p.x} y2={p.y} className={cn("cn-line", i === active && "is-on")} vectorEffect="non-scaling-stroke" />
              <line x1="50" y1="50" x2={p.x} y2={p.y} className={cn("cn-stream", i === active && "is-on")} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>

        {/* The core */}
        <div className="absolute top-1/2 left-1/2 flex size-[min(34%,22rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <span aria-hidden="true" className="cn-halo absolute inset-[-14%] rounded-full" />
          <span aria-hidden="true" className="cn-orbit absolute inset-[-6%] rounded-full border border-dashed border-brand-sky/30" />
          <div className="cn-core relative flex size-full flex-col items-center justify-center gap-2 rounded-full border border-fg/10 bg-navy-900/85 p-8 text-center shadow-[0_30px_80px_-30px] shadow-brand-sky/40 backdrop-blur">
            <span key={`i-${active}`} className="cn-swap flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-royal to-brand-sky text-white shadow-lg shadow-brand-sky/30">
              <Icon name={current.icon} className="size-6" />
            </span>
            {current.stat && (
              <p key={`s-${active}`} className="cn-swap stat3d font-display text-5xl leading-none font-semibold tracking-[-0.03em] xl:text-6xl">
                {current.stat}
              </p>
            )}
            <p key={`t-${active}`} className="cn-swap font-display text-lg leading-snug font-semibold text-balance text-text-primary xl:text-xl" aria-live="polite">
              {current.title}
            </p>
            {current.body && (
              <p key={`b-${active}`} className={cn("cn-swap text-[0.8125rem] leading-relaxed text-text-secondary xl:text-sm", current.stat ? "line-clamp-3" : "line-clamp-5")}>
                {current.body}
              </p>
            )}
          </div>
        </div>

        {/* The strengths around it */}
        {items.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={`${s.title}-${i}`}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={cn(
                "cn-node absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-left backdrop-blur transition-[border-color,background-color,box-shadow,transform] duration-500",
                many ? "w-[13.5rem]" : "w-[15.5rem]",
                on ? "is-on border-brand-sky/50 bg-navy-900/90" : "border-fg/10 bg-navy-900/60 hover:border-fg/25",
              )}
              style={{ left: `${pos[i]!.x}%`, top: `${pos[i]!.y}%`, "--k": i } as CSSProperties}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
                  on ? "bg-gradient-to-br from-brand-royal to-brand-sky text-white" : "bg-fg/[0.06] text-brand-sky",
                )}
              >
                <Icon name={s.icon} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                {s.stat ? (
                  <span className={cn("stat3d font-display text-xl leading-none font-semibold tabular-nums", !on && "is-dim")}>{s.stat}</span>
                ) : (
                  <span className={cn("font-mono text-[11px] tabular-nums", on ? "text-gold" : "text-text-secondary")}>{n(i)}</span>
                )}
                <span className="font-display text-[0.95rem] leading-snug font-semibold text-text-primary">{s.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Phones and tablets: a chain */}
      <ol className="cn-chain relative flex flex-col gap-4 pl-8 lg:hidden" aria-label={label}>
        <span aria-hidden="true" className="absolute top-3 bottom-3 left-[0.95rem] w-px bg-gradient-to-b from-brand-sky/60 via-gold/40 to-transparent" />
        {items.map((s, i) => (
          <li key={`${s.title}-${i}`} data-reveal style={{ "--d": i } as CSSProperties} className="relative">
            <span aria-hidden="true" className="absolute top-5 -left-[1.6rem] size-3 rounded-full border-2 border-brand-sky bg-navy-900" />
            <div className="flex flex-col gap-2 rounded-2xl border border-fg/10 bg-navy-900/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-royal to-brand-sky text-white">
                  <Icon name={s.icon} className="size-5" />
                </span>
                <span className="flex flex-col">
                  {s.stat ? (
                    <span className="stat3d font-display text-2xl leading-none font-semibold tabular-nums">{s.stat}</span>
                  ) : (
                    <span className="font-mono text-[11px] text-gold tabular-nums">{n(i)}</span>
                  )}
                  <span className="font-display text-lg leading-snug font-semibold text-text-primary">{s.title}</span>
                </span>
              </div>
              {s.body && <p className="text-sm leading-relaxed text-text-secondary">{s.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
