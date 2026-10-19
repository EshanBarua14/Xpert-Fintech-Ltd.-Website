import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { JourneyForm } from "@/components/admin/JourneyForm";
import { getJourneySetting } from "@/lib/content/journey";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function ListPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.CaseStudyWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [rows, trashCount] = await Promise.all([
    db.caseStudy.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { translations: true } }),
    db.caseStudy.count({ where: { deletedAt: { not: null } } }),
  ]);
  const journey = inTrash ? null : await getJourneySetting();
  return (
    <div className="flex flex-col gap-10">
    <AdminList
      title="Success stories"
      intro="Client stories: challenge, what we did and the outcome. Publish only with the client's agreement."
      basePath="/admin/case-studies"
      newLabel="New success story"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((r) => ({
        id: r.id,
        href: `/admin/case-studies/${r.id}`,
        title: r.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
        subtitle: r.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
        cells: [<StatusBadge key="s" status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />, formatDhaka(r.updatedAt)],
      }))}
    />
    {journey && <JourneyForm journey={journey} />}
    </div>
  );
}

export const dynamic = "force-dynamic";
