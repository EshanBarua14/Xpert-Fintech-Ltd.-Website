import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { paragraphs, resolveHref } from "@/lib/public/text";
import type { AppLocale } from "@/lib/i18n/config";
import type { MediaInfo } from "@/lib/public/content";
import type { BlockText } from "./types";

export function BlockHeading({ text, align = "left", as: H = "h2" }: { text: BlockText; align?: "left" | "center"; as?: "h1" | "h2" }) {
  if (!text.eyebrow && !text.title && !text.subtitle) return null;
  return (
    <div className={cn("flex max-w-3xl flex-col gap-5", align === "center" && "mx-auto items-center text-center")}>
      {text.eyebrow && (
        <p className="eyebrow" data-reveal>
          {text.eyebrow}
        </p>
      )}
      {text.title && (
        <H
          data-reveal
          style={{ "--d": 1 } as CSSProperties}
          className={cn(
            "text-gradient font-display font-semibold tracking-[-0.035em] text-balance",
            H === "h1" ? "text-5xl leading-[1.02] md:text-7xl" : "text-3xl leading-[1.08] md:text-5xl",
          )}
        >
          {text.title}
        </H>
      )}
      {text.subtitle && (
        <p data-reveal style={{ "--d": 2 } as CSSProperties} className="text-lg leading-relaxed text-pretty text-text-secondary md:text-xl">
          {text.subtitle}
        </p>
      )}
    </div>
  );
}

export function Paragraphs({ text, className }: { text: string | null | undefined; className?: string }) {
  const parts = paragraphs(text);
  if (!parts.length) return null;
  return (
    <div className={cn("flex flex-col gap-4 leading-relaxed text-text-secondary", className)}>
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/** A link from the admin, rendered safely; unsafe or empty links render nothing. */
export function SmartLink({
  href,
  locale,
  className,
  children,
}: {
  href: string | null | undefined;
  locale: AppLocale;
  className?: string;
  children: ReactNode;
}) {
  const resolved = resolveHref(href, locale);
  if (!resolved) return null;
  return resolved.external ? (
    <a href={resolved.href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={resolved.href} className={className}>
      {children}
    </Link>
  );
}

export function CtaButton({
  label,
  href,
  locale,
  variant = "primary",
}: {
  label: string | null;
  href: string | null;
  locale: AppLocale;
  variant?: "primary" | "secondary";
}) {
  if (!label) return null;
  const className =
    variant === "primary"
      ? "btn-glow group inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
      : "inline-flex h-12 items-center gap-2 rounded-full border border-fg/15 bg-fg/[0.03] px-6 text-sm font-semibold text-text-primary backdrop-blur transition-colors duration-300 hover:border-brand-sky/60 hover:bg-brand-sky/10";
  return (
    <SmartLink href={href} locale={locale} className={className}>
      {label}
    </SmartLink>
  );
}

/** Staggered reveal delay for the n-th item in a grid. */
export const revealDelay = (i: number, perRow = 3) => ({ "--d": i % perRow }) as CSSProperties;

/** The card surface used across the site. */
export const CARD = "spotlight glass rounded-3xl p-6 md:p-7";

export function MediaImage({ media, className, sizes, priority }: { media: MediaInfo | undefined; className?: string; sizes?: string; priority?: boolean }) {
  if (!media) return null;
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width ?? 1200}
      height={media.height ?? 800}
      sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  );
}

export const gridCols: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};
