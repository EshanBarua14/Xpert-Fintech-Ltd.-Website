"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * Keeps the chosen light/dark theme across language switches. Moving between
 * /en and /bn re-renders the root layout, and React resets the <html>
 * element's attributes to the layout's own, dropping the theme the start-up
 * script had set (so the page fell back to dark). Before the browser paints,
 * this puts the saved theme (or the device's preference) back, along with the
 * "js" class the scroll reveals rely on.
 */
export function ThemeKeeper() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    let theme: string | null = null;
    try {
      theme = localStorage.getItem("theme");
    } catch {}
    if (theme !== "light" && theme !== "dark") theme = window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
  }, [pathname]);
  return null;
}
