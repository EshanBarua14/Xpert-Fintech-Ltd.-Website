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

  // 0. One address for the whole site. Off unless CANONICAL_HOST is set (e.g. xpertfintech.com):
  //    then www. and the old vercel.app address move to https://<CANONICAL_HOST>.
  //    http:// → https:// is left to the host (cPanel "Force HTTPS", Nginx, Vercel): behind a proxy
  //    the request reaches Next.js as plain http, so checking the scheme here would loop.
  const canonical = process.env.CANONICAL_HOST;
  if (canonical) {
    const host = (request.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
    const local = host === "" || host === "localhost" || host.startsWith("127.");
    if (!local && host !== canonical) return NextResponse.redirect(`https://${canonical}${pathname}${search}`, 308);
  }

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
