import type { Metadata } from "next";
import { Schibsted_Grotesk, Spectral } from "next/font/google";
import "../globals.css";
import "./admin.css";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { NavProgress } from "@/components/navigation/NavProgress";

// The site's own typefaces (the admin is a separate root layout, so it loads them too).
const display = Spectral({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display-face", display: "swap" });
const body = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });

// The admin portal is a separate root layout: English-only UI, never indexed.
export const metadata: Metadata = {
  title: { default: "Xpert Fintech Web App Admin", template: "%s · Xpert Fintech Web App Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-navy-900 text-text-primary">
        {children}
        <NavProgress />
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
