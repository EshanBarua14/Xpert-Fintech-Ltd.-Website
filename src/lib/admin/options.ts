import "server-only";
import { db } from "@/lib/db/client";

/** Organizations for select boxes, grouped by name. */
export async function organizationOptions() {
  const rows = await db.organization.findMany({
    where: { deletedAt: null },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    include: { translations: { where: { locale: "en" } } },
  });
  return rows.map((o) => ({ value: o.id, label: o.translations[0]?.name ?? "(unnamed)" }));
}

/** Products and platforms for select boxes. */
export async function offeringOptions() {
  const rows = await db.offering.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: { translations: { where: { locale: "en" } } },
  });
  return rows.map((o) => ({ value: o.id, label: o.translations[0]?.name ?? "(untitled)" }));
}
