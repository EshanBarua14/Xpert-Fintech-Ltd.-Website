import { LeadForm } from "@/components/forms/LeadForm";
import type { AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOfferings } from "@/lib/public/content";
import { pick } from "@/lib/public/text";
import { turnstileSiteKey } from "@/lib/public/turnstile";

/** Loads the product list and spam-check key, then renders the form. */
export async function LeadFormSection({
  mode,
  locale,
  defaultOfferingId,
}: {
  mode: "demo" | "contact";
  locale: AppLocale;
  defaultOfferingId?: string | null;
}) {
  const offerings = mode === "demo" ? await getOfferings() : [];
  const options = offerings
    .map((o) => ({ id: o.id, name: pick(o.translations, locale)?.name ?? "" }))
    .filter((o) => o.name);
  return (
    <LeadForm
      mode={mode}
      locale={locale}
      t={getMessages(locale)}
      offerings={options}
      defaultOfferingId={defaultOfferingId}
      turnstileSiteKey={turnstileSiteKey()}
    />
  );
}
