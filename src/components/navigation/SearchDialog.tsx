"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Hit = { kind: string; title: string; subtitle: string | null; href: string };
export type SearchLabels = {
  search: string;
  placeholder: string;
  noResults: string;
  hint: string;
  seeAll: string;
  close: string;
  kinds: Record<string, string>;
};

/**
 * Site search: a button in the header, also opened with Ctrl/⌘ + K or "/".
 * Results come from /api/search as you type (debounced) and are grouped by
 * kind. ↑/↓ move, Enter opens, Esc closes; the input is an ARIA combobox.
 */
export function SearchDialog({ locale, labels }: { locale: "en" | "bn"; labels: SearchLabels }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState(false);
  const listId = useId();

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => inputRef.current?.select());
  }, []);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !typing && !dialogRef.current?.open) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?locale=${locale}&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as { results: Hit[] };
          setHits(data.results);
          setActive(0);
        }
      } catch {
        /* aborted or offline: keep the last results */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, locale]);

  const go = (href: string) => {
    dialogRef.current?.close();
    router.push(href);
  };
  const seeAll = `/${locale}/search?q=${encodeURIComponent(q.trim())}`;

  // Group by kind, keeping the server's order within each group.
  const groups: { kind: string; items: { hit: Hit; index: number }[] }[] = [];
  hits.forEach((hit, index) => {
    let g = groups.find((x) => x.kind === hit.kind);
    if (!g) groups.push((g = { kind: hit.kind, items: [] }));
    g.items.push({ hit, index });
  });
  const ordered = groups.flatMap((g) => g.items);
  const activeHit = ordered[active]?.hit;

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={labels.search}
        aria-keyshortcuts="Control+K Meta+K /"
        className="inline-flex size-10 items-center justify-center gap-2 rounded-full border border-fg/15 bg-fg/[0.04] text-text-secondary transition-colors hover:border-brand-sky/50 hover:text-fg xl:w-auto xl:px-3.5"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <kbd className="hidden rounded-md border border-fg/15 px-1.5 font-mono text-[11px] xl:inline">{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={labels.search}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="mx-auto mt-[10vh] mb-auto w-[min(42rem,calc(100vw-1.5rem))] max-w-none overflow-visible bg-transparent p-0 text-text-primary backdrop:bg-[#02040a]/80 backdrop:backdrop-blur-sm"
      >
        <div className="glass-strong menu-drawer flex max-h-[75dvh] flex-col overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-fg/10 px-5">
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-activedescendant={activeHit ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  // A search box would otherwise use the first Esc to clear itself.
                  e.preventDefault();
                  dialogRef.current?.close();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, ordered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (activeHit) go(activeHit.href);
                  else if (q.trim().length >= 2) go(seeAll);
                }
              }}
              placeholder={labels.placeholder}
              className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-text-secondary/70 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {loading && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-brand-sky/30 border-t-brand-sky" />}
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-md border border-fg/15 px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-fg" aria-label={labels.close}>
              Esc
            </button>
          </div>
          <div className="overflow-y-auto p-2">
            {q.trim().length < 2 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">{labels.hint}</p>
            ) : !loading && hits.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary" role="status">
                {labels.noResults.replace("{q}", q.trim())}
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label={labels.search} className="flex flex-col gap-3">
                {groups.map((g) => (
                  <li key={g.kind} role="presentation">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.16em] text-text-secondary uppercase">{labels.kinds[g.kind] ?? g.kind}</p>
                    <ul role="presentation">
                      {g.items.map(({ hit }) => {
                        const i = ordered.findIndex((o) => o.hit === hit);
                        return (
                          <li
                            key={hit.href + hit.title}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            onMouseMove={() => setActive(i)}
                            onClick={() => go(hit.href)}
                            className={cn("flex cursor-pointer flex-col gap-0.5 rounded-2xl px-3 py-2.5", i === active ? "bg-brand-sky/10 ring-1 ring-brand-sky/30" : "hover:bg-fg/[0.04]")}
                          >
                            <span className={cn("font-semibold", hit.kind === "symbol" && "font-mono")}>{hit.title}</span>
                            {hit.subtitle && <span className="line-clamp-1 text-sm text-text-secondary">{hit.subtitle}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {q.trim().length >= 2 && (
            <a href={seeAll} onClick={(e) => (e.preventDefault(), go(seeAll))} className="border-t border-fg/10 px-5 py-3 text-sm font-semibold text-brand-sky hover:text-fg">
              {labels.seeAll.replace("{q}", q.trim())} →
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}
