import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { getShowcase } from "@/lib/public/showcase";
import { showcaseLabels } from "@/lib/public/labels";
import { capabilities, CapabilityBento, CtaBand, PageHero, SectionHeader, Shell } from "@/components/flagship/Sections";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getFlagshipData, getFlowProducts } from "@/lib/public/flagship";
import { buildMetadata } from "@/lib/public/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, title: getMessages(locale).products, paths: { en: "products", bn: "products" } });
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const [{ offerings, publishedSlugs }, showcase, flow] = await Promise.all([getFlagshipData(locale), getShowcase(locale), getFlowProducts(locale)]);

  // Platforms first, then products, modules, integrations and services.
  const order = ["PLATFORM", "PRODUCT", "MODULE", "INTEGRATION", "CAPABILITY", "SERVICE"];
  const sorted = [...offerings].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.sortOrder - b.sortOrder);

  return (
    <>
      <PageHero eyebrow={t.platformEyebrow} title={t.products} body={t.platformPageBody} />
      {showcase.length > 0 && (
        <Shell className="pb-20 md:pb-28">
          <ProductShowcase products={showcase} labels={showcaseLabels(t)} />
        </Shell>
      )}
      <Shell className="pb-24 md:pb-32">
        {sorted.length > 0 && (
          <div className="mb-12">
            <SectionHeader title={t.allProducts} />
          </div>
        )}
        {sorted.length === 0 ? (
          // Until products are published, show the platform capabilities instead of an empty page.
          <CapabilityBento items={capabilities(t, locale, publishedSlugs)} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((o, i) => (
              <li key={o.id} data-reveal style={{ "--d": i % 3 } as CSSProperties}>
                <ProductCard offering={o} locale={locale} t={t} logo={o.key ? flow[o.key]?.logo : null} />
              </li>
            ))}
          </ul>
        )}
      </Shell>
      <CtaBand t={t} locale={locale} />
    </>
  );
}
