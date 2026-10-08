"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { TestimonialCard } from "@/lib/public/content";
import { cn } from "@/lib/utils/cn";

type Labels = { region: string; prev: string; next: string; pause: string; play: string; slide: string; /** "Rated {n} out of 5" */ rating: string; /** "{n}/5" */ ratingShort?: string; /** Digits 0–9 (Bangla numerals on the Bangla site). */ digits?: string };

const AUTO_MS = 7000;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Client reviews as cards: the client's photo, name and title, their
 * company (logo when permitted) and the quote. One card on phones, two on
 * tablets, three on desktop. Swipe, use the arrows or the progress bars; it
 * moves on by itself, pausing on hover, keyboard focus, a hidden tab, the
 * pause button and reduced motion.
 */
export function TestimonialSlider({ items, labels }: { items: TestimonialCard[]; labels: Labels }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [stops, setStops] = useState(items.length);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /** Distance between two cards, and how many positions the track can stop at. */
  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const second = el?.children[1] as HTMLElement | undefined;
    if (!el || !first) return { step: 1, count: 1 };
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    const perView = Math.max(1, Math.round(el.clientWidth / step));
    return { step, count: Math.max(1, items.length - perView + 1) };
  }, [items.length]);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const { step, count } = measure();
      const n = ((i % count) + count) % count;
      el.scrollTo({ left: n * step, behavior: reduce ? "auto" : "smooth" });
    },
    [measure, reduce],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const { step, count } = measure();
      setStops(count);
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setActive(atEnd ? count - 1 : Math.min(count - 1, Math.round(el.scrollLeft / Math.max(1, step))));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [measure]);

  const moving = stops > 1 && !paused && !hover && !reduce;
  useEffect(() => {
    if (!moving) return;
    const id = setTimeout(() => {
      if (!document.hidden) go(active + 1);
    }, AUTO_MS);
    return () => clearTimeout(id);
  }, [active, moving, go]);

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
      <ul ref={track} className="testimonial-track -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
        {items.map((t, i) => (
          <li
            key={t.id}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide.replace("{i}", String(i + 1)).replace("{n}", String(items.length))}
            data-reveal
            style={{ "--d": i % 3 } as CSSProperties}
            className="w-[86%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <figure className="testimonial-card relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-fg/10 bg-navy-900 p-6 md:p-7">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-royal via-brand-sky to-gold/80" />
              {t.draft && (
                <span className="absolute top-3 right-3 rounded-md border border-gold/50 bg-gold/10 px-2 py-0.5 text-[max(11px,0.6875rem)] font-semibold text-gold">Draft</span>
              )}
              <figcaption className="flex items-center gap-4">
                {t.photo ? (
                  <Image
                    src={t.photo.url}
                    alt={t.name}
                    width={160}
                    height={160}
                    className="size-20 shrink-0 rounded-2xl object-cover object-top ring-1 ring-fg/10"
                  />
                ) : (
                  <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-brand-royal font-display text-2xl text-white">
                    {initials(t.name)}
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-display text-lg leading-tight text-text-primary">{t.name}</span>
                  {t.role && <span className="text-sm leading-snug text-text-secondary">{t.role}</span>}
                  {t.organization && <span className="text-sm font-medium leading-snug text-brand-sky">{t.organization}</span>}
                </span>
              </figcaption>
              {t.rating ? (
                <p className="flex items-center gap-0.5" role="img" aria-label={labels.rating.replace("{n}", String(t.rating))}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg key={n} aria-hidden="true" viewBox="0 0 20 20" className={cn("size-[1.15rem]", n <= t.rating! ? "fill-gold" : "fill-fg/15")}>
                      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8 4.8 17.6l1-5.8L1.5 7.7l5.9-.8z" />
                    </svg>
                  ))}
                  <span aria-hidden="true" className="ml-2 font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {(labels.ratingShort ?? "{n}/5").replace("{n}", String(t.rating)).replace(/\d/g, (d) => labels.digits?.[Number(d)] ?? d)}
                  </span>
                </p>
              ) : (
                t.draft && (
                  // Outside production: a review without a rating says so, so it is added before publishing.
                  <p className="flex items-center gap-2 text-xs font-semibold text-gold">
                    <span aria-hidden="true" className="tracking-[0.2em] text-fg/25">★★★★★</span>
                    No rating yet (out of 5)
                  </p>
                )
              )}
              <blockquote className="flex-1">
                <p className="testimonial-quote text-[1.0625rem] leading-relaxed text-text-primary">{t.quote}</p>
              </blockquote>
              {t.logo && (
                <div className="flex items-center border-t border-fg/[0.08] pt-5">
                  <Image
                    src={t.logo.url}
                    alt={t.logoAlt ?? t.organization ?? ""}
                    width={t.logo.width ?? 160}
                    height={t.logo.height ?? 48}
                    className="member-logo h-8 w-auto max-w-[10rem] object-contain object-left"
                  />
                </div>
              )}
            </figure>
          </li>
        ))}
      </ul>

      {stops > 1 && (
        <div className="mt-8 flex items-center gap-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(active - 1)} aria-label={labels.prev} className="flex size-11 items-center justify-center rounded-full border border-fg/15 text-text-primary transition-colors hover:border-brand-sky hover:text-brand-sky">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" onClick={() => go(active + 1)} aria-label={labels.next} className="flex size-11 items-center justify-center rounded-full border border-fg/15 text-text-primary transition-colors hover:border-brand-sky hover:text-brand-sky">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]"><path d="m6 3 5 5-5 5" /></svg>
            </button>
          </div>
          <ol className="flex flex-1 gap-1.5" aria-hidden="true">
            {Array.from({ length: stops }, (_, i) => (
              <li key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-fg/10">
                <span
                  key={`${i}-${active}-${moving}`}
                  className={cn("block h-full bg-brand-sky", i < active ? "w-full" : i > active ? "w-0" : moving ? "testimonial-progress" : "w-full")}
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
            {active + 1} / {stops}
          </span>
        </div>
      )}
    </div>
  );
}
