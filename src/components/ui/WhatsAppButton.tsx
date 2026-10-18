import type { AppLocale } from "@/lib/i18n/config";
import { getWhatsApp } from "@/lib/content/highlights";

/**
 * A floating "Chat on WhatsApp" button (Admin → Home highlights → WhatsApp).
 * Opens a chat with XFL's number, with the greeting set there filled in.
 * Until a number is saved it opens the contact page instead.
 */
export async function WhatsAppButton({ locale }: { locale: AppLocale }) {
  const wa = await getWhatsApp(locale);
  if (!wa) return null;
  return (
    <a
      href={wa.href}
      {...(wa.external && { target: "_blank", rel: "noopener noreferrer" })}
      aria-label={wa.label}
      className="whatsapp-fab group fixed right-4 bottom-4 z-(--z-sticky) inline-flex h-14 items-center gap-0 rounded-full sm:gap-2 bg-[#25d366] pr-4 pl-4 text-white shadow-lg shadow-black/25 ring-1 ring-black/10 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366] md:right-6 md:bottom-6 print:hidden"
    >
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden="true">
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="12" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="12" r="1.2" fill="currentColor" />
      </svg>
      <span className="max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-56 group-focus-visible:max-w-56 sm:max-w-56">{wa.label}</span>
    </a>
  );
}
