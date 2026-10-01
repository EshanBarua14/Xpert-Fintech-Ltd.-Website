import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { pick } from "@/lib/public/text";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

const TYPE_LABEL: Record<string, string> = {
  PRODUCT: "Product",
  PLATFORM: "Platform",
  MODULE: "Module",
  CAPABILITY: "Capability",
  SERVICE: "Service",
  INTEGRATION: "Integration",
};

type Offering = {
  id: string;
  type: string;
  translations: { locale: string; slug: string; name: string; tagline: string | null; summary: string | null }[];
};

/** Product card: name, type, one-line value proposition, link to the product page. */
export function ProductCard({ offering, locale, t }: { offering: Offering; locale: AppLocale; t: Messages }) {
  const tr = pick(offering.translations, locale);
  const own = offering.translations.find((x) => x.locale === locale);
  if (!tr) return null;
  // Link to the Bangla page only when the product has a Bangla version.
  const href = `/${own ? locale : "en"}/products/${(own ?? tr).slug}`;
  return (
    <Link
      href={href}
      className="spotlight glass group flex h-full min-h-60 flex-col gap-4 rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1"
    >
      <Badge tone="brand" className="self-start">
        {TYPE_LABEL[offering.type] ?? offering.type}
      </Badge>
      <h3 className="font-display text-2xl font-semibold tracking-tight">{tr.name}</h3>
      {(tr.tagline || tr.summary) && <p className="text-sm text-text-secondary">{tr.tagline ?? tr.summary}</p>}
      <span className="mt-auto text-sm font-semibold text-brand-sky">
        {t.exploreProduct}
      </span>
    </Link>
  );
}
