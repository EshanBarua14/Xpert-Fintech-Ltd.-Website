import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadFormSection } from "@/components/forms/LeadFormSection";
import { ContactDetails } from "@/components/layout/ContactDetails";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { getSiteInfo } from "@/lib/content/settings";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfferingBySlug } from "@/lib/public/content";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ product?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return buildMetadata({ locale, title: t.requestDemo, description: t.requestDemoIntro, paths: { en: "request-demo", bn: "request-demo" } });
}

/** Demo request form. ?product=slug pre-selects the product. Saves to Admin → Leads. */
export default async function RequestDemoPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const { product } = await searchParams;
  const slug = typeof product === "string" && /^[a-z0-9-]{1,120}$/.test(product) ? product : null;
  const [info, offering] = await Promise.all([getSiteInfo(locale), slug ? getOfferingBySlug(locale, slug) : null]);

  return (
    <Container className="flex flex-col gap-12 py-16 md:py-24">
      <SectionHeading as="h1" title={t.requestDemo} intro={t.requestDemoIntro} />
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <LeadFormSection mode="demo" locale={locale} defaultOfferingId={offering?.id ?? null} />
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-4" aria-labelledby="reach-us">
          <h2 id="reach-us" className="font-display text-lg font-semibold">
            {t.orReachUs}
          </h2>
          <ContactDetails info={info} t={t} stacked />
        </aside>
      </div>
    </Container>
  );
}
