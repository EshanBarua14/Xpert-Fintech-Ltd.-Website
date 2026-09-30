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
  ]);

  const stats: Stat[] = [
    { label: "Products published", value: productsLive, href: "/admin/products?status=PUBLISHED" },
    { label: "Products in draft", value: productsDraft, href: "/admin/products?status=DRAFT" },
    { label: "Pages", value: pages },
    { label: "Consortium members", value: members, href: "/admin/organizations?kind=CONSORTIUM_MEMBER" },
    { label: "App deployments", value: deployments, href: "/admin/deployments" },
    { label: "Events", value: events, href: "/admin/events" },
    { label: "New leads", value: newLeads, note: "Lead inbox arrives with the demo form" },
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
