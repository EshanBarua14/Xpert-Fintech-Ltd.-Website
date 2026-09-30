"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

/**
 * Switches language while staying on the same page: /en/products/rms ↔ /bn/products/rms.
 * The choice is remembered in a cookie that the middleware reads.
 */
export function LanguageSwitch({ current, label, className }: { current: AppLocale; label: string; className?: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.split("/").slice(2).join("/");

  function remember(locale: AppLocale) {
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav aria-label={label} className={cn("flex items-center gap-1 text-sm", className)}>
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
              "rounded-control px-2 py-1 transition-colors",
              active ? "text-text-primary" : "text-text-secondary hover:text-brand-sky",
            )}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
