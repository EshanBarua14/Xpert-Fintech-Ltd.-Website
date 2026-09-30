import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactDetails } from "@/components/layout/ContactDetails";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfferingBySlug } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";
import { pick } from "@/lib/public/text";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ product?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.requestDemo, description: t.requestDemoIntro, paths: { en: "request-demo", bn: "request-demo" } });
}

/**
 * Until the demo form and lead inbox are built (Phase 12), this page offers
 * the contact details from Admin → Settings, with the chosen product
 * (?product=slug) filled into the email subject.
 */
export default async function RequestDemoPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const { product } = await searchParams;
  const slug = typeof product === "string" && /^[a-z0-9-]{1,120}$/.test(product) ? product : null;

  const [info, offering] = await Promise.all([getSiteInfo(locale), slug ? getOfferingBySlug(locale, slug) : null]);
  const offeringTr = offering ? pick(offering.translations, locale) : undefined;
  const subject = offeringTr ? `${t.demoEmailSubject}: ${offeringTr.name}` : t.demoEmailSubject;

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-16 md:py-24">
      <SectionHeading as="h1" title={t.requestDemo} intro={t.requestDemoIntro} />
      {offeringTr && (
        <p className="rounded-control border border-brand-sky/30 bg-brand-sky/5 px-4 py-3">
          <span className="text-text-secondary">{t.demoFor}: </span>
          <Link href={`/${locale}/products/${offeringTr.slug}`} className="font-medium text-brand-sky hover:underline">
            {offeringTr.name}
          </Link>
        </p>
      )}
      <ContactDetails info={info} t={t} mailSubject={subject} />
      {info.email && <p className="text-sm text-text-secondary">{t.demoEmailHint}</p>}
    </Container>
  );
}
