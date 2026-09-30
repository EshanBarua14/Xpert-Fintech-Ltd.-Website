"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Pauses the CSS animations inside it while it is off-screen or the tab is
 * hidden, so decorative motion never costs battery or frame rate unseen.
 */
export function MotionPause({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const paused = !visible || document.hidden || reduced.matches;
      el.classList.toggle("motion-paused", paused);
      // SMIL animations (<animateMotion>) ignore CSS, so pause them directly.
      el.querySelectorAll("svg").forEach((svg) => (paused ? svg.pauseAnimations() : svg.unpauseAnimations()));
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      apply();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", apply);
    reduced.addEventListener("change", apply);
    apply();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
      reduced.removeEventListener("change", apply);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
