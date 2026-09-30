import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Inter_Tight, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import { isLocale, locales } from "@/lib/i18n/config";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-bengali", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Xpert Fintech Ltd.", template: "%s · Xpert Fintech Ltd." },
};

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

  return (
    <html lang={locale} className={`${inter.variable} ${interTight.variable} ${mono.variable} ${bengali.variable}`}>
      <body className="min-h-dvh bg-ink-950 text-text-primary">{children}</body>
    </html>
  );
}
