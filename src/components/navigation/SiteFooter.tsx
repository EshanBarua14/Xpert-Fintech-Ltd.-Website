import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { Container } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { SocialIcon, socialKind } from "@/components/ui/SocialIcon";
import { getNavMenu, type NavLink } from "@/lib/content/navigation";
import { getSiteInfo } from "@/lib/content/settings";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";

function FooterLink({ item }: { item: NavLink }) {
  // py-1: a comfortable tap target on phones without changing the column rhythm much.
  const className = "inline-block py-1 text-sm text-text-secondary transition-colors hover:text-fg";
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
    <footer className="relative mt-auto overflow-hidden border-t border-fg/[0.06]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/60 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-royal/15 blur-3xl" />

      <Container className="relative flex flex-col gap-16 pt-20 pb-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="flex flex-col gap-6 md:col-span-4">
            <a href={`/${locale}`} className="group self-start" aria-label="Xpert Fintech Ltd. — home">
              <BrandLockup size="lg" name={info.companyName} tagline={t.brandTagline} />
            </a>
            {info.summary && <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{info.summary}</p>}
            <address className="flex flex-col gap-3 text-sm not-italic">
              {info.address && (
                <span className="flex gap-3 text-text-secondary">
                  <Icon name="globe" className="mt-0.5 size-4 shrink-0 text-brand-sky" />
                  <span className="flex flex-col gap-1">
                    <span>
                      <span className="sr-only">{t.address}: </span>
                      {info.address}
                    </span>
                    {info.mapLink && (
                      <a href={info.mapLink} target="_blank" rel="noopener noreferrer" className="self-start font-semibold text-brand-sky hover:text-fg">
                        {t.getDirections}
                      </a>
                    )}
                  </span>
                </span>
              )}
              {info.email && (
                <a href={`mailto:${info.email}`} className="flex items-center gap-3 text-text-primary hover:text-brand-sky">
                  <Icon name="mail" className="size-4 shrink-0 text-brand-sky" />
                  <span className="sr-only">{t.email}: </span>
                  {info.email}
                </a>
              )}
              {info.phone && (
                <a href={`tel:${info.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 text-text-primary hover:text-brand-sky">
                  <Icon name="phone" className="size-4 shrink-0 text-brand-sky" />
                  <span className="sr-only">{t.phone}: </span>
                  {info.phone}
                </a>
              )}
            </address>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 md:justify-items-end">
            {columns.map((column) => (
              <nav key={column.id} aria-label={column.label} className="min-w-40">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">{column.label}</h2>
                <ul className="flex flex-col gap-1.5">
                  {column.children.map((item) => (
                    <li key={item.id}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </Container>


      {(info.registration || info.regulatory) && (
        <Container className="relative border-t border-fg/[0.06] py-6">
          <div className="grid gap-3 text-xs leading-relaxed text-text-secondary md:grid-cols-2 md:gap-10">
            {info.registration && <p>{info.registration}</p>}
            {info.regulatory && <p>{info.regulatory}</p>}
          </div>
        </Container>
      )}

      <div className="relative border-t border-fg/[0.06] bg-ink-950/60 backdrop-blur">
        <Container className="flex flex-col gap-5 py-6 text-xs text-text-secondary md:flex-row md:items-center md:justify-between">
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
          {(info.socialLinks.length > 0 || info.email) && (
            <ul className="flex flex-wrap items-center gap-2" aria-label={t.followUs}>
              {info.email && (
                <li>
                  <a
                    href={`mailto:${info.email}`}
                    aria-label={`${t.email}: ${info.email}`}
                    title={info.email}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-fg/10 bg-fg/[0.03] text-text-secondary transition-colors hover:border-brand-sky/50 hover:text-fg"
                  >
                    <SocialIcon kind="email" />
                  </a>
                </li>
              )}
              {info.socialLinks.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-fg/10 bg-fg/[0.03] text-text-secondary transition-colors hover:border-brand-sky/50 hover:text-fg"
                  >
                    <SocialIcon kind={socialKind(s.url)} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
    </footer>
  );
}
