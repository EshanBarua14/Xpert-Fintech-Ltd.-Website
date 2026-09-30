export const ORGANIZATION_KINDS = ["CONSORTIUM_MEMBER", "CLIENT", "PARTNER", "EXCHANGE", "REGULATOR", "OTHER"] as const;
export type OrganizationKindKey = (typeof ORGANIZATION_KINDS)[number];

export const ORGANIZATION_KIND_LABELS: Record<OrganizationKindKey, string> = {
  CONSORTIUM_MEMBER: "Consortium member",
  CLIENT: "Client",
  PARTNER: "Partner",
  EXCHANGE: "Exchange",
  REGULATOR: "Regulator",
  OTHER: "Other",
};

/** "2025-05-12" (date input) → Date at midnight Dhaka time, or null. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00+06:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DD" in Dhaka time, for date inputs. */
export function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
