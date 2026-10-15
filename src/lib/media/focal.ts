import type { CSSProperties } from "react";

/**
 * Where the face (or subject) is in a photo, as fractions of its width and
 * height, and how far to zoom towards it (1 = not at all) for photos taken
 * from further away.
 */
export type Focal = { x: number; y: number; zoom?: number | null };

/** Portraits whose face point is not set yet: faces sit about a third of the way down. */
const PORTRAIT_DEFAULT: Focal = { x: 0.5, y: 0.36 };
const DEFAULT: Focal = { x: 0.5, y: 0.45 };

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/**
 * Styles for an `object-fit: cover` image so its face point sits as close to
 * the middle of the frame as the photo allows, zoomed in when set. `frame` is
 * the frame's width ÷ height (1 for a circle or square, 0.8 for 4:5). The
 * frame must clip (overflow hidden) for the zoom; pass `zoom: false` where the
 * image is its own frame.
 */
export function focusStyle(
  photo: { width?: number | null; height?: number | null; focal?: Focal | null } | null | undefined,
  frame: number,
  opts: { zoom?: boolean } = {},
): CSSProperties {
  const w = photo?.width ?? 0;
  const h = photo?.height ?? 0;
  const f = photo?.focal ?? (h > w ? PORTRAIT_DEFAULT : DEFAULT);
  if (!w || !h) return { objectPosition: `${pct(f.x)} ${pct(Math.min(f.y, 0.36))}` };
  const img = w / h;
  // Frame units: frame height = 1, frame width = `frame`.
  let px = 0.5, py = 0.5, fx = f.x, fy = f.y;
  if (img < frame - 0.001) {
    const H = frame / img; // the image is taller than the frame
    py = clamp((f.y * H - 0.5) / (H - 1));
    fy = f.y * H - py * (H - 1);
  } else if (img > frame + 0.001) {
    const W = img; // the image is wider than the frame
    px = clamp((f.x * W - frame / 2) / (W - frame));
    fx = (f.x * W - px * (W - frame)) / frame;
  }
  const style: CSSProperties = { objectPosition: `${pct(px)} ${pct(py)}` };
  const z = opts.zoom === false ? 1 : clamp(f.zoom ?? 1, 1, 2);
  if (z > 1.001) {
    // Zoom so the face moves towards where a portrait's face sits (centre,
    // a little above the middle), never past the photo's own edges: the
    // origin o with o + (face - o) × z = target, kept inside the frame.
    const origin = (face: number, target: number) => clamp((face * z - target) / (z - 1));
    style.scale = String(z);
    style.transformOrigin = `${pct(origin(clamp(fx), 0.5))} ${pct(origin(clamp(fy), 0.42))}`;
  }
  return style;
}
