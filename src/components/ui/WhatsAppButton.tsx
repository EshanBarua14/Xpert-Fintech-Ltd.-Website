import type { AppLocale } from "@/lib/i18n/config";
import { getWhatsApp } from "@/lib/content/highlights";
import { WhatsAppFab } from "./WhatsAppFab";

/**
 * The floating WhatsApp button on every page (Admin → Home highlights → WhatsApp):
 * it opens a small panel with a welcome line and two ways to reach XFL about a
 * demo, a WhatsApp chat with the message typed in, or a call.
 */
export async function WhatsAppButton({ locale }: { locale: AppLocale }) {
  const wa = await getWhatsApp(locale);
  if (!wa) return null;
  const bn = locale === "bn";
  return (
    <WhatsAppFab
      chat={wa.href}
      tel={wa.tel}
      number={wa.number}
      greeting={wa.greeting}
      labels={{
        open: wa.label,
        close: bn ? "বন্ধ করুন" : "Close",
        title: bn ? "এক্সপার্ট ফিনটেক" : "Xpert Fintech",
        status: bn ? "সাধারণত কয়েক মিনিটে উত্তর দেয়" : "Typically replies within minutes",
        chat: bn ? "হোয়াটসঅ্যাপে চ্যাট করুন" : "Chat on WhatsApp",
        call: bn ? "কল করুন" : "Call us",
      }}
    />
  );
}
