import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils/cn";

export const BRAND_NAME = "Xpert Fintech Ltd.";
export const BRAND_TAGLINE = "Connect The Future";

/**
 * The logo with the company name and the tagline. The logo turns a full
 * 360° in 3D around its vertical axis once when the page loads and again when
 * the lockup is hovered or focused (inside a link with the "group" class); never for reduced motion.
 * The name and tagline stay in English in both languages: they are the brand.
 *
 * `text` controls when the words show: "always", or "roomy" for the header,
 * where they hide only at the widths the full menu needs the space.
 */
export function BrandLockup({ size = "md", text = "always", priority = false }: { size?: "md" | "lg"; text?: "always" | "roomy"; priority?: boolean }) {
  const lg = size === "lg";
  return (
    <span className="flex items-center gap-3">
      <span className="logo-spin inline-flex shrink-0">
        <Logo height={lg ? 56 : 40} priority={priority} />
      </span>
      <span
        className={cn(
          "flex-col leading-none",
          text === "always" ? "flex" : "hidden min-[400px]:max-sm:flex min-[580px]:max-lg:flex xl:flex",
        )}
      >
        <span className={cn("font-display font-medium tracking-[-0.01em] whitespace-nowrap text-text-primary", lg ? "text-2xl" : "text-[1.0625rem]")}>{BRAND_NAME}</span>
        <span className={cn("brand-tagline mt-1 font-medium whitespace-nowrap text-brand-sky", lg ? "text-sm" : "text-[0.6875rem]")}>{BRAND_TAGLINE}</span>
      </span>
    </span>
  );
}
