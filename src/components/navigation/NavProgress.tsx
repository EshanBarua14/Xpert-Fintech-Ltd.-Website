"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A thin bar at the top of the window from the moment a link to another page
 * is clicked until that page is shown, so a click always gets an answer even
 * when the server is slow (or, while developing, still compiling the page).
 */
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("nav-busy");
    const giveUp = setTimeout(() => setActive(false), 20_000);
    return () => {
      clearTimeout(giveUp);
      document.documentElement.classList.remove("nav-busy");
    };
  }, [active]);

  useEffect(() => {
    // Capture phase: Next.js links cancel the browser's own navigation, so this
    // must see the click before they do.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page or #anchor
      if (/^\/(media|api)\//.test(url.pathname)) return; // files open in place
      setActive(true);
    };
    const onPop = () => setActive(true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return <div aria-hidden="true" className={cn("nav-progress", active && "is-active")} />;
}
