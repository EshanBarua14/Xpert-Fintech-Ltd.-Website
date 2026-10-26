"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { digits } from "@/lib/i18n/digits";
import { cn } from "@/lib/utils/cn";

export type JourneyView = {
  title: string;
  intro: string;
  metric: string;
  steps: { date: string; year: string; iso?: string; value: number | null; title: string; body: string; source: string; sourceUrl: string }[];
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
  // Six-monthly: every half-year from the first milestone to the latest (Jan–Jun, Jul–Dec).
  const when = (s: (typeof steps)[number]): { y: number; h: 0 | 1 | null } => {
    const iso = s.iso ?? s.year;
    const y = Number(iso.slice(0, 4));
    // A figure dated only by its year counts for that year's second half (known by the year's end).
    return { y, h: iso.length >= 7 ? (Number(iso.slice(5, 7)) <= 6 ? 0 : 1) : s.value !== null ? 1 : null };
  };
  const dated = steps.map((s, i) => ({ i, s, ...when(s) }));
  const firstY = Math.min(...dated.map((d) => d.y));
  const lastY = Math.max(...dated.map((d) => d.y));
  const firstH = dated.filter((d) => d.y === firstY).some((d) => d.h === null || d.h === 0) ? 0 : 1;
  const lastH = dated.filter((d) => d.y === lastY).some((d) => d.h === null || d.h === 1) ? 1 : 0;
  const halves: { y: number; h: 0 | 1; value: number | null; marks: number[] }[] = [];
  for (let y = firstY; y <= lastY; y++) {
    for (const h of [0, 1] as const) {
      if ((y === firstY && h < firstH) || (y === lastY && h > lastH)) continue;
      const inHalf = dated.filter((d) => d.y === y && d.h === h);
      const withValue = inHalf.filter((d) => d.s.value !== null);
      halves.push({ y, h, value: withValue.length ? withValue[withValue.length - 1]!.s.value : null, marks: inHalf.map((d) => d.i) });
    }
  }
  const slot = (y: number, h: 0 | 1) => halves.findIndex((b) => b.y === y && b.h === h);
  const yearOnly = dated
    .filter((d) => d.h === null)
    .map((d) => {
      const a = slot(d.y, 0);
      const b = slot(d.y, 1);
      const x = a >= 0 && b >= 0 ? (a + 1) / halves.length : ((a >= 0 ? a : b) + 0.5) / halves.length;
      return { i: d.i, x };
    });
  const max = Math.max(1, ...halves.map((b) => b.value ?? 0));
  const now = halves.reduce((last, b, k) => (b.value !== null ? k : last), -1);
  const half = (h: 0 | 1) => (locale === "bn" ? (h === 0 ? "জানু–জুন" : "জুলাই–ডিসে") : h === 0 ? "Jan–Jun" : "Jul–Dec");
  const num = (v: number) => digits(new Intl.NumberFormat("en-US").format(v), locale === "bn");
  const idx = (i: number) => digits(String(i + 1).padStart(2, "0"), locale === "bn");

  return (
    <div ref={root} className={cn("jr3-wrap flex flex-col gap-8", on && "is-on")}>
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">{data.title}</h2>
        {data.intro && <p className="max-w-2xl leading-relaxed text-text-secondary">{data.intro}</p>}
      </div>

      <div className="pro-beam pro-mesh relative overflow-hidden rounded-[2rem]">
        {/* The trend through the columns' tops (half-years with a number only). */}
        {(() => {
          const pts = halves
            .map((b, k) => (b.value !== null ? { x: ((k + 0.5) / halves.length) * 100, y: 100 - (18 + (b.value / max) * 82) } : null))
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
        {/* A six-monthly timeline: one column per half-year from the first milestone to the latest;
            the latest figure in each half rises as a column, milestones without a figure are markers. */}
        <div
          className="jrc relative grid items-end px-5 pt-14 pb-5 md:px-8"
          style={{ gridTemplateColumns: `repeat(${halves.length}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`${data.metric}: ${steps
            .filter((s) => s.value !== null)
            .map((s) => `${s.date} ${num(s.value!)}`)
            .join(", ")}`}
        >
          {halves.map((b, k) => {
            const h = b.value !== null ? 18 + (b.value / max) * 82 : 0;
            return (
              <div key={`${b.y}-${b.h}`} className="flex flex-col items-center gap-2 px-0.5 sm:px-1.5 md:px-2.5" aria-hidden="true" style={{ "--i": k } as CSSProperties}>
                <div className="relative flex h-44 w-full items-end justify-center md:h-56">
                  {b.value !== null ? (
                    <div className={cn("jrc-col relative w-full max-w-[4.5rem] rounded-t-lg", k === now && "is-now")} style={{ height: `${h}%` }}>
                      <span className="jrc-num absolute inset-x-0 -top-8 text-center font-display text-lg leading-none font-semibold text-text-primary tabular-nums sm:text-2xl md:text-3xl">
                        {num(b.value)}
                      </span>
                    </div>
                  ) : b.marks.length ? (
                    <span className="jrc-mark mb-0 block size-3 rotate-45 rounded-[2px]" />
                  ) : null}
                </div>
                <span className="h-px w-full bg-fg/15" />
                <span className="text-center font-mono text-[10px] leading-tight text-text-secondary sm:text-[11px]">{half(b.h)}</span>
                <span className={cn("font-mono text-xs font-semibold text-text-secondary tabular-nums", b.h === 1 && "opacity-0")}>{digits(String(b.y), locale === "bn")}</span>
                <span className="min-h-4 font-mono text-[11px] text-gold tabular-nums">{[...yearOnly.filter((m) => b.h === 0 && dated[m.i]!.y === b.y).map((m) => m.i), ...b.marks].map(idx).join(" ")}</span>
              </div>
            );
          })}
          {/* Milestones dated by year only: a marker on the baseline between that year's two halves (its number is under the year). */}
          <div className="pointer-events-none absolute inset-x-5 top-0 bottom-0 md:inset-x-8" aria-hidden="true">
            {yearOnly.map((m) => (
              <span
                key={m.i}
                className="jrc-mark absolute top-[calc(3.5rem+11rem-0.75rem)] block size-3 -translate-x-1/2 rotate-45 rounded-[2px] md:top-[calc(3.5rem+14rem-0.75rem)]"
                style={{ left: `${m.x * 100}%` }}
              />
            ))}
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
