import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Layout";
import { LanguageSwitch } from "@/components/navigation/LanguageSwitch";
import { getNavMenu, type NavLink } from "@/lib/content/navigation";
import { getSiteInfo } from "@/lib/content/settings";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";

function FooterLink({ item }: { item: NavLink }) {
  const className = "text-sm text-text-secondary transition-colors hover:text-brand-sky";
  if (!item.href) return <span className={className}>{item.label}</span>;
  return item.external ? (
    <a href={item.href} className={className} target="_blank" rel="noopener noreferrer">
      {item.label}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

/**
 * Footer. Everything shown here is edited in the admin portal:
 *  - columns: "footer" menu (top-level items are headings, children are links)
 *  - legal links: "footer-legal" menu
 *  - description, email, phone, address, social links: Settings and Offices
 */
export async function SiteFooter({ locale }: { locale: AppLocale }) {
  const [columns, legal, info] = await Promise.all([
    getNavMenu("footer", locale),
    getNavMenu("footer-legal", locale),
    getSiteInfo(locale),
  ]);
  const t = getMessages(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <Container className="grid gap-12 py-16 md:grid-cols-12">
        <div className="flex flex-col gap-5 md:col-span-4">
          <Logo height={64} />
          {info.summary && <p className="max-w-sm text-sm text-text-secondary">{info.summary}</p>}
          <address className="flex flex-col gap-2 text-sm not-italic">
            {info.address && (
              <span>
                <span className="sr-only">{t.address}: </span>
                {info.address}
              </span>
            )}
            {info.email && (
              <a href={`mailto:${info.email}`} className="text-brand-sky hover:underline">
                <span className="sr-only">{t.email}: </span>
                {info.email}
              </a>
            )}
            {info.phone && (
              <a href={`tel:${info.phone.replace(/[^\d+]/g, "")}`} className="hover:text-brand-sky">
                <span className="sr-only">{t.phone}: </span>
                {info.phone}
              </a>
            )}
          </address>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
          {columns.map((column) => (
            <nav key={column.id} aria-label={column.label}>
              <h2 className="mb-4 text-xs font-semibold tracking-[0.15em] text-text-primary uppercase">{column.label}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.children.map((item) => (
                  <li key={item.id}>
                    <FooterLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-4 py-6 text-xs text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {info.companyName} {t.allRightsReserved}
          </p>
          {legal.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legal.map((item) => (
                <li key={item.id}>
                  <FooterLink item={item} />
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-5">
            {info.socialLinks.length > 0 && (
              <ul className="flex gap-4" aria-label={t.followUs}>
                {info.socialLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-sky">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <LanguageSwitch current={locale} label={t.language} />
          </div>
        </Container>
      </div>
    </footer>
  );
}
