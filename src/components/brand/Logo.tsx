import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * The official Xpert Fintech logo, used exactly as supplied
 * (public/brand/xpert-logo.png, 419 × 437, transparent background).
 * Never recolour, redraw or stretch it — only its size changes, always
 * keeping the original aspect ratio. Its one motion (a full turn, approved by
 * XFL) lives in BrandLockup.
 *
 * TODO(brand): replace with the SVG master when Xpert provides it.
 */
const LOGO = { src: "/brand/xpert-logo.png", width: 419, height: 437 } as const;

export function Logo({
  height = 40,
  priority = false,
  className,
}: {
  /** Rendered height in CSS pixels; width follows the aspect ratio. */
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round((LOGO.width / LOGO.height) * height);
  return (
    <Image
      src={LOGO.src}
      width={width}
      height={height}
      alt="Xpert Fintech Ltd."
      priority={priority}
      className={cn("select-none", className)}
      style={{ width, height }}
    />
  );
}
