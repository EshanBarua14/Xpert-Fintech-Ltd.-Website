"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page-wide motion, set up once:
 *  - [data-reveal] elements come into view as they are scrolled to: headlines
 *    rise out of a mask line by line, everything else settles in with a short
 *    stagger (see globals.css)
 *  - .spotlight cards follow the pointer with a soft light
 * Both are skipped when the visitor prefers reduced motion.
 */
export function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (reduce || !("IntersectionObserver" in window)) {
      pending().forEach((el) => el.classList.add("is-in"));
      // Content that arrives later (prices, dialogs) is shown straight away too.
      const mo = new MutationObserver(() => pending().forEach((el) => el.classList.add("is-in")));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );
    const watched = new WeakSet<Element>();
    const watch = () => {
      for (const el of pending()) {
        if (watched.has(el)) continue;
        watched.add(el);
        io.observe(el);
      }
    };
    watch();
    // Sections rendered after load (live market data, lists filled in by the browser) reveal too.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    // Safety net: nothing stays hidden if the observer is ever starved (background tab, printing).
    const safety = setTimeout(() => {
      for (const el of pending()) if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
    }, 2500);
    const onPrint = () => pending().forEach((el) => el.classList.add("is-in"));
    window.addEventListener("beforeprint", onPrint);
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(safety);
      window.removeEventListener("beforeprint", onPrint);
    };
  }, [pathname]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".spotlight");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
