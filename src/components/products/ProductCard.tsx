import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { pick } from "@/lib/public/text";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

/** The product's type in the page's language (Site text: typeProduct, typePlatform…). */
const typeLabel = (type: string, t: Messages) =>
  ({ PRODUCT: t.typeProduct, PLATFORM: t.typePlatform, MODULE: t.typeModule, CAPABILITY: t.typeCapability, SERVICE: t.typeService, INTEGRATION: t.typeIntegration })[type] ?? type;

type Offering = {
  id: string;
  type: string;
  translations: { locale: string; slug: string; name: string; tagline: string | null; summary: string | null }[];
};

/** Product card: name, type, one-line value proposition, link to the product page. */
export function ProductCard({
  offering,
  locale,
  t,
  logo,
}: {
  offering: Offering;
  locale: AppLocale;
  t: Messages;
  /** Product logo (Admin → Products → Product logo). */
  logo?: { url: string; width: number | null; height: number | null } | null;
}) {
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
      <span className="flex items-center justify-between gap-3">
        <Badge tone="brand" className="self-start">
          {typeLabel(offering.type, t)}
        </Badge>
        {logo && (
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5">
            <Image src={logo.url} alt="" width={logo.width ?? 96} height={logo.height ?? 96} className="h-full w-full object-contain" />
          </span>
        )}
      </span>
      <h3 className="font-display text-2xl font-semibold tracking-tight">{tr.name}</h3>
      {(tr.tagline || tr.summary) && <p className="text-sm text-text-secondary">{tr.tagline ?? tr.summary}</p>}
      <span className="mt-auto text-sm font-semibold text-brand-sky">
        {t.exploreProduct}
      </span>
    </Link>
  );
}
