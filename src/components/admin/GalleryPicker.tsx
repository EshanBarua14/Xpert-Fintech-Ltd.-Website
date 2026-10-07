"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { uploadPhotos } from "@/app/admin/(protected)/media/actions";
import type { ImageOption } from "@/lib/admin/media";

// Each request must stay within serverActions.bodySizeLimit (50 MB) and 10 files.
const MAX_GROUP_BYTES = 45 * 1024 * 1024;
const MAX_GROUP_FILES = 10;

/**
 * An ordered list of photos from the media library. Submits one hidden input
 * per photo, named `name`, in display order. Photos can be uploaded right
 * here or picked from the library, reordered by dragging or with the arrow
 * buttons, and removed.
 */
export function GalleryPicker({ name, options: initialOptions, defaultValue }: { name: string; options: ImageOption[]; defaultValue: string[] }) {
  const [options, setOptions] = useState<ImageOption[]>(initialOptions);
  const [ids, setIds] = useState<string[]>(defaultValue.filter((id) => initialOptions.some((o) => o.id === id)));
  const [picking, setPicking] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProblems, setUploadProblems] = useState<string[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Uploads in small groups so large selections never exceed the request limit. */
  async function upload(files: File[]) {
    const groups: File[][] = [];
    let group: File[] = [];
    let size = 0;
    for (const f of files) {
      if (group.length && (group.length >= MAX_GROUP_FILES || size + f.size > MAX_GROUP_BYTES)) {
        groups.push(group);
        group = [];
        size = 0;
      }
      group.push(f);
      size += f.size;
    }
    if (group.length) groups.push(group);
    const problems: string[] = [];
    let done = 0;
    for (const g of groups) {
      setUploading(`Uploading ${done + 1}–${done + g.length} of ${files.length}…`);
      const fd = new FormData();
      for (const f of g) fd.append("files", f);
      try {
        const res = await uploadPhotos(fd);
        problems.push(...res.problems);
        if (res.added.length) {
          setOptions((o) => [...res.added, ...o]);
          setIds((l) => [...l, ...res.added.map((a) => a.id)]);
        }
      } catch {
        problems.push(`Could not upload ${g.length} photo(s). Check your connection and try again.`);
      }
      done += g.length;
    }
    setUploading(null);
    setUploadProblems(problems);
    if (fileRef.current) fileRef.current.value = "";
  }

  const reorder = (from: number, to: number) =>
    setIds((list) => {
      if (from === to) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
  const byId = new Map(options.map((o) => [o.id, o]));
  const available = options.filter((o) => !ids.includes(o.id) && o.name.toLowerCase().includes(filter.toLowerCase()));

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j >= 0 && j < ids.length) reorder(i, j);
  };

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
              <li
                key={id}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault();
                  if (dragFrom !== null) reorder(dragFrom, i);
                  setDragFrom(null);
                }}
                onDragEnd={() => setDragFrom(null)}
                className={"flex cursor-grab flex-col overflow-hidden rounded-control border active:cursor-grabbing " + (dragFrom === i ? "border-brand-sky opacity-50" : "border-fg/10")}
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-ink-950">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img src={o.url} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
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
          Add from library
        </button>
        <label className={"cursor-pointer rounded-control bg-brand-royal px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-royal/90 " + (uploading ? "pointer-events-none opacity-60" : "")}>
          Upload new photos
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            disabled={Boolean(uploading)}
            onChange={(ev) => {
              const files = Array.from(ev.target.files ?? []);
              if (files.length) void upload(files);
            }}
          />
        </label>
        <span className="text-xs text-text-secondary" role="status">
          {uploading ?? `${ids.length} photo(s). Drag to reorder; the first is the cover unless you choose one.`}
        </span>
      </div>
      {uploadProblems.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-market-down">
          {uploadProblems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <dialog ref={dialogRef} aria-label="Add from library" className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-card border border-fg/10 bg-navy-900 p-0 text-text-primary backdrop:bg-black/60">
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-fg/10 p-4">
            <h2 className="font-semibold">Add from library</h2>
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
                        <span className="relative block aspect-[4/3] overflow-hidden bg-ink-950">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                          <img src={o.url} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
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
