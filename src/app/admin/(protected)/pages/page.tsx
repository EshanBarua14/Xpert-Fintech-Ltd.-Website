import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function PagesPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";

  const where: Prisma.PageWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [pages, trashCount] = await Promise.all([
    db.page.findMany({
      where,
      orderBy: [{ key: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      include: { translations: true, _count: { select: { sections: true } } },
    }),
    db.page.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <AdminList
      title="Pages"
      intro="Home, About and other pages built from sections and blocks."
      basePath="/admin/pages"
      newLabel="New page"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Address", "Sections", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={pages.map((p) => {
        const en = p.translations.find((t) => t.locale === "en");
        return {
          id: p.id,
          href: `/admin/pages/${p.id}`,
          title: en?.title ?? "(no English title)",
          subtitle: p.key ? "System page" : null,
          cells: [
            `/en${en?.path ? `/${en.path}` : ""}`,
            p._count.sections,
            <StatusBadge key="s" status={p.status} publishAt={p.publishAt} deletedAt={p.deletedAt} />,
            formatDhaka(p.updatedAt),
          ],
        };
      })}
    />
  );
}
