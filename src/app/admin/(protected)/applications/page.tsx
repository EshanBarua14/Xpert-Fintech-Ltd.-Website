import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { APPLICATION_STATUSES, labelOf } from "@/lib/admin/labels";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string; status?: string };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const status = APPLICATION_STATUSES.find((s) => s.value === params.status)?.value;
  const where: Prisma.CareerApplicationWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(status && { status }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }),
  };
  const [apps, trashCount] = await Promise.all([
    db.careerApplication.findMany({ where, orderBy: { createdAt: "desc" }, include: { career: { include: { translations: true } } } }),
    db.careerApplication.count({ where: { deletedAt: { not: null } } }),
  ]);
  return (
    <AdminList
      title="Applications"
      intro="Job applications from the Careers page. CVs are private: only signed-in admins can open them."
      basePath="/admin/applications"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      filters={[
        { label: "All", param: "status", active: !status },
        ...APPLICATION_STATUSES.map((s) => ({ label: s.label, value: s.value, param: "status", active: status === s.value })),
      ]}
      columns={["Job", "Status", "CV", "Received"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently, including the CV.</Notice>}
        </>
      }
      rows={apps.map((a) => ({
        id: a.id,
        href: `/admin/applications/${a.id}`,
        title: a.name,
        subtitle: a.email,
        cells: [
          a.career.translations.find((t) => t.locale === "en")?.title ?? "—",
          labelOf(APPLICATION_STATUSES, a.status),
          a.cvMediaId ? "Attached" : "—",
          formatDhaka(a.createdAt),
        ],
      }))}
    />
  );
}
