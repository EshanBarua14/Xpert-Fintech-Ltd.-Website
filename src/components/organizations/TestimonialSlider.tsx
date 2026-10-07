"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TestimonialCard } from "@/lib/public/content";
import { cn } from "@/lib/utils/cn";

type Labels = { region: string; prev: string; next: string; pause: string; play: string; slide: string };

const AUTO_MS = 9000;

/**
 * Client quotes, one at a time. Swipe, drag the scrollbar-free track, use the
 * arrows or the dots; it moves on by itself every few seconds, pausing on
 * hover, keyboard focus, a hidden tab, the pause button and reduced motion.
 */
export function TestimonialSlider({ items, labels }: { items: TestimonialCard[]; labels: Labels }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduce, setReduce] = useState(false);
  const many = items.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
  }, []);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const n = (i + items.length) % items.length;
      el.scrollTo({ left: n * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    },
    [items.length, reduce],
  );

  // Which slide is showing (also after a swipe).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!many || paused || hover || reduce) return;
    const id = setTimeout(() => {
      if (!document.hidden) go(active + 1);
    }, AUTO_MS);
    return () => clearTimeout(id);
  }, [active, paused, hover, reduce, many, go]);

  if (!items.length) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="testimonials relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <ul ref={track} className="testimonial-track flex snap-x snap-mandatory overflow-x-auto">
        {items.map((t, i) => (
          <li
            key={t.id}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide.replace("{i}", String(i + 1)).replace("{n}", String(items.length))}
            aria-hidden={i !== active ? true : undefined}
            className="w-full shrink-0 snap-start"
          >
            <figure className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <blockquote className="lg:col-span-9">
                <p className="testimonial-quote font-display text-[1.6rem] leading-[1.3] text-balance text-text-primary md:text-[2.25rem] md:leading-[1.25]">{t.quote}</p>
              </blockquote>
              <figcaption className="flex items-center gap-4 lg:col-span-3 lg:flex-col lg:items-start">
                {t.photo ? (
                  <Image src={t.photo.url} alt="" width={64} height={64} className="size-14 rounded-full object-cover ring-1 ring-fg/10 lg:size-16" />
                ) : (
                  <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-brand-royal/15 font-display text-xl text-brand-sky lg:size-16">
                    {t.name.charAt(0)}
                  </span>
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-text-primary">{t.name}</span>
                  {t.role && <span className="text-sm text-text-secondary">{t.role}</span>}
                  {t.logo ? (
                    <Image src={t.logo.url} alt={t.organization ?? ""} width={t.logo.width ?? 160} height={t.logo.height ?? 48} className="member-logo mt-2 h-8 w-auto max-w-[10rem] object-contain object-left" />
                  ) : (
                    t.organization && <span className="text-sm font-medium text-brand-sky">{t.organization}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {many && (
        <div className="mt-10 flex items-center gap-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(active - 1)} aria-label={labels.prev} className="flex size-11 items-center justify-center rounded-full border border-fg/15 text-text-primary transition-colors hover:border-brand-sky hover:text-brand-sky">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" onClick={() => go(active + 1)} aria-label={labels.next} className="flex size-11 items-center justify-center rounded-full border border-fg/15 text-text-primary transition-colors hover:border-brand-sky hover:text-brand-sky">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
          <ol className="flex flex-1 gap-1.5" aria-hidden="true">
            {items.map((t, i) => (
              <li key={t.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-fg/10">
                <span
                  key={`${i}-${active}-${paused || hover || reduce}`}
                  className={cn("block h-full bg-brand-sky", i < active ? "w-full" : i > active ? "w-0" : !paused && !hover && !reduce ? "testimonial-progress" : "w-full")}
                  style={i === active ? { animationDuration: `${AUTO_MS}ms` } : undefined}
                />
              </li>
            ))}
          </ol>
          {!reduce && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              aria-label={paused ? labels.play : labels.pause}
              className="flex size-9 items-center justify-center rounded-full text-text-secondary hover:text-fg"
            >
              {paused ? (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current"><path d="M3 1.5v9l7.5-4.5z" /></svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current"><path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" /></svg>
              )}
            </button>
          )}
          <span className="font-mono text-sm text-text-secondary tabular-nums" aria-live="polite">
            {active + 1} / {items.length}
          </span>
        </div>
      )}
    </div>
  );
}
