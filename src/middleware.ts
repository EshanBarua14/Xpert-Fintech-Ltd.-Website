import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, type AppLocale } from "@/lib/i18n/config";

// Must match SESSION_COOKIE in src/lib/auth/session.ts (middleware cannot import server-only code).
const SESSION_COOKIE = "xpert_admin_session";

/**
 * 1. Admin area: without a session cookie, send the visitor to the login page.
 *    This is only a fast first gate; every admin page and action still checks
 *    the session in the database (requireAdmin).
 * 2. Public site: paths without a locale prefix are redirected to one — the
 *    `locale` cookie if set, else the browser's preferred language, else English.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login" || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
