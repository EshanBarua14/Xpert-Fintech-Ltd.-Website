import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { NavProgress } from "@/components/navigation/NavProgress";
import { marketMode } from "@/lib/market/data";
import { Noto_Sans_Bengali, Noto_Serif_Bengali, Schibsted_Grotesk, Spectral } from "next/font/google";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteEffects } from "@/components/motion/SiteEffects";
import { AmbientBackground } from "@/components/motion/AmbientBackground";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import "../globals.css";

/*
 * Type. Spectral, a serif drawn for reading on screens, sets headlines with the
 * steady voice of an annual report; Schibsted Grotesk, a newsroom grotesque,
 * carries text, interface and figures (with tabular digits for prices).
 * Bangla falls back letter by letter to Noto Serif Bengali (headlines) and
 * Noto Sans Bengali (text), so both languages share one hierarchy.
 */
const display = Spectral({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-display-face", display: "swap" });
const body = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const displayBn = Noto_Serif_Bengali({ subsets: ["bengali"], weight: ["500", "600"], variable: "--font-display-bn", display: "swap" });
const bodyBn = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-body-bn", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Xpert Fintech Ltd.", template: "%s · Xpert Fintech Ltd." },
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/brand/apple-touch-icon.png" },
};

// Header and footer read from the CMS; refresh them at most every 5 minutes.
// Publishing from the admin portal will also trigger an immediate refresh (Phase 3).
export const revalidate = 300;


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${displayBn.variable} ${bodyBn.variable}${marketMode() !== "none" ? " has-ticker" : ""}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS hide scroll-reveal content only when JavaScript can reveal it again. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col text-text-primary">
        <AmbientBackground />
        <a href="#main" className="skip-link">
          {t.skipToContent}
        </a>
        <SiteHeader locale={locale} />
        <main id="main" className="relative flex-1 pt-[calc(5rem+var(--ticker-h))] md:pt-[calc(6rem+var(--ticker-h))]">
          {children}
        </main>
        <SiteFooter locale={locale} />
        <SiteEffects />
        <NavProgress />
      </body>
    </html>
  );
}
