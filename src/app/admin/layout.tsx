import type { Metadata } from "next";
import "../globals.css";
import { THEME_SCRIPT } from "@/lib/theme-script";

// The admin portal is a separate root layout: English-only UI, never indexed.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Xpert Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-navy-900 text-text-primary">{children}</body>
    </html>
  );
}
