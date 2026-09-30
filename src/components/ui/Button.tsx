import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform] duration-(--duration-base) ease-(--ease-ui) " +
  "hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  // White on royal: 6.3:1
  primary: "bg-brand-royal text-white hover:bg-brand-royal-hover",
  secondary: "border border-white/20 text-text-primary hover:border-brand-sky hover:text-brand-sky",
  ghost: "text-brand-sky hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<CommonProps, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

/** A <button>. For navigation use <ButtonLink>. */
export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

/** A link styled as a button. External links open safely in a new tab. */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  external = false,
  children,
}: CommonProps & { href: string; external?: boolean }) {
  const classes = buttonClasses({ variant, size, className });
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
