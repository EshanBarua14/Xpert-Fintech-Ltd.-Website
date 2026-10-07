import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { LeadFormSection } from "@/components/forms/LeadFormSection";
import { ContactDetails } from "@/components/layout/ContactDetails";
import { OfficeMap } from "@/components/layout/OfficeMap";
import { PageHero, Shell } from "@/components/flagship/Sections";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { mediaIdsOf, toSections } from "@/lib/public/blocks";
import { getPageByKey } from "@/lib/public/content";
import { blockContext, buildMetadata } from "@/lib/public/seo";
import { pick } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.contactTitle, description: t.contactIntro, paths: { en: "contact", bn: "contact" } });
}

/**
 * Contact details from Admin → Settings / Offices. If a published page with
 * the key "contact" exists in Admin → Pages, its sections are shown too.
 * Messages sent with the form arrive in Admin → Leads.
 */
export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const [info, page] = await Promise.all([getSiteInfo(locale), getPageByKey("contact")]);
  const tr = page ? pick(page.translations, locale) : undefined;
  const sections = page ? toSections(page, locale) : [];
  const ctx = sections.length ? await blockContext(locale, mediaIdsOf(sections)) : null;

  return (
    <>
      <PageHero eyebrow={t.contactEyebrow} title={tr?.title ?? t.contactTitle} body={tr?.intro ?? t.contactIntro} />
      <Shell className="pb-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div data-reveal className="glass rounded-3xl p-6 md:p-10 lg:col-span-8">
            <LeadFormSection mode="contact" locale={locale} />
          </div>
          <aside className="flex flex-col gap-4 lg:col-span-4" aria-labelledby="reach-us">
            <h2 id="reach-us" className="font-display text-lg font-semibold">
              {t.orReachUs}
            </h2>
            <ContactDetails info={info} t={t} stacked />
          </aside>
        </div>
      </Shell>
      {info.mapEmbed && (
        <Shell className="pb-24">
          <OfficeMap info={info} t={t} />
        </Shell>
      )}
      {ctx && <Sections sections={sections} ctx={ctx} />}
    </>
  );
}
