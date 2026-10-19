import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { HighlightsForm } from "@/components/admin/HighlightsForm";
import { ICON_NAMES } from "@/components/ui/Icon";
import { getOwnershipSetting, getSavingsSetting, getStrengthsSetting, getWhatsAppSetting, MAX_STRENGTHS } from "@/lib/content/highlights";

export const metadata = { title: "Home highlights" };

/** Admin → Home highlights: core strengths, the cost-savings graphic and the WhatsApp button. */
export default async function HighlightsPage() {
  await requireAdmin();
  const [strengths, savings, whatsapp, ownership] = await Promise.all([getStrengthsSetting(), getSavingsSetting(), getWhatsAppSetting(), getOwnershipSetting()]);
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Home highlights</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          The core strengths cards and the cost savings graphic on the home page, and the WhatsApp button on every page. Show or hide the home sections, the
          price ticker and the hero indices in{" "}
          <Link href="/admin/design" className="font-semibold text-brand-sky hover:underline">
            Design → Home page
          </Link>
          .
        </p>
      </div>
      <HighlightsForm ownership={ownership} strengths={strengths} savings={savings} whatsapp={whatsapp} icons={ICON_NAMES} max={MAX_STRENGTHS} />
    </div>
  );
}
