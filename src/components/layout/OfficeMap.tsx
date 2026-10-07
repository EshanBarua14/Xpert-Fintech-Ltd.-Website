import type { SiteInfo } from "@/lib/content/settings";
import type { Messages } from "@/lib/i18n/messages";

/** The office on a map, with the address, hours and a directions link beside it. */
export function OfficeMap({ info, t }: { info: SiteInfo; t: Messages }) {
  if (!info.mapEmbed) return null;
  return (
    <section aria-labelledby="visit-us" className="grid overflow-hidden rounded-3xl border border-fg/[0.08] bg-navy-900 lg:grid-cols-12">
      <div className="flex flex-col gap-5 p-7 md:p-10 lg:col-span-4">
        <h2 id="visit-us" className="font-display text-3xl text-text-primary">
          {t.visitUsTitle}
        </h2>
        {info.address && <address className="text-lg leading-relaxed text-text-primary not-italic">{info.address}</address>}
        {info.hours && (
          <p className="text-sm text-text-secondary">
            <span className="block font-semibold text-text-primary">{t.officeHours}</span>
            {info.hours}
          </p>
        )}
        {info.mapLink && (
          <a href={info.mapLink} target="_blank" rel="noopener noreferrer" className="btn-glow mt-auto inline-flex h-11 items-center self-start rounded-full px-5 text-sm font-semibold text-white">
            {t.getDirections}
          </a>
        )}
      </div>
      <div className="relative min-h-[22rem] lg:col-span-8">
        <iframe
          src={info.mapEmbed}
          title={t.mapTitle}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="office-map absolute inset-0 h-full w-full border-0"
          allowFullScreen
        />
      </div>
    </section>
  );
}
