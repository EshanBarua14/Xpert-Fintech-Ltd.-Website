"use client";

import { useEffect, useRef, useState } from "react";

type Labels = { open: string; close: string; title: string; status: string; chat: string; call: string };

const Bubble = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="8.5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

/** The floating button and its panel: welcome line, "Chat on WhatsApp" and "Call us". */
export function WhatsAppFab({ chat, tel, number, greeting, labels }: { chat: string; tel: string; number: string; greeting: string; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="whatsapp-fab fixed right-4 bottom-4 z-(--z-sticky) flex flex-col items-end gap-3 md:right-6 md:bottom-6 print:hidden">
      {open && (
        <div
          ref={panel}
          id="wa-panel"
          role="dialog"
          aria-label={labels.title}
          className="wa-panel w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-fg/10 bg-navy-900 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)]"
        >
          <div className="flex items-center gap-3 bg-[#128c4a] px-4 py-3 text-white">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
              <Bubble className="size-6" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{labels.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="size-1.5 rounded-full bg-[#7dffb0]" />
                {labels.status}
              </span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="ml-auto flex size-8 items-center justify-center rounded-full text-lg hover:bg-white/15">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <p className="wa-greeting relative rounded-2xl rounded-tl-sm bg-fg/[0.06] px-4 py-3 text-sm leading-relaxed text-text-primary">{greeting}</p>
            <div className="flex flex-col gap-2">
              <a
                href={chat}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-semibold text-[#06281a] transition-colors hover:bg-[#1fbe5b]"
              >
                <Bubble className="size-5" />
                {labels.chat}
              </a>
              <a
                href={tel}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-fg/15 px-4 text-sm font-semibold text-text-primary transition-colors hover:border-[#25d366] hover:text-[#25d366]"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                {labels.call} <span className="font-mono text-xs opacity-75">{number}</span>
              </a>
            </div>
          </div>
        </div>
      )}
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="wa-panel"
        aria-label={open ? labels.close : labels.open}
        className="group relative inline-flex h-14 items-center gap-0 rounded-full bg-[#25d366] pr-4 pl-4 text-white shadow-lg shadow-black/25 ring-1 ring-black/10 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366] sm:gap-2"
      >
        {!open && <span aria-hidden="true" className="wa-ping absolute inset-0 rounded-full" />}
        {open ? <span aria-hidden="true" className="flex size-7 items-center justify-center text-2xl leading-none">×</span> : <Bubble className="size-7 shrink-0" />}
        <span className="max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-56 group-focus-visible:max-w-56 sm:max-w-56">{open ? labels.close : labels.open}</span>
      </button>
    </div>
  );
}
