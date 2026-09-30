"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { resolveHref } from "@/lib/public/text";
import type { AppLocale } from "@/lib/i18n/config";

/** Client-side twin of SmartLink for use inside client components. */
export function SmartLinkClient({ href, locale, className, children }: { href: string; locale: AppLocale; className?: string; children: ReactNode }) {
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
