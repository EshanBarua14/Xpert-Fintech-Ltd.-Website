"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const firstPage = useRef(true);

  // Primary buttons lean toward the pointer (mouse and trackpad only, never with reduced motion).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let active: HTMLElement | null = null;
    const reset = () => {
      if (!active) return;
      active.style.setProperty("--mx", "0px");
      active.style.setProperty("--my", "0px");
      active = null;
    };
    const onMove = (e: PointerEvent) => {
      const btn = (e.target as Element | null)?.closest<HTMLElement>(".btn-glow") ?? null;
      if (btn !== active) reset();
      if (!btn) return;
      active = btn;
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      btn.style.setProperty("--mx", (dx * 5).toFixed(1) + "px");
      btn.style.setProperty("--my", (dy * 4).toFixed(1) + "px");
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", reset);
    return () => {
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, []);

  // Cards catch a soft light where the pointer is (people, team, reviews and other .glow-track cards).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>(".person-card, .team-card, .testimonial-card, .glow-track");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty("--gy", `${(e.clientY - r.top).toFixed(0)}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  // Back-to-top button, shown after a long scroll.
  useEffect(() => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    const bn = document.documentElement.lang.startsWith("bn");
    btn.setAttribute("aria-label", bn ? "\u0989\u09AA\u09B0\u09C7 \u09AF\u09BE\u09A8" : "Back to top");
    btn.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
    btn.addEventListener("click", () => {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    });
    document.body.appendChild(btn);
    const onScroll = () => btn.toggleAttribute("data-show", window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      btn.remove();
    };
  }, []);

  // Section personality: sections below the hero enter in turn from below, left, scaled and right (see [data-anim] in globals.css).
  useEffect(() => {
    const kinds = ["rise", "left", "scale", "right"];
    let n = 0;
    for (const sec of Array.from(document.querySelectorAll<HTMLElement>("main section"))) {
      if (sec.classList.contains("hero-seq") || sec.dataset.anim) continue;
      sec.dataset.anim = kinds[n++ % kinds.length]!;
    }
  }, [pathname]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    // Moving between pages: the new page's first screen shows at once with a short fade
    // (the slower entrance plays only on the first page of a visit).
    if (firstPage.current) firstPage.current = false;
    else {
      document.documentElement.dataset.nav = "soft";
      for (const el of pending()) if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
    }
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
