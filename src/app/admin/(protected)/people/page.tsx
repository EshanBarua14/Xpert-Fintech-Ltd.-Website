import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { PERSON_GROUP_LABELS, PERSON_GROUPS, type PersonGroupKey } from "@/lib/validation/people";

type Search = { q?: string; group?: string; view?: string; trashed?: string; deleted?: string };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const group = PERSON_GROUPS.includes(params.group as PersonGroupKey) ? (params.group as PersonGroupKey) : undefined;

  const where: Prisma.PersonWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(group && { roles: { some: { group } } }),
    ...(q && { translations: { some: { name: { contains: q, mode: "insensitive" } } } }),
  };
  const [people, trashCount] = await Promise.all([
    db.person.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { translations: true, roles: { include: { translations: { where: { locale: "en" } } } } },
    }),
    db.person.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <AdminList
      title="People"
      intro="Board of directors, management committee and team shown on the Company pages."
      basePath="/admin/people"
      newLabel="New person"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      filters={[
        { label: "All", param: "group", active: !group },
        ...PERSON_GROUPS.map((g) => ({ label: PERSON_GROUP_LABELS[g], value: g, param: "group", active: group === g })),
      ]}
      columns={["Roles", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={people.map((p) => ({
        id: p.id,
        href: `/admin/people/${p.id}`,
        title: p.translations.find((t) => t.locale === "en")?.name ?? "(no English name)",
        subtitle: p.translations.some((t) => t.locale === "bn") ? null : "No Bangla name yet",
        cells: [
          p.roles
            .map((r) => `${r.translations[0]?.title || "(no title)"} · ${PERSON_GROUP_LABELS[r.group].split(" ")[0]}`)
            .join(", ") || "—",
          <StatusBadge key="s" status={p.status} publishAt={p.publishAt} deletedAt={p.deletedAt} />,
          formatDhaka(p.updatedAt),
        ],
      }))}
    />
  );
}
