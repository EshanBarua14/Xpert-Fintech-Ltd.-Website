import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { ORGANIZATION_KIND_LABELS, ORGANIZATION_KINDS, type OrganizationKindKey } from "@/lib/validation/organizations";

type Search = { q?: string; kind?: string; view?: string; trashed?: string; deleted?: string };

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const kind = ORGANIZATION_KINDS.includes(params.kind as OrganizationKindKey) ? (params.kind as OrganizationKindKey) : undefined;

  const where: Prisma.OrganizationWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(kind && { kind }),
    ...(q && { translations: { some: { name: { contains: q, mode: "insensitive" } } } }),
  };
  const [orgs, trashCount] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      include: { translations: true, _count: { select: { deployments: true } } },
    }),
    db.organization.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <AdminList
      title="Organizations"
      intro="Consortium members, clients, partners and exchanges."
      basePath="/admin/organizations"
      newLabel="New organization"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      filters={[
        { label: "All", param: "kind", active: !kind },
        ...ORGANIZATION_KINDS.map((k) => ({ label: ORGANIZATION_KIND_LABELS[k], value: k, param: "kind", active: kind === k })),
      ]}
      columns={["Type", "Logo on site", "Apps", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={orgs.map((o) => ({
        id: o.id,
        href: `/admin/organizations/${o.id}`,
        title: o.translations.find((t) => t.locale === "en")?.name ?? "(no English name)",
        subtitle: o.translations.find((t) => t.locale === "en")?.shortName,
        cells: [
          ORGANIZATION_KIND_LABELS[o.kind],
          o.logoMediaId && o.logoPermission ? "Yes" : o.logoMediaId ? "No permission yet" : "No logo",
          o._count.deployments || "—",
          <StatusBadge key="s" status={o.status} publishAt={o.publishAt} deletedAt={o.deletedAt} />,
          formatDhaka(o.updatedAt),
        ],
      }))}
    />
  );
}
