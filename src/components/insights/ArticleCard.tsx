import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ArticleCardData } from "@/lib/public/insights";
import type { AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { fill } from "@/lib/i18n/digits";

export function formatNewsDate(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(date);
}

/** Cover image, or a branded panel with the category when there is none. */
function Cover({ a, large, locale }: { a: ArticleCardData; large?: boolean; locale: AppLocale }) {
  return (
    <span className={cn("relative block overflow-hidden bg-navy-800", large ? "aspect-[16/9] lg:aspect-auto lg:h-full" : "aspect-[16/9]")}>
      {a.cover ? (
        <Image
          src={a.cover.url}
          alt={a.cover.alt || ""}
          fill
          sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 overflow-hidden bg-gradient-to-br from-brand-royal/35 via-navy-800 to-ink-950">
          <span className="absolute -right-16 -bottom-20 size-64 rounded-full bg-brand-sky/15 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <span className="absolute bottom-5 left-6 font-display text-sm text-cyan-300/70">{locale === "bn" ? "এক্সপার্ট ফিনটেক" : "Xpert Fintech"}</span>
        </span>
      )}
    </span>
  );
}

function Meta({ a, locale, minLabel }: { a: ArticleCardData; locale: AppLocale; minLabel: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
      {a.category && <span className="font-semibold text-gold">{a.category}</span>}
      <time dateTime={a.date.toISOString()}>{formatNewsDate(a.date, locale)}</time>
      <span aria-hidden="true">·</span>
      <span>{fill(minLabel, { n: a.minutes })}</span>
    </span>
  );
}

export function ArticleCard({ a, locale, minLabel, i = 0 }: { a: ArticleCardData; locale: AppLocale; minLabel: string; i?: number }) {
  return (
    <li data-reveal style={{ "--d": i % 3 } as CSSProperties}>
      <Link href={a.href} className="spotlight glass group flex h-full flex-col overflow-hidden rounded-3xl transition-transform duration-500 hover:-translate-y-1">
        <Cover a={a} locale={locale} />
        <span className="flex flex-1 flex-col gap-3 p-6">
          <Meta a={a} locale={locale} minLabel={minLabel} />
          <span className="font-display text-xl leading-snug font-semibold tracking-tight text-balance text-text-primary">{a.title}</span>
          {a.excerpt && <span className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{a.excerpt}</span>}
        </span>
      </Link>
    </li>
  );
}

/** The lead story: large, image beside text on desktop. */
export function FeaturedArticle({ a, locale, minLabel, readLabel }: { a: ArticleCardData; locale: AppLocale; minLabel: string; readLabel: string }) {
  return (
    <Link href={a.href} data-reveal className="beam glass group grid overflow-hidden rounded-[2rem] lg:grid-cols-[1.35fr_1fr]">
      <Cover a={a} large locale={locale} />
      <span className="flex flex-col justify-center gap-5 p-8 md:p-12">
        <Meta a={a} locale={locale} minLabel={minLabel} />
        <span className="font-display text-3xl leading-[1.08] font-semibold tracking-[-0.025em] text-balance text-text-primary md:text-4xl">{a.title}</span>
        {a.excerpt && <span className="line-clamp-4 text-lg leading-relaxed text-text-secondary">{a.excerpt}</span>}
        {a.author && <span className="text-sm text-text-secondary">{a.author}</span>}
        <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-sky">
          {readLabel}
        </span>
      </span>
    </Link>
  );
}
