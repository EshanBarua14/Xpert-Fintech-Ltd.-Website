import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

const SOURCE = { UPLOAD: "Uploaded file", YOUTUBE: "YouTube", VIMEO: "Vimeo", FACEBOOK: "Facebook" } as const;

export default async function VideosPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.VideoWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [rows, trashCount] = await Promise.all([
    db.video.findMany({ where, orderBy: [{ isFeatured: "desc" }, { recordedAt: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }, { createdAt: "desc" }], include: { translations: true } }),
    db.video.count({ where: { deletedAt: { not: null } } }),
  ]);
  return (
    <AdminList
      title="Videos"
      intro="Videos for the website's Gallery: YouTube, Vimeo or Facebook links, or short MP4/WebM files uploaded in Media. Event videos added on an event also appear in the Gallery."
      basePath="/admin/videos"
      newLabel="New video"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Source", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((r) => ({
        id: r.id,
        href: `/admin/videos/${r.id}`,
        title: (r.isFeatured ? "★ " : "") + (r.translations.find((t) => t.locale === "en")?.title ?? "(no English title)"),
        subtitle: r.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
        cells: [SOURCE[r.provider], <StatusBadge key="s" status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />, formatDhaka(r.updatedAt)],
      }))}
    />
  );
}
