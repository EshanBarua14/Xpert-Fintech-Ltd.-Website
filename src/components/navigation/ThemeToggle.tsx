"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Theme = "dark" | "light";

/**
 * Light/dark switch. The first visit follows the device setting; a choice made
 * here is remembered on this device. The theme is applied before the page
 * paints by a small script in the layout, so there is no flash.
 */
export function ThemeToggle({ labels, className }: { labels: { toLight: string; toDark: string }; className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const follow = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("theme");
      } catch {}
      if (saved) return;
      apply(e.matches ? "light" : "dark", false);
    };
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  function apply(next: Theme, remember = true) {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    setTheme(next);
    if (remember) {
      try {
        localStorage.setItem("theme", next);
      } catch {}
    }
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  }

  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={() => apply(isLight ? "dark" : "light")}
      aria-label={isLight ? labels.toDark : labels.toLight}
      title={isLight ? labels.toDark : labels.toLight}
      className={cn(
        "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border border-fg/10 bg-fg/[0.04] text-text-secondary transition-colors hover:border-brand-sky/50 hover:text-fg",
        className,
      )}
    >
      {/* Sun */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cn("absolute size-[18px] transition-all duration-500", isLight ? "rotate-0 opacity-100" : "-rotate-90 opacity-0")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Moon */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cn("absolute size-[18px] transition-all duration-500", isLight ? "rotate-90 opacity-0" : "rotate-0 opacity-100")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
      </svg>
    </button>
  );
}
