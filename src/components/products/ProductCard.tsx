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
      className="group flex h-full flex-col gap-4 rounded-card border border-white/10 bg-navy-900/50 p-6 transition-[border-color,transform] duration-(--duration-slow) ease-(--ease-ui) hover:-translate-y-0.5 hover:border-brand-sky/40"
    >
      <Badge tone="brand" className="self-start">
        {TYPE_LABEL[offering.type] ?? offering.type}
      </Badge>
      <h3 className="font-display text-xl font-semibold">{tr.name}</h3>
      {(tr.tagline || tr.summary) && <p className="text-sm text-text-secondary">{tr.tagline ?? tr.summary}</p>}
      <span className="mt-auto text-sm text-brand-sky">
        {t.exploreProduct} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
