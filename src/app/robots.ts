import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/public/seo";

/** Staging and preview deployments set NEXT_PUBLIC_NOINDEX=1 to stay out of search. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_NOINDEX === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
