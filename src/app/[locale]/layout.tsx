import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { NavProgress } from "@/components/navigation/NavProgress";
import { marketMode } from "@/lib/market/data";
import { Anek_Bangla, Hind_Siliguri, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteEffects } from "@/components/motion/SiteEffects";
import { AmbientBackground } from "@/components/motion/AmbientBackground";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import "../globals.css";

/*
 * Type: Anek Bangla (display) and Hind Siliguri (text) both cover Latin and
 * Bangla, so English and বাংলা pages share one voice. JetBrains Mono is used
 * only for market figures, where columns of digits must line up.
 */
const display = Anek_Bangla({ subsets: ["latin", "bengali"], axes: ["wdth"], variable: "--font-display-face", display: "swap" });
const body = Hind_Siliguri({ subsets: ["latin", "bengali"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

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
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}${marketMode() !== "none" ? " has-ticker" : ""}`} suppressHydrationWarning>
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
