import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { AdminList, formatDhaka, Notice } from "@/components/admin/AdminList";
import { LEAD_SOURCES, LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/validation/lead";

type Search = { q?: string; view?: string; status?: string; source?: string; trashed?: string; deleted?: string };

const isStatus = (v?: string): v is (typeof LEAD_STATUSES)[number] => !!v && (LEAD_STATUSES as readonly string[]).includes(v);
const isSource = (v?: string): v is (typeof LEAD_SOURCES)[number] => !!v && (LEAD_SOURCES as readonly string[]).includes(v);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const inTrash = params.view === "trash";
  const q = params.q?.trim().slice(0, 100) ?? "";
  const status = isStatus(params.status) ? params.status : undefined;
  const source = isSource(params.source) ? params.source : undefined;

  const where: Prisma.LeadWhereInput = {
    deletedAt: inTrash ? { not: null } : null,
    ...(status && { status }),
    ...(source && { source }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { organization: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  };

  const [leads, trashCount, counts] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        owner: { select: { name: true } },
        interestedOffering: { select: { translations: { where: { locale: "en" }, select: { name: true } } } },
      },
    }),
    db.lead.count({ where: { deletedAt: { not: null } } }),
    db.lead.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const now = new Date();

  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (source) exportParams.set("source", source);
  if (q) exportParams.set("q", q);

  return (
    <AdminList
      title="Leads"
      intro="Demo requests and contact messages from the website, plus leads you add yourself."
      basePath="/admin/leads"
      newLabel="Add lead"
      inTrash={inTrash}
      trashCount={trashCount}
      q={q}
      filters={[
        { label: `All (${counts.reduce((n, c) => n + c._count._all, 0)})`, param: "status", active: !status },
        ...LEAD_STATUSES.map((s) => ({ label: `${STATUS_LABELS[s]} (${countOf(s)})`, value: s, param: "status", active: status === s })),
      ]}
      columns={["Organization", "Source", "Product", "Status", "Owner", "Received"]}
      notices={
        <>
          {params.trashed && <Notice>Moved to trash.</Notice>}
          {params.deleted && <Notice>Deleted permanently.</Notice>}
          {!inTrash && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-text-secondary">Source:</span>
              {[undefined, ...LEAD_SOURCES].map((s) => {
                const p = new URLSearchParams();
                if (q) p.set("q", q);
                if (status) p.set("status", status);
                if (s) p.set("source", s);
                return (
                  <Link
                    key={s ?? "all"}
                    href={`/admin/leads${p.size ? `?${p}` : ""}`}
                    aria-current={source === s ? "page" : undefined}
                    className={source === s ? "text-text-primary underline" : "text-text-secondary hover:text-text-primary"}
                  >
                    {s ? SOURCE_LABELS[s] : "All"}
                  </Link>
                );
              })}
              <a href={`/admin/leads/export${exportParams.size ? `?${exportParams}` : ""}`} className={buttonClasses({ variant: "secondary", size: "sm", className: "ml-auto" })}>
                Download CSV
              </a>
            </div>
          )}
        </>
      }
      rows={leads.map((l) => ({
        id: l.id,
        href: `/admin/leads/${l.id}`,
        title: l.name,
        subtitle: l.email,
        cells: [
          l.organization ?? "—",
          SOURCE_LABELS[l.source],
          l.interestedOffering?.translations[0]?.name ?? "—",
          <span key="s" className="flex flex-wrap gap-1.5">
            <Badge tone={l.status === "NEW" ? "brand" : l.status === "WON" ? "up" : l.status === "LOST" ? "down" : "neutral"}>
              {STATUS_LABELS[l.status]}
            </Badge>
            {l.followUpAt && l.followUpAt <= now && l.status !== "WON" && l.status !== "LOST" && <Badge tone="down">Follow-up due</Badge>}
          </span>,
          l.owner?.name ?? "—",
          formatDhaka(l.createdAt),
        ],
      }))}
    />
  );
}
