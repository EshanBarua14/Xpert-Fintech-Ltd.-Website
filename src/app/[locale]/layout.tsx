import "@fontsource/noto-sans-bengali/400.css";
import "@fontsource/noto-sans-bengali/500.css";
import "@fontsource/noto-sans-bengali/600.css";
import type { Metadata } from "next";
import { ensureTextOverrides } from "@/lib/i18n/overrides";
import { notFound } from "next/navigation";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { designCss, getDesign } from "@/lib/content/design";
import { ThemeKeeper } from "@/components/navigation/ThemeKeeper";
import { NavProgress } from "@/components/navigation/NavProgress";
import { marketMode } from "@/lib/market/data";
import { Noto_Sans_Bengali, Noto_Serif_Bengali, Schibsted_Grotesk, Spectral } from "next/font/google";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SiteEffects } from "@/components/motion/SiteEffects";
import { AmbientBackground } from "@/components/motion/AmbientBackground";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import "../globals.css";

/*
 * Type. Spectral, a serif drawn for reading on screens, sets headlines with the
 * steady voice of an annual report; Schibsted Grotesk, a newsroom grotesque,
 * carries text, interface and figures (with tabular digits for prices).
 * Bangla falls back letter by letter to Noto Serif Bengali (headlines) and
 * Noto Sans Bengali (text), so both languages share one hierarchy.
 */
// Only the weights and styles in use are downloaded; the Bangla faces load only when Bangla text is on the page.
const display = Spectral({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal"], variable: "--font-display-face", display: "swap" });
const body = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const displayBn = Noto_Serif_Bengali({ subsets: ["bengali"], weight: ["500", "600"], variable: "--font-display-bn", display: "swap", preload: false });
const bodyBn = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-body-bn", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Xpert Fintech Ltd.", template: "%s · Xpert Fintech Ltd." },
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/brand/apple-touch-icon.png" },
};

/*
 * Caching. Each page is made on its first visit (not during the build, so the
 * build never needs the database) and then served from the cache, made again
 * at most every 5 minutes. Saving in the admin refreshes the pages at once
 * (revalidatePath). Pages with live market data stay made per visit (markets/*).
 */
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
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
  // Admin → Site text edits (loaded at start-up; refreshed here at most once a minute).
  await ensureTextOverrides();
  const t = getMessages(locale);
  const design = await getDesign();
  const css = designCss(design);
  // Admin → Design → DSE · CSE prices: room for the ticker on every page, or only on the market pages.
  const tickerClass = marketMode() === "none" || design.ticker === "off" ? "" : design.ticker === "all" ? " has-ticker" : " ticker-markets";

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${displayBn.variable} ${bodyBn.variable}${tickerClass}`} suppressHydrationWarning>
      <head>
        {/* Lets CSS hide scroll-reveal content only when JavaScript can reveal it again. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Colours chosen in Admin → Design */}
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      </head>
      <body className="flex min-h-dvh flex-col text-text-primary">
        <ThemeKeeper />
        <AmbientBackground />
        <a href="#main" className="skip-link">
          {t.skipToContent}
        </a>
        <SiteHeader locale={locale} />
        <main id="main" className="relative flex-1 pt-[calc(5rem+var(--ticker-h))] md:pt-[calc(6rem+var(--ticker-h))]">
          {children}
        </main>
        <SiteFooter locale={locale} />
        <WhatsAppButton locale={locale} />
        <SiteEffects />
        <NavProgress />
      </body>
    </html>
  );
}

