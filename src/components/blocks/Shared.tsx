import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { paragraphs, resolveHref } from "@/lib/public/text";
import type { AppLocale } from "@/lib/i18n/config";
import type { MediaInfo } from "@/lib/public/content";
import type { BlockText } from "./types";

export function BlockHeading({ text, align = "left", as: H = "h2" }: { text: BlockText; align?: "left" | "center"; as?: "h1" | "h2" }) {
  if (!text.eyebrow && !text.title && !text.subtitle) return null;
  return (
    <div className={cn("flex max-w-3xl flex-col gap-3", align === "center" && "mx-auto items-center text-center")}>
      {text.eyebrow && <p className="tabular text-xs tracking-[0.2em] text-brand-sky uppercase">{text.eyebrow}</p>}
      {text.title && (
        <H className={cn("font-display font-semibold tracking-tight text-balance", H === "h1" ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl")}>
          {text.title}
        </H>
      )}
      {text.subtitle && <p className="text-lg text-pretty text-text-secondary">{text.subtitle}</p>}
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
  return (
    <SmartLink href={href} locale={locale} className={buttonClasses({ variant, size: "lg" })}>
      {label}
    </SmartLink>
  );
}

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
