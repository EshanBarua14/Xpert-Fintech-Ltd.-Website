import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sections } from "@/components/blocks/BlockRenderer";
import { ContactDetails } from "@/components/layout/ContactDetails";
import { Container, SectionHeading } from "@/components/ui/Layout";
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
 * (The enquiry form and lead inbox arrive in Phase 12.)
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
      <Container className="flex flex-col gap-12 py-16 md:py-24">
        <SectionHeading as="h1" title={tr?.title ?? t.contactTitle} intro={tr?.intro ?? t.contactIntro} />
        <ContactDetails info={info} t={t} />
      </Container>
      {ctx && <Sections sections={sections} ctx={ctx} />}
    </>
  );
}
