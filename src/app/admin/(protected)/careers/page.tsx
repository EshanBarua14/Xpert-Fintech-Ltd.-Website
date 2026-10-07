import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { EMPLOYMENT_TYPES, labelOf } from "@/lib/admin/labels";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function CareersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.CareerWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [jobs, trashCount] = await Promise.all([
    db.career.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true, _count: { select: { applications: { where: { deletedAt: null } } } } },
    }),
    db.career.count({ where: { deletedAt: { not: null } } }),
  ]);
  const now = new Date();
  return (
    <AdminList
      title="Careers"
      intro="Job openings on the Careers page. Applications arrive in Admin → Applications."
      basePath="/admin/careers"
      newLabel="New job"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Department · type", "Deadline", "Applications", "Status"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently, with its applications.</Notice>}
        </>
      }
      rows={jobs.map((j) => ({
        id: j.id,
        href: `/admin/careers/${j.id}`,
        title: j.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
        subtitle: j.isClosed || (j.deadline && j.deadline < now) ? "Closed to applications" : null,
        cells: [
          [j.department, labelOf(EMPLOYMENT_TYPES, j.employmentType)].filter(Boolean).join(" · "),
          j.deadline ? formatDhaka(j.deadline, false) : "—",
          j._count.applications,
          <StatusBadge key="s" status={j.status} publishAt={j.publishAt} deletedAt={j.deletedAt} />,
        ],
      }))}
    />
  );
}
