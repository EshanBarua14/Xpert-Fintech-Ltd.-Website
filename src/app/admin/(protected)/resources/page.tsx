import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { labelOf, RESOURCE_KINDS } from "@/lib/admin/labels";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function ListPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.ResourceWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [rows, trashCount] = await Promise.all([
    db.resource.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { translations: true } }),
    db.resource.count({ where: { deletedAt: { not: null } } }),
  ]);
  return (
    <AdminList
      title="Resources"
      intro="Brochures, product sheets and documents on the Resources page."
      basePath="/admin/resources"
      newLabel="New resource"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Type", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((r) => ({
        id: r.id,
        href: `/admin/resources/${r.id}`,
        title: r.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
        subtitle: r.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
        cells: [labelOf(RESOURCE_KINDS, r.kind), <StatusBadge key="s" status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />, formatDhaka(r.updatedAt)],
      }))}
    />
  );
}
