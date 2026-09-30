import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfferings } from "@/lib/public/content";
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
  const offerings = await getOfferings();

  // Platforms first, then products, modules, integrations and services.
  const order = ["PLATFORM", "PRODUCT", "MODULE", "INTEGRATION", "CAPABILITY", "SERVICE"];
  const sorted = [...offerings].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.sortOrder - b.sortOrder);

  return (
    <Container className="flex flex-col gap-12 py-16 md:py-24">
      <SectionHeading as="h1" title={t.products} />
      {sorted.length === 0 ? (
        <p className="text-text-secondary">{t.noItems}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((o) => (
            <li key={o.id}>
              <ProductCard offering={o} locale={locale} t={t} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
