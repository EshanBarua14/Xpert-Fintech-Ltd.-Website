import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function DeploymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";

  const where: Prisma.DeploymentWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { appName: { contains: q, mode: "insensitive" } }),
  };
  const [rows, trashCount] = await Promise.all([
    db.deployment.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        organization: { include: { translations: { where: { locale: "en" } } } },
        offering: { include: { translations: { where: { locale: "en" } } } },
      },
    }),
    db.deployment.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <AdminList
      title="App deployments"
      intro="Branded trading apps and other live installations of Xpert products."
      basePath="/admin/deployments"
      newLabel="New deployment"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Brokerage", "Runs on", "Links checked", "Status"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((d) => ({
        id: d.id,
        href: `/admin/deployments/${d.id}`,
        title: d.appName ?? "(unnamed app)",
        subtitle: d.androidPackage,
        cells: [
          d.organization?.translations[0]?.name ?? "Not linked",
          d.offering?.translations[0]?.name ?? "—",
          formatDhaka(d.linksCheckedAt, false),
          <StatusBadge key="s" status={d.status} publishAt={d.publishAt} deletedAt={d.deletedAt} />,
        ],
      }))}
    />
  );
}
