import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";

  const where: Prisma.EventWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { translations: { some: { title: { contains: q, mode: "insensitive" } } } }),
  };
  const [events, trashCount] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: [{ startsAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      include: { translations: true, _count: { select: { organizations: true } } },
    }),
    db.event.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <AdminList
      title="Events"
      intro="Milestones, agreements and events shown in Insights and Proof."
      basePath="/admin/events"
      newLabel="New event"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Date", "Participants", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={events.map((ev) => ({
        id: ev.id,
        href: `/admin/events/${ev.id}`,
        title: ev.translations.find((t) => t.locale === "en")?.title ?? "(no English title)",
        subtitle: ev.translations.some((t) => t.locale === "bn") ? null : "No Bangla version yet",
        cells: [
          ev.startsAt ? `${formatDhaka(ev.startsAt, false)}${ev.dateIsApprox ? " (approx.)" : ""}` : "Date to confirm",
          ev._count.organizations || "—",
          <StatusBadge key="s" status={ev.status} publishAt={ev.publishAt} deletedAt={ev.deletedAt} />,
          formatDhaka(ev.updatedAt),
        ],
      }))}
    />
  );
}
