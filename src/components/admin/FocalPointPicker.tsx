"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type MouseEvent, type KeyboardEvent } from "react";
import { focusStyle } from "@/lib/media/focal";

/**
 * Click the face (or subject) on the photo to set where every crop centres:
 * round avatars, 4:5 cards and the profile window. Arrow keys nudge the
 * point; the zoom brings in a face from a photo taken further away. The
 * previews show the result as visitors will see it. Saved with the form.
 */
export function FocalPointPicker({
  url,
  width,
  height,
  initial,
}: {
  url: string;
  width: number | null;
  height: number | null;
  initial: { x: number; y: number; zoom: number | null } | null;
}) {
  const [pt, setPt] = useState<{ x: number; y: number } | null>(initial ? { x: initial.x, y: initial.y } : null);
  const [zoom, setZoom] = useState(initial?.zoom ?? 1);
  const photo = { width, height, focal: pt ? { ...pt, zoom } : null };
  const set = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPt({ x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000 });
  };
  const nudge = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = e.shiftKey ? 0.05 : 0.01;
    const p = pt ?? { x: 0.5, y: 0.36 };
    const move: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    setPt({ x: Math.min(1, Math.max(0, p.x + m[0])), y: Math.min(1, Math.max(0, p.y + m[1])) });
  };
  return (
    <fieldset id="face" className="flex scroll-mt-24 flex-col gap-3 md:col-span-2">
      <legend className="text-sm font-semibold">Face position</legend>
      <p className="text-xs text-text-secondary">
        Click the middle of the face (about the nose). Round photos, cards and profile windows centre on this point. Arrow keys move it; Shift moves it further.
      </p>
      <input type="hidden" name="focalX" value={pt ? String(pt.x) : ""} />
      <input type="hidden" name="focalY" value={pt ? String(pt.y) : ""} />
      <input type="hidden" name="focalZoom" value={pt && zoom > 1 ? String(zoom) : ""} />
      <div className="flex flex-wrap items-start gap-6">
        <button
          type="button"
          onClick={set}
          onKeyDown={nudge}
          aria-label="Set the face position: click the face, or use the arrow keys"
          className="relative max-w-xs cursor-crosshair overflow-hidden rounded-xl border border-fg/15"
        >
          <img src={url} alt="" className="block h-auto w-full" />
          {pt && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgb(0_0_0/0.5)]"
              style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
            />
          )}
        </button>
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-4">
            <span className="flex flex-col items-center gap-1 text-xs text-text-secondary">
              <span className="relative size-20 overflow-hidden rounded-full bg-navy-800">
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" style={focusStyle(photo, 1)} />
              </span>
              Round
            </span>
            <span className="flex flex-col items-center gap-1 text-xs text-text-secondary">
              <span className="relative block h-32 w-[6.4rem] overflow-hidden rounded-xl bg-navy-800">
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" style={focusStyle(photo, 0.8)} />
              </span>
              Card (4:5)
            </span>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span>Zoom towards the face: {zoom.toFixed(2)}×</span>
            <input type="range" min={1} max={2} step={0.05} value={zoom} disabled={!pt} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <button
            type="button"
            onClick={() => {
              setPt(null);
              setZoom(1);
            }}
            className="self-start text-sm font-semibold text-brand-sky hover:underline"
          >
            Clear (use the standard crop)
          </button>
        </div>
      </div>
    </fieldset>
  );
}
