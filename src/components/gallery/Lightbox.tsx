"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { GalleryPhoto } from "@/lib/public/insights";
import { fill } from "@/lib/i18n/digits";

/**
 * Photo grid that opens a full-screen viewer. Keyboard: ←/→ to move, Esc to
 * close. Touch: swipe left or right. Focus returns to the photo that opened it.
 */
export function Lightbox({
  photos,
  labels,
  layout = "masonry",
  extra = [],
}: {
  photos: GalleryPhoto[];
  labels: { open: string; close: string; prev: string; next: string; counter: string };
  /** "feature": the first photo full width, the rest in a row of thumbnails (product screens). */
  layout?: "masonry" | "feature" | "grid";
  /** More tiles after the photos in the same grid (e.g. empty slots for screens still to come). */
  extra?: ReactNode[];
}) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);

  const go = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);
  const open = (i: number) => {
    setIndex(i);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!photos.length && !extra.length) return null;
  const current = index === null ? null : photos[index];

  return (
    <>
      <ul
        className={
          layout === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : layout === "feature"
              ? "grid grid-cols-2 gap-3 md:grid-cols-4"
              : "columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3"
        }
      >
        {photos.map((p, i) => (
          <li key={p.id} data-reveal style={{ "--d": i % 4 } as CSSProperties} className={layout === "grid" ? "flex flex-col gap-2" : layout === "feature" ? (i === 0 ? "col-span-full" : "") : "break-inside-avoid"}>
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              onClick={() => open(i)}
              aria-label={`${labels.open}: ${p.alt}`}
              className="group relative block w-full overflow-hidden rounded-2xl bg-navy-800 ring-1 ring-fg/10"
            >
              <Image
                src={p.url}
                alt=""
                width={p.width ?? 800}
                height={p.height ?? 600}
                sizes={layout === "feature" && i === 0 ? "(min-width: 1280px) 1200px, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
                className={(layout === "feature" && i > 0) || layout === "grid" ? "aspect-[16/10] h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" : "h-auto w-full transition-transform duration-700 group-hover:scale-[1.04]"}
              />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#05080f]/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
            {layout === "grid" && p.alt && <span className="line-clamp-2 text-sm leading-snug text-text-secondary">{p.alt}</span>}
          </li>
        ))}
        {extra.map((node, i) => (
          <li key={`extra-${i}`} className="flex flex-col">
            {node}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={current?.alt}
        onClose={() => {
          const i = index;
          setIndex(null);
          if (i !== null) triggers.current[i]?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          if (start !== null && end !== undefined && Math.abs(end - start) > 40) go(end < start ? 1 : -1);
          touchX.current = null;
        }}
        className="lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[#03060c]/92 backdrop:backdrop-blur-sm"
      >
        {current && (
          <div className="relative flex h-full w-full items-center justify-center p-4 md:p-14">
            <figure key={current.id} className="lightbox-photo relative flex max-h-full max-w-full flex-col items-center gap-3">
              <Image
                src={current.url}
                alt={current.alt}
                width={current.width ?? 1600}
                height={current.height ?? 1000}
                sizes="100vw"
                className="h-auto max-h-[80dvh] w-auto max-w-full rounded-xl object-contain shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
                priority
              />
              <figcaption className="text-center text-sm text-white/80">
                {current.alt} <span className="ml-2 font-mono text-xs text-white/50">{fill(labels.counter, { i: (index ?? 0) + 1, n: photos.length })}</span>
              </figcaption>
            </figure>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="absolute top-1/2 left-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xl text-white backdrop-blur hover:border-white/60 md:left-6">
                  <span aria-hidden="true">‹</span>
                </button>
                <button type="button" onClick={() => go(1)} aria-label={labels.next} className="absolute top-1/2 right-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xl text-white backdrop-blur hover:border-white/60 md:right-6">
                  <span aria-hidden="true">›</span>
                </button>
              </>
            )}
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={labels.close} className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-lg text-white backdrop-blur hover:border-white/60">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
