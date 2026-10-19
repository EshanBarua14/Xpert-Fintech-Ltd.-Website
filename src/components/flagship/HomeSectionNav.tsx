"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Item = { id: string; label: string };

/**
 * "On this page": a slim rail of dots at the right edge on wide screens, one per
 * home section that is shown (sections carry their short name in data-nav, in the
 * order set in Admin → Design). The section in view is lit; a dot's name shows on
 * hover or focus; clicking scrolls there. Appears after the hero, hides near the end.
 */
export function HomeSectionNav({ label }: { label: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("section[data-nav][id]")];
    setItems(els.map((el) => ({ id: el.id, label: el.dataset.nav ?? el.id })));
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    const first = els[0]!;
    const last = els[els.length - 1]!;
    const onScroll = () => {
      const top = first.getBoundingClientRect().top;
      const end = last.getBoundingClientRect().bottom;
      setShown(top < window.innerHeight * 0.6 && end > window.innerHeight * 0.4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (items.length < 3) return null;
  return (
    <nav
      aria-label={label}
      className={cn(
        "section-rail fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 transition-opacity duration-500 xl:block",
        shown ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ol className="flex flex-col items-end gap-2.5">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-3 py-0.5 focus-visible:outline-none"
                onClick={(e) => {
                  const el = document.getElementById(it.id);
                  if (!el) return;
                  e.preventDefault();
                  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                  history.replaceState(null, "", `#${it.id}`);
                }}
              >
                <span
                  className={cn(
                    "rounded-full border border-fg/10 bg-navy-900/90 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-text-primary opacity-0 shadow-lg backdrop-blur transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                    on ? "translate-x-0" : "translate-x-1",
                  )}
                >
                  {it.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    on ? "h-6 w-1.5 bg-gradient-to-b from-brand-sky to-gold" : "size-1.5 bg-fg/30 group-hover:bg-fg/60",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
