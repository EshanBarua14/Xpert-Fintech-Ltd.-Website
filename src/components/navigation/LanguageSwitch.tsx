"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

const SHORT: Record<AppLocale, string> = { en: "EN", bn: "বাংলা" };

/**
 * Language toggle styled as a two-way switch; stays on the same page
 * (/en/products/rms ↔ /bn/products/rms). The choice is remembered in a cookie
 * that the middleware reads.
 */
export function LanguageSwitch({ current, label, className }: { current: AppLocale; label: string; className?: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.split("/").slice(2).join("/");
  const index = locales.indexOf(current);

  function remember(locale: AppLocale) {
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav aria-label={label} className={cn("relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1", className)}>
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 w-16 rounded-full bg-gradient-to-br from-brand-royal to-brand-mid shadow-[0_4px_16px_-4px_rgb(34_188_235/0.6)] transition-transform duration-300 ease-(--ease-ui)"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={`/${locale}${rest ? `/${rest}` : ""}`}
            hrefLang={locale}
            lang={locale}
            aria-current={active ? "true" : undefined}
            onClick={() => remember(locale)}
            className={cn(
              "relative z-10 flex h-8 w-16 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              active ? "text-white" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {SHORT[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
