import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function AlbumsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.AlbumWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [rows, trashCount] = await Promise.all([
    db.album.findMany({
      where,
      orderBy: [{ takenAt: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true, _count: { select: { photos: true } } },
    }),
    db.album.count({ where: { deletedAt: { not: null } } }),
  ]);
  return (
    <AdminList
      title="Photo albums"
      intro="Albums for the website's Gallery: office, culture, training and other photos. Event photos are added on each event and appear in the Gallery automatically."
      basePath="/admin/albums"
      newLabel="New album"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Photos", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((r) => ({
        id: r.id,
        href: `/admin/albums/${r.id}`,
        title: r.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
        subtitle: r.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
        cells: [String(r._count.photos), <StatusBadge key="s" status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />, formatDhaka(r.updatedAt)],
      }))}
    />
  );
}
