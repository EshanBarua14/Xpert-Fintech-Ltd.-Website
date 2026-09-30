import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Inter_Tight, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteEffects } from "@/components/motion/SiteEffects";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-bengali", display: "swap" });

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
    <html lang={locale} className={`${inter.variable} ${interTight.variable} ${mono.variable} ${bengali.variable}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS hide scroll-reveal content only when JavaScript can reveal it again. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col text-text-primary">
        <a href="#main" className="skip-link">
          {t.skipToContent}
        </a>
        <SiteHeader locale={locale} />
        <main id="main" className="relative flex-1 pt-20 md:pt-24">
          {children}
        </main>
        <SiteFooter locale={locale} />
        <SiteEffects />
      </body>
    </html>
  );
}
