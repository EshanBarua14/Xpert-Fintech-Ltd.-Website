import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadFormSection } from "@/components/forms/LeadFormSection";
import { ContactDetails } from "@/components/layout/ContactDetails";
import { PageHero, Shell } from "@/components/flagship/Sections";
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
    <>
      <PageHero eyebrow={t.demoEyebrow} title={t.requestDemo} body={t.requestDemoIntro} />
      <Shell className="pb-16 md:pb-20">
      <div className="grid gap-8 lg:grid-cols-12">
        <div data-reveal className="glass rounded-3xl p-6 md:p-10 lg:col-span-8">
          <LeadFormSection mode="demo" locale={locale} defaultOfferingId={offering?.id ?? null} />
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-4" aria-labelledby="reach-us">
          <h2 id="reach-us" className="font-display text-lg font-semibold">
            {t.orReachUs}
          </h2>
          <ContactDetails info={info} t={t} stacked />
          <div className="glass mt-2 flex flex-col gap-4 rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold">{t.demoNextTitle}</h2>
            <ol className="relative flex flex-col gap-4 border-l border-fg/10 pl-5">
              {[t.demoNext1, t.demoNext2, t.demoNext3].map((s, i) => (
                <li key={i} className="relative text-sm leading-relaxed text-text-secondary">
                  <span aria-hidden="true" className="absolute top-0 -left-[1.95rem] flex size-6 items-center justify-center rounded-full bg-brand-royal font-mono text-xs text-white">
                    {new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(i + 1)}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
      </Shell>
    </>
  );
}

// Reads ?category= / ?q= / ?product= from the address, so it is made on each visit;
// under the cached locale layout, reading it on a cached page fails in production.
export const dynamic = "force-dynamic";
