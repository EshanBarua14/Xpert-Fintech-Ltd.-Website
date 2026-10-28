"use client";

import { useId, useRef, useState } from "react";
import { uploadPhotos } from "@/app/admin/(protected)/media/actions";
import { DEFAULT_REQUEST_BYTES, fitForUpload, mbText } from "@/lib/media/client-upload";
import type { ImageOption } from "@/lib/admin/media";

/**
 * Picks an image from the media library, or uploads a new one right here
 * (it joins the library and is chosen at once). Submits the chosen media id
 * in a hidden input named `name`.
 */
export function ImagePicker({
  name,
  label,
  hint,
  options: initialOptions,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  options: ImageOption[];
  defaultValue?: string | null;
  error?: string;
}) {
  const [options, setOptions] = useState<ImageOption[]>(initialOptions);
  const [selected, setSelected] = useState<string>(defaultValue ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function upload(original: File) {
    setProblem(null);
    const file = await fitForUpload(original, DEFAULT_REQUEST_BYTES);
    if (!file) {
      setProblem(`${original.name}: ${mbText(original.size)} is too large to upload and could not be made smaller.`);
      return;
    }
    setBusy(`Uploading ${original.name}…`);
    const fd = new FormData();
    fd.append("files", file);
    try {
      const res = await uploadPhotos(fd);
      const added = res.added[0];
      if (added) {
        setOptions((o) => [added, ...o]);
        setSelected(added.id);
        dialogRef.current?.close();
      }
      if (res.problems.length) setProblem(res.problems.join(" "));
    } catch {
      setProblem("Could not upload the image. Check your connection and try again.");
    }
    setBusy(null);
  }
  const uploadButton = (
    <label className="cursor-pointer rounded-control border border-fg/15 px-3 py-1.5 hover:border-brand-sky">
      Upload new
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={!!busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
    </label>
  );
  const [filter, setFilter] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const labelId = useId();
  const current = options.find((o) => o.id === selected);
  const visible = options.filter((o) => o.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <input type="hidden" name={name} value={selected} />
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-control border border-fg/15 bg-ink-950">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={current.url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-text-secondary">No image</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5 text-sm">
          <button
            type="button"
            aria-describedby={labelId}
            className="rounded-control border border-fg/15 px-3 py-1.5 hover:border-brand-sky"
            onClick={() => dialogRef.current?.showModal()}
          >
            {current ? "Change image" : "Choose image"}
          </button>
          {uploadButton}
          {current && (
            <button type="button" className="text-xs text-text-secondary hover:text-market-down" onClick={() => setSelected("")}>
              Remove
            </button>
          )}
        </div>
      </div>
      {busy && (
        <p role="status" className="text-xs text-text-secondary">
          {busy}
        </p>
      )}
      {problem && (
        <p role="alert" className="text-xs text-market-down">
          {problem}
        </p>
      )}
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
      {error && (
        <p className="text-xs text-market-down" role="alert">
          {error}
        </p>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${labelId}-dialog`}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-card border border-fg/10 bg-navy-900 p-0 text-text-primary backdrop:bg-black/60"
      >
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-center gap-3 border-b border-fg/10 p-4">
            <h2 id={`${labelId}-dialog`} className="font-semibold">
              {label}
            </h2>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search"
              aria-label="Search images"
              className="ml-auto h-9 w-48 rounded-control border border-fg/15 bg-ink-950/60 px-3 text-sm focus:border-brand-sky focus:outline-none"
            />
            <span className="text-sm">{uploadButton}</span>
            <button type="button" className="rounded-control px-2 py-1 text-sm hover:bg-fg/10" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            {options.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">No images yet: use &quot;Upload new&quot;.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {visible.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      aria-pressed={o.id === selected}
                      onClick={() => {
                        setSelected(o.id);
                        dialogRef.current?.close();
                      }}
                      className={
                        "flex w-full flex-col overflow-hidden rounded-control border text-left " +
                        (o.id === selected ? "border-brand-sky" : "border-fg/10 hover:border-brand-sky/50")
                      }
                    >
                      <span className="flex aspect-[4/3] items-center justify-center bg-ink-950">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                        <img src={o.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                      </span>
                      <span className="truncate px-2 py-1.5 text-xs">{o.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
