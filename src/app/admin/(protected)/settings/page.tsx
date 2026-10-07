import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { SettingsForm, type SettingsValues } from "@/components/admin/SettingsForm";

function text(value: unknown, locale?: "en" | "bn"): string {
  if (typeof value === "string") return value;
  if (locale && value && typeof value === "object") {
    const v = (value as Record<string, unknown>)[locale];
    return typeof v === "string" ? v : "";
  }
  return "";
}

export default async function SettingsPage() {
  await requireAdmin();
  const [rows, office] = await Promise.all([
    db.siteSetting.findMany(),
    db.office.findUnique({ where: { key: "hq" }, include: { translations: true } }),
  ]);
  const get = (key: string) => rows.find((r) => r.key === key)?.value;
  const social = get("social.links");
  const alerts = get("leads.alertEmails");

  const values: SettingsValues = {
    companyNameEn: text(get("company.name"), "en"),
    companyNameBn: text(get("company.name"), "bn"),
    summaryEn: text(get("company.summary"), "en"),
    summaryBn: text(get("company.summary"), "bn"),
    contactEmail: text(get("contact.email")),
    contactPhone: text(get("contact.phone")),
    appSupportEmail: text(get("contact.appSupportEmail")),
    appSupportPhone: text(get("contact.appSupportPhone")),
    addressEn: office?.translations.find((t) => t.locale === "en")?.address ?? "",
    addressBn: office?.translations.find((t) => t.locale === "bn")?.address ?? "",
    mapUrl: office?.mapUrl ?? "",
    hoursEn: office?.translations.find((t) => t.locale === "en")?.hours ?? "",
    hoursBn: office?.translations.find((t) => t.locale === "bn")?.hours ?? "",
    registrationEn: text(get("company.registration"), "en"),
    registrationBn: text(get("company.registration"), "bn"),
    regulatoryEn: text(get("company.regulatory"), "en"),
    regulatoryBn: text(get("company.regulatory"), "bn"),
    socialLinks: Array.isArray(social)
      ? social
          .map((s) => (s && typeof s === "object" ? `${(s as { label?: string }).label ?? ""} | ${(s as { url?: string }).url ?? ""}` : ""))
          .filter(Boolean)
          .join("\n")
      : "",
    alertEmails: Array.isArray(alerts) ? alerts.filter((a): a is string => typeof a === "string").join("\n") : "",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Company details, contact information and alerts used across the website.</p>
      </div>
      <SettingsForm values={values} />
    </div>
  );
}
