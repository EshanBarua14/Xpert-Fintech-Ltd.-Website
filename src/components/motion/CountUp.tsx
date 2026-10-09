"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up when it first scrolls into view. The final value is
 * in the server HTML, so search engines and no-JS visitors see the real
 * figure. It never stays at 0: a number already on screen when the page
 * loads is shown as it is, and the count always ends on the real value (also
 * if the browser never reports the number coming into view).
 */
export function CountUp({ value, suffix = "", locale = "en" }: { value: number; suffix?: string; locale?: "en" | "bn" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    setShown(value);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || value <= 0) return;
    const r = el.getBoundingClientRect();
    // Already visible on load: no count, just the number.
    if (r.top < window.innerHeight && r.bottom > 0) return;
    let frame = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 4))));
        if (p < 1) frame = requestAnimationFrame(tick);
        else setShown(value);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      setShown(value);
    };
  }, [value]);

  const text = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(shown);
  return (
    <span ref={ref} aria-label={`${new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(value)}${suffix}`}>
      <span aria-hidden="true">
        {text}
        {suffix}
      </span>
    </span>
  );
}
