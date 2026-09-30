import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { SiteInfo } from "@/lib/content/settings";
import type { Messages } from "@/lib/i18n/messages";

/**
 * Contact details from Admin → Settings and Admin → Offices.
 * Rows without a value are hidden; nothing is invented.
 */
export function ContactDetails({ info, t, mailSubject }: { info: SiteInfo; t: Messages; mailSubject?: string }) {
  const mailto = info.email
    ? `mailto:${info.email}${mailSubject ? `?subject=${encodeURIComponent(mailSubject)}` : ""}`
    : null;
  const tel = info.phone ? `tel:${info.phone.replace(/[^\d+]/g, "")}` : null;

  if (!mailto && !tel && !info.address) {
    return <p className="text-text-secondary">{t.contactUnavailable}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid gap-6 sm:grid-cols-2">
        {info.email && (
          <div className="flex flex-col gap-1 rounded-card border border-white/10 bg-navy-900 p-6">
            <dt className="text-sm text-text-secondary">{t.email}</dt>
            <dd>
              <a href={mailto!} className="text-lg break-all text-brand-sky hover:underline">
                {info.email}
              </a>
            </dd>
          </div>
        )}
        {info.phone && (
          <div className="flex flex-col gap-1 rounded-card border border-white/10 bg-navy-900 p-6">
            <dt className="text-sm text-text-secondary">{t.phone}</dt>
            <dd>
              <a href={tel!} className="tabular text-lg text-brand-sky hover:underline">
                {info.phone}
              </a>
            </dd>
          </div>
        )}
        {info.address && (
          <div className="flex flex-col gap-1 rounded-card border border-white/10 bg-navy-900 p-6 sm:col-span-2">
            <dt className="text-sm text-text-secondary">{t.address}</dt>
            <dd className="text-lg whitespace-pre-line">{info.address}</dd>
          </div>
        )}
      </dl>
      {(mailto || tel) && (
        <div className="flex flex-wrap gap-3">
          {mailto && (
            <a href={mailto} className={buttonClasses({})}>
              <Icon name="document" className="size-4" />
              {t.emailUs}
            </a>
          )}
          {tel && (
            <a href={tel} className={buttonClasses({ variant: "secondary" })}>
              {t.callUs}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
