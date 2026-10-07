import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";

type Search = { q?: string; view?: string; trashed?: string; deleted?: string };

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim() ?? "";
  const where: Prisma.TestimonialWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(q && { OR: [{ personName: { contains: q, mode: "insensitive" } }, { translations: { some: { quote: { contains: q, mode: "insensitive" } } } }] }),
  };
  const [rows, trashCount] = await Promise.all([
    db.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { translations: true, organization: { include: { translations: { where: { locale: "en" } } } } },
    }),
    db.testimonial.count({ where: { deletedAt: { not: null } } }),
  ]);
  return (
    <AdminList
      title="Testimonials"
      intro="What clients and member brokerages say about Xpert, shown in the slider on the home page. Publish a quote only with the person's written approval."
      basePath="/admin/testimonials"
      newLabel="New testimonial"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      columns={["Organization", "Approval", "Status", "Updated"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
        </>
      }
      rows={rows.map((r) => {
        const quote = r.translations.find((t) => t.locale === "en")?.quote ?? "";
        return {
          id: r.id,
          href: `/admin/testimonials/${r.id}`,
          title: r.personName,
          subtitle: quote.length > 90 ? `“${quote.slice(0, 90)}…”` : `“${quote}”`,
          cells: [
            r.organization?.translations[0]?.name ?? "—",
            r.hasApproval ? "On file" : "Missing",
            <StatusBadge key="s" status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />,
            formatDhaka(r.updatedAt),
          ],
        };
      })}
    />
  );
}
