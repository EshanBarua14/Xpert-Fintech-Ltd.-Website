import Image from "next/image";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

export type MarkLogo = { url: string; width: number | null; height: number | null };

/**
 * Each product's colours and symbol. Used for the product's mark until its
 * own logo is uploaded (Admin → Products → Product logo), and as the accent
 * of its device display and automation flow.
 */
export const PRODUCT_STYLE: Record<string, { from: string; to: string; icon: string; code: string }> = {
  "trading-platform": { from: "#1d4ed8", to: "#22bceb", icon: "exchange", code: "OMS" },
  ost: { from: "#0f766e", to: "#2dd4bf", icon: "globe", code: "OST" },
  "smart-stock": { from: "#6d28d9", to: "#c084fc", icon: "chart", code: "SS" },
  "back-office": { from: "#b45309", to: "#fbbf24", icon: "briefcase", code: "BO" },
  "bo-account-opening": { from: "#0369a1", to: "#38bdf8", icon: "users", code: "BOA" },
  ekyc: { from: "#be123c", to: "#fb7185", icon: "id", code: "eKYC" },
  dms: { from: "#3f6212", to: "#a3e635", icon: "document", code: "DMS" },
};
const FALLBACK = { from: "#1e3a8a", to: "#22bceb", icon: "bolt", code: "" };

/** Colours and symbol chosen in Admin → Design → Products (each optional). */
export type ProductLook = { from?: string; to?: string; icon?: string };

export function productStyle(key: string | null | undefined, look?: ProductLook | null) {
  const base = (key && PRODUCT_STYLE[key]) || FALLBACK;
  return { ...base, ...(look?.from && { from: look.from }), ...(look?.to && { to: look.to }), ...(look?.icon && { icon: look.icon }) };
}

/** CSS variables carrying a product's accent (--p-from, --p-to). */
export function productVars(key: string | null | undefined, look?: ProductLook | null): CSSProperties {
  const s = productStyle(key, look);
  return { "--p-from": s.from, "--p-to": s.to } as CSSProperties;
}

const SIZES = {
  sm: { box: "size-9 rounded-xl", icon: "size-[18px]", pad: "p-1" },
  md: { box: "size-12 rounded-2xl", icon: "size-6", pad: "p-1.5" },
  lg: { box: "size-16 rounded-[1.25rem]", icon: "size-8", pad: "p-2" },
  xl: { box: "size-20 rounded-3xl", icon: "size-10", pad: "p-2.5" },
} as const;

/**
 * The product's mark: its uploaded logo on a white tile, or its symbol on a
 * tile in its own colours.
 */
export function ProductMark({
  productKey,
  logo,
  name,
  size = "md",
  className,
  look,
}: {
  productKey: string | null | undefined;
  logo?: MarkLogo | null;
  name?: string;
  size?: keyof typeof SIZES;
  className?: string;
  look?: ProductLook | null;
}) {
  const s = SIZES[size];
  const st = productStyle(productKey, look);
  if (logo) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/5", s.box, s.pad, className)} title={name}>
        <Image src={logo.url} alt={name ?? ""} width={logo.width ?? 128} height={logo.height ?? 128} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden={name ? undefined : true}
      role={name ? "img" : undefined}
      aria-label={name}
      title={name}
      style={{ backgroundImage: `linear-gradient(135deg, ${st.from}, ${st.to})` }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_28px_-12px_rgb(0_0_0/0.6)]",
        s.box,
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <Icon name={st.icon} className={cn("relative", s.icon)} />
    </span>
  );
}
