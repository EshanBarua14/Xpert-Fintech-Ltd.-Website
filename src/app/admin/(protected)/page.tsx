import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";

type Stat = { label: string; value: number; href?: string; note?: string };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const live = { status: "PUBLISHED" as const, deletedAt: null };
  const draft = { status: "DRAFT" as const, deletedAt: null };

  // Real counts from the database — no invented analytics.
  const [
    productsLive,
    productsDraft,
    pages,
    members,
    deployments,
    events,
    newLeads,
    media,
    recent,
    followUpsDue,
    recentLeads,
  ] = await Promise.all([
    db.offering.count({ where: live }),
    db.offering.count({ where: draft }),
    db.page.count({ where: { deletedAt: null } }),
    db.organization.count({ where: { kind: "CONSORTIUM_MEMBER", deletedAt: null } }),
    db.deployment.count({ where: { deletedAt: null } }),
    db.event.count({ where: { deletedAt: null } }),
    db.lead.count({ where: { status: "NEW", deletedAt: null } }),
    db.media.count({ where: { deletedAt: null } }),
    db.offering.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { translations: { where: { locale: "en" } } },
    }),
    db.lead.count({ where: { deletedAt: null, followUpAt: { lte: new Date() }, status: { notIn: ["WON", "LOST"] } } }),
    db.lead.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, organization: true, createdAt: true, status: true } }),
  ]);

  const stats: Stat[] = [
    { label: "Products published", value: productsLive, href: "/admin/products?status=PUBLISHED" },
    { label: "Products in draft", value: productsDraft, href: "/admin/products?status=DRAFT" },
    { label: "Pages", value: pages, href: "/admin/pages" },
    { label: "Consortium members", value: members, href: "/admin/organizations?kind=CONSORTIUM_MEMBER" },
    { label: "App deployments", value: deployments, href: "/admin/deployments" },
    { label: "Events", value: events, href: "/admin/events" },
    { label: "New leads", value: newLeads, href: "/admin/leads?status=NEW" },
    { label: "Follow-ups due", value: followUpsDue, href: "/admin/leads" },
    { label: "Media files", value: media, href: "/admin/media" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Welcome, {admin.name}</h1>
        <p className="mt-1 text-text-secondary">Overview of the website content.</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <span className="tabular text-3xl font-semibold">{s.value}</span>
              <span className="text-sm text-text-secondary">{s.label}</span>
              {s.note && <span className="text-xs text-text-secondary/70">{s.note}</span>}
            </>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link href={s.href} className="flex h-full flex-col gap-1 rounded-card border border-white/10 bg-ink-950/50 p-5 hover:border-brand-sky/40">
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-1 rounded-card border border-white/10 bg-ink-950/50 p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">Latest leads</h2>
          <Link href="/admin/leads" className="text-sm text-text-secondary hover:text-brand-sky">
            All leads →
          </Link>
        </div>
        <ul className="divide-y divide-white/10 rounded-card border border-white/10">
          {recentLeads.length === 0 && <li className="px-4 py-3 text-sm text-text-secondary">No leads yet. Website enquiries will appear here.</li>}
          {recentLeads.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link href={`/admin/leads/${l.id}`} className="hover:text-brand-sky">
                {l.name}
                {l.organization && <span className="text-text-secondary"> · {l.organization}</span>}
                {l.status === "NEW" && <span className="ml-2 text-xs text-brand-sky">new</span>}
              </Link>
              <time className="text-xs text-text-secondary" dateTime={l.createdAt.toISOString()}>
                {l.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
              </time>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">Recently edited products</h2>
        <ul className="divide-y divide-white/10 rounded-card border border-white/10">
          {recent.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link href={`/admin/products/${o.id}`} className="hover:text-brand-sky">
                {o.translations[0]?.name ?? "(untitled)"}
              </Link>
              <time className="text-xs text-text-secondary" dateTime={o.updatedAt.toISOString()}>
                {o.updatedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
