"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ImageOption } from "@/lib/admin/media";

/**
 * An ordered list of photos from the media library. Submits one hidden input
 * per photo, named `name`, in display order. Photos can be added several at a
 * time, reordered with the arrow buttons, and removed.
 */
export function GalleryPicker({ name, options, defaultValue }: { name: string; options: ImageOption[]; defaultValue: string[] }) {
  const [ids, setIds] = useState<string[]>(defaultValue.filter((id) => options.some((o) => o.id === id)));
  const [picking, setPicking] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const byId = new Map(options.map((o) => [o.id, o]));
  const available = options.filter((o) => !ids.includes(o.id) && o.name.toLowerCase().includes(filter.toLowerCase()));

  const move = (i: number, d: -1 | 1) =>
    setIds((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      {ids.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {ids.length === 0 ? (
        <p className="text-sm text-text-secondary">No photos yet.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ids.map((id, i) => {
            const o = byId.get(id)!;
            return (
              <li key={id} className="flex flex-col overflow-hidden rounded-control border border-fg/10">
                <span className="relative flex aspect-[4/3] items-center justify-center bg-ink-950">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img src={o.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 rounded bg-ink-950/80 px-1.5 text-[11px]">{i + 1}</span>
                </span>
                <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs">
                  <span className="flex gap-1">
                    <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)} className="rounded px-1.5 hover:bg-fg/10 disabled:opacity-30">
                      ←
                    </button>
                    <button type="button" aria-label="Move later" disabled={i === ids.length - 1} onClick={() => move(i, 1)} className="rounded px-1.5 hover:bg-fg/10 disabled:opacity-30">
                      →
                    </button>
                  </span>
                  <button type="button" onClick={() => setIds((l) => l.filter((x) => x !== id))} className="text-text-secondary hover:text-market-down">
                    Remove
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setPicking(new Set());
            dialogRef.current?.showModal();
          }}
          className="rounded-control border border-fg/15 px-3 py-1.5 text-sm hover:border-brand-sky"
        >
          Add photos
        </button>
        <span className="text-xs text-text-secondary">{ids.length} photo(s). The first is the album cover.</span>
      </div>

      <dialog ref={dialogRef} aria-label="Add photos" className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-card border border-fg/10 bg-navy-900 p-0 text-text-primary backdrop:bg-black/60">
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-fg/10 p-4">
            <h2 className="font-semibold">Add photos</h2>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search"
              aria-label="Search images"
              className="ml-auto h-9 w-48 rounded-control border border-fg/15 bg-ink-950/60 px-3 text-sm focus:border-brand-sky focus:outline-none"
            />
            <button
              type="button"
              disabled={picking.size === 0}
              onClick={() => {
                setIds((l) => [...l, ...options.filter((o) => picking.has(o.id)).map((o) => o.id)]);
                dialogRef.current?.close();
              }}
              className="rounded-control bg-brand-royal px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add {picking.size || ""}
            </button>
            <button type="button" className="rounded-control px-2 py-1 text-sm hover:bg-fg/10" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            {options.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                No images yet.{" "}
                <Link href="/admin/media" className="text-brand-sky hover:underline">
                  Upload in Media
                </Link>
                , then come back.
              </p>
            ) : available.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">Every image is already in this gallery.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {available.map((o) => {
                  const on = picking.has(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setPicking((s) => {
                            const n = new Set(s);
                            if (n.has(o.id)) n.delete(o.id);
                            else n.add(o.id);
                            return n;
                          })
                        }
                        className={"flex w-full flex-col overflow-hidden rounded-control border text-left " + (on ? "border-brand-sky ring-2 ring-brand-sky/40" : "border-fg/10 hover:border-brand-sky/50")}
                      >
                        <span className="flex aspect-[4/3] items-center justify-center bg-ink-950">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                          <img src={o.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </span>
                        <span className="truncate px-2 py-1.5 text-xs">{on ? "✓ " : ""}{o.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
