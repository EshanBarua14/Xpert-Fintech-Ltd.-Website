"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

export type JourneyView = {
  title: string;
  intro: string;
  metric: string;
  steps: { date: string; year: string; value: number | null; title: string; body: string; source: string; sourceUrl: string }[];
};

/**
 * Admin → Success stories → Growth journey, drawn in 3D: the milestones stand
 * on a lit floor in order, those with a number as bars that grow to it (the
 * number and year float above), the others as glowing markers. Under the scene
 * each milestone is told (what happened, with its source), numbered to match.
 * The scene sways and leans towards the pointer; reduced motion shows it still.
 */
export function Journey3D({ data, locale, sourceLabel }: { data: JourneyView; locale: "en" | "bn"; sourceLabel: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
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

  const steps = data.steps;
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0));
  const n = steps.length;
  const now = steps.reduce((last, s, i) => (s.value !== null ? i : last), -1);
  // Along the floor's diagonal, which reads left to right on screen.
  const span = Math.min(34, 8 * Math.max(1, n - 1));
  const at = (i: number) => (n === 1 ? 0 : -span / 2 + (span * i) / (n - 1)) / Math.SQRT2;
  const num = (v: number) => digits(new Intl.NumberFormat("en-US").format(v), locale === "bn");
  const idx = (i: number) => digits(String(i + 1).padStart(2, "0"), locale === "bn");

  return (
    <div ref={root} className={cn("jr3-wrap flex flex-col gap-8", on && "is-on")}>
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">{data.title}</h2>
        {data.intro && <p className="max-w-2xl leading-relaxed text-text-secondary">{data.intro}</p>}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-fg/10 bg-navy-900/70">
        <div
          className="x3 jr3"
          role="img"
          aria-label={`${data.metric}: ${steps
            .filter((s) => s.value !== null)
            .map((s) => `${s.date} ${num(s.value!)}`)
            .join(", ")}`}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <div className="x3-world" aria-hidden="true">
            <div className="jr3-floor" />
            <div className="jr3-path" style={{ "--len": `${span + 6}em` } as CSSProperties} />
            {steps.map((s, i) => {
              const x = at(i);
              const y = -at(i);
              const h = s.value !== null ? 2 + (s.value / max) * 12 : 0;
              return (
                <div key={i} style={{ "--i": i } as CSSProperties}>
                  <div className="jr3-pad" style={{ "--x": `${x}em`, "--y": `${y}em` } as CSSProperties} />
                  {s.value !== null ? (
                    <div className={cn("x3-box jr3-bar", i === now && "is-now")} style={{ "--x": `${x}em`, "--y": `${y}em`, "--w": "3.6em", "--d": "3.6em", "--hmax": `${h}em`, "--i": i } as CSSProperties}>
                      <i className="t" />
                      <i className="s" />
                      <i className="e" />
                    </div>
                  ) : (
                    <div className="x3-box jr3-gem" style={{ "--x": `${x}em`, "--y": `${y}em`, "--w": "2em", "--d": "2em", "--h": "2em", "--i": i } as CSSProperties}>
                      <i className="t" />
                      <i className="s" />
                      <i className="e" />
                    </div>
                  )}
                  <div className="x3-bill jr3-label" style={{ "--x": `${x}em`, "--y": `${y}em`, "--z": `${(s.value !== null ? h : 2) + 1.2}em`, "--i": i } as CSSProperties}>
                    <span className="flex flex-col items-center leading-none">
                      {s.value !== null && <b className="jr3-num">{num(s.value)}</b>}
                      <span className="jr3-year">{digits(s.year, locale === "bn")}</span>
                      <span className="jr3-idx">{idx(i)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {data.metric && (
          <p className="pointer-events-none absolute top-4 left-5 flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <span aria-hidden="true" className="size-3 rounded-[3px] bg-gradient-to-br from-brand-sky to-brand-royal" />
            {data.metric}
          </p>
        )}
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        {steps.map((s, i) => (
          <li key={i} data-reveal style={{ "--d": i } as CSSProperties} className="flex flex-col gap-2 rounded-2xl border border-fg/10 bg-navy-900/60 p-5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs text-gold tabular-nums">{idx(i)}</span>
              <span className="text-xs text-text-secondary">{s.date}</span>
            </span>
            {s.value !== null && <span className="stat3d font-display text-3xl leading-none font-semibold">{num(s.value)}</span>}
            <span className="font-display text-lg leading-snug font-semibold text-balance text-text-primary">{s.title}</span>
            {s.body && <span className="text-sm leading-relaxed text-text-secondary">{s.body}</span>}
            {s.source && (
              <span className="mt-auto pt-1 text-xs text-text-secondary">
                {sourceLabel}:{" "}
                {s.sourceUrl ? (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-fg/30 underline-offset-2 hover:text-text-primary">
                    {s.source}
                  </a>
                ) : (
                  s.source
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
