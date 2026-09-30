import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, type AppLocale } from "@/lib/i18n/config";

/**
 * Locale routing for public pages:
 *  - `/admin`, `/api`, Next internals and files are left alone.
 *  - Paths without a locale prefix are redirected to one: the `locale` cookie
 *    if set, else the browser's preferred language, else English.
 * Admin session checks are added here in Phase 3.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) return NextResponse.next();

  const locale = pickLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

function pickLocale(request: NextRequest): AppLocale {
  const cookie = request.cookies.get("locale")?.value;
  if (isLocale(cookie)) return cookie;

  const accept = request.headers.get("accept-language") ?? "";
  if (/^\s*bn\b/i.test(accept)) return "bn";

  return defaultLocale;
}

export const config = {
  matcher: ["/((?!admin|api|_next|.*\\..*).*)"],
};
