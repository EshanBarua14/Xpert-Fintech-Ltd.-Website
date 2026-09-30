"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up once it scrolls into view. The final value is in
 * the server HTML, so search engines and no-JS visitors see the real figure.
 */
export function CountUp({ value, suffix = "", locale = "en" }: { value: number; suffix?: string; locale?: "en" | "bn" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          setShown(Math.round(value * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
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
