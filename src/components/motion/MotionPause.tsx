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
    const apply = () => el.classList.toggle("motion-paused", !visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      apply();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
