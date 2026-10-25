"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Item = { id: string; label: string };

/**
 * "On this page": the page's scroll bar on wide screens — a slim rail at the right
 * edge with one dot per home section that is shown (sections carry their short name
 * in data-nav, in the order set in Admin → Design) on a track that fills as you
 * read. The section in view is lit and its name shows while scrolling; any dot's
 * name shows on hover or focus; clicking scrolls there; ↑/↓ move between sections.
 * While the rail is shown the browser's own scroll bar is hidden (it would repeat it).
 */
export function HomeSectionNav({ label }: { label: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("section[data-nav][id]")];
    setItems(els.map((el) => ({ id: el.id, label: el.dataset.nav ?? el.id })));
    if (!els.length || !("IntersectionObserver" in window)) return;
    const html = document.documentElement;
    if (els.length >= 3) html.classList.add("has-section-rail");
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
    let idle: ReturnType<typeof setTimeout> | undefined;
    let ticking = false;
    const measure = () => {
      ticking = false;
      const top = first.getBoundingClientRect().top;
      const end = last.getBoundingClientRect().bottom;
      setShown(top < window.innerHeight * 0.6 && end > window.innerHeight * 0.2);
      const max = html.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
      setMoving(true);
      clearTimeout(idle);
      idle = setTimeout(() => setMoving(false), 1100);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      io.disconnect();
      clearTimeout(idle);
      html.classList.remove("has-section-rail");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (items.length < 3) return null;
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    return true;
  };
  const at = Math.max(0, items.findIndex((it) => it.id === active));
  return (
    <nav
      aria-label={label}
      className={cn(
        "section-rail fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 transition-opacity duration-500 xl:block",
        shown ? "opacity-100" : "opacity-40 hover:opacity-100 focus-within:opacity-100",
      )}
      onKeyDown={(e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        const next = items[Math.min(items.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)))];
        if (!next) return;
        e.preventDefault();
        go(next.id);
        document.querySelector<HTMLAnchorElement>(`.section-rail a[href="#${next.id}"]`)?.focus();
      }}
    >
      {/* The track (whole page) and how far you have read. */}
      <span aria-hidden="true" className="absolute top-1 right-[2.5px] bottom-1 w-px rounded-full bg-fg/10" />
      <span
        aria-hidden="true"
        className="absolute top-1 right-[2.5px] w-px origin-top rounded-full bg-gradient-to-b from-brand-sky to-gold"
        style={{ height: "calc(100% - 0.5rem)", transform: `scaleY(${progress})` }}
      />
      <ol className="relative flex flex-col items-end gap-2.5">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-3 py-0.5 focus-visible:outline-none"
                onClick={(e) => {
                  if (go(it.id)) e.preventDefault();
                }}
              >
                <span
                  className={cn(
                    "rounded-full border border-fg/10 bg-navy-900/90 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-text-primary opacity-0 shadow-lg backdrop-blur transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                    on ? "translate-x-0" : "translate-x-1",
                    on && moving && "opacity-100",
                  )}
                >
                  {it.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    on
                      ? "h-6 w-1.5 bg-gradient-to-b from-brand-sky to-gold shadow-[0_0_10px_rgb(34_188_235/0.55)]"
                      : "size-1.5 bg-fg/30 group-hover:scale-150 group-hover:bg-fg/70",
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
