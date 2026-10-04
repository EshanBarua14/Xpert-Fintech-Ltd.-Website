import { headers } from "next/headers";
import { isLocale } from "@/lib/i18n/config";
import { rateLimit } from "@/lib/auth/rate-limit";
import { searchSite } from "@/lib/public/search";

/** GET /api/search?q=…&locale=en — results for the site search dialog. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") ?? "en";
  if (!isLocale(locale)) return Response.json({ error: "Unknown locale" }, { status: 400 });
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`search:${ip}`, 60, 60_000).ok) return Response.json({ error: "Too many searches" }, { status: 429 });
  const results = await searchSite(locale, q);
  return Response.json({ q, results }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
