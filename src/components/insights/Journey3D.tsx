"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

export type JourneyView = {
  title: string;
  intro: string;
  metric: string;
  steps: { date: string; year: string; value: number | null; title: string; body: string; source: string; sourceUrl: string }[];
};

/**
 * Admin → Success stories → Growth journey as a column timeline: milestones in
 * order on one baseline, those with a number as columns that rise to it (the
 * number above, the year below), the others as small markers. Under the scene
 * each milestone is told (what happened, with its source), numbered to match.
 * Calm motion (columns rise once, no bounce); reduced motion shows it still.
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
  const steps = data.steps;
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0));
  const n = steps.length;
  const now = steps.reduce((last, s, i) => (s.value !== null ? i : last), -1);
  // Along the floor's diagonal, which reads left to right on screen.
  const num = (v: number) => digits(new Intl.NumberFormat("en-US").format(v), locale === "bn");
  const idx = (i: number) => digits(String(i + 1).padStart(2, "0"), locale === "bn");

  return (
    <div ref={root} className={cn("jr3-wrap flex flex-col gap-8", on && "is-on")}>
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">{data.title}</h2>
        {data.intro && <p className="max-w-2xl leading-relaxed text-text-secondary">{data.intro}</p>}
      </div>

      <div className="pro-beam pro-mesh relative overflow-hidden rounded-[2rem]">
        {/* The trend through the columns' tops (milestones with a number only). */}
        {(() => {
          const pts = steps
            .map((s, i) => (s.value !== null ? { x: ((i + 0.5) / n) * 100, y: 100 - (18 + (s.value / max) * 82) } : null))
            .filter((p): p is { x: number; y: number } => p !== null);
          if (pts.length < 2) return null;
          return (
            <div className="jrc-trend pointer-events-none absolute inset-x-5 top-14 z-10 h-44 md:inset-x-8 md:h-56" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="block h-full w-full overflow-visible">
              <defs>
                <linearGradient id="jrc-grad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="var(--color-brand-sky)" />
                  <stop offset="1" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
              <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className="jrc-line" />
            </svg>
            </div>
          );
        })()}
        {/* A column timeline: milestones in order on one baseline; those with a number rise to it. */}
        <div
          className="jrc relative grid items-end px-5 pt-14 pb-5 md:px-8"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`${data.metric}: ${steps
            .filter((s) => s.value !== null)
            .map((s) => `${s.date} ${num(s.value!)}`)
            .join(", ")}`}
        >
          {steps.map((s, i) => {
            const h = s.value !== null ? 18 + (s.value / max) * 82 : 0;
            return (
              <div key={i} className="flex flex-col items-center gap-2 px-1.5 md:px-2.5" aria-hidden="true" style={{ "--i": i } as CSSProperties}>
                <div className="relative flex h-44 w-full items-end justify-center md:h-56">
                  {s.value !== null ? (
                    <div className={cn("jrc-col relative w-full max-w-[4.5rem] rounded-t-lg", i === now && "is-now")} style={{ height: `${h}%` }}>
                      <span className="jrc-num absolute inset-x-0 -top-8 text-center font-display text-2xl leading-none font-semibold text-text-primary tabular-nums md:text-3xl">
                        {num(s.value)}
                      </span>
                    </div>
                  ) : (
                    <span className="jrc-mark mb-0 block size-3 rotate-45 rounded-[2px]" />
                  )}
                </div>
                <span className="h-px w-full bg-fg/15" />
                <span className="font-mono text-xs font-semibold text-text-secondary tabular-nums">{digits(s.year, locale === "bn")}</span>
                <span className="font-mono text-[11px] text-gold tabular-nums">{idx(i)}</span>
              </div>
            );
          })}
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
