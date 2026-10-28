import Link from "next/link";
import type { CSSProperties } from "react";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { contentTodos } from "@/lib/admin/todo";
import { Icon } from "@/components/ui/Icon";
import { AdminCount, Greeting, LiveRefresh, ProgressRing } from "@/components/admin/AdminMotion";

type Stat = { label: string; value: number; href?: string; note?: string; icon: string; tone: string };

const DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requireAdmin();
  const { denied } = await searchParams;
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
    todos,
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
    contentTodos(),
  ]);
  // Website enquiries per day, last 14 days (Dhaka time), for the trend bars.
  const since = new Date(Date.now() - 13 * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const leadDates = await db.lead.findMany({ where: { deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true } });
  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const days = Array.from({ length: 14 }, (_, i) => new Date(since.getTime() + i * DAY));
  const perDay = days.map((d) => ({ key: dayKey(d), label: d.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" }), n: 0 }));
  for (const l of leadDates) {
    const slot = perDay.find((x) => x.key === dayKey(l.createdAt));
    if (slot) slot.n++;
  }
  const peak = Math.max(1, ...perDay.map((x) => x.n));
  const leads14 = perDay.reduce((a, x) => a + x.n, 0);
  const open = todos.filter((x) => !x.done);

  const stats: Stat[] = [
    { label: "New leads", value: newLeads, href: "/admin/leads?status=NEW", icon: "mail", tone: "#22bceb" },
    { label: "Follow-ups due", value: followUpsDue, href: "/admin/leads", icon: "calendar", tone: "#f0c66e" },
    { label: "Products published", value: productsLive, href: "/admin/products?status=PUBLISHED", icon: "bolt", tone: "#67e8f9" },
    { label: "Products in draft", value: productsDraft, href: "/admin/products?status=DRAFT", icon: "document", tone: "#8fb4ff" },
    { label: "Pages", value: pages, href: "/admin/pages", icon: "document", tone: "#8fb4ff" },
    { label: "Consortium members", value: members, href: "/admin/organizations?kind=CONSORTIUM_MEMBER", icon: "building", tone: "#f0c66e" },
    { label: "App deployments", value: deployments, href: "/admin/deployments", icon: "phone", tone: "#22bceb" },
    { label: "Events", value: events, href: "/admin/events", icon: "calendar", tone: "#67e8f9" },
    { label: "Media files", value: media, href: "/admin/media", icon: "image", tone: "#8fb4ff" },
  ];
  const quick =
    admin.role === "ADMIN"
      ? [
          { href: "/admin/pages/new", label: "New page", icon: "document" },
          { href: "/admin/products/new", label: "New product", icon: "bolt" },
          { href: "/admin/news/new", label: "New article", icon: "newspaper" },
          { href: "/admin/people/new", label: "New person", icon: "users" },
          { href: "/admin/media", label: "Upload media", icon: "cloud" },
        ]
      : [
          { href: "/admin/pages", label: "Edit pages", icon: "document" },
          { href: "/admin/site-text", label: "Edit site text", icon: "document" },
          { href: "/admin/people", label: "Edit people", icon: "users" },
          { href: "/admin/media", label: "Upload media", icon: "cloud" },
        ];

  return (
    <div className="flex flex-col gap-10">
      <div className="admin-card flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="flex flex-col gap-2">
          <Greeting name={admin.name} />
          <p className="text-text-secondary">
            Here is the website at a glance. You are signed in as {admin.role === "ADMIN" ? "an admin" : "an editor"}.
          </p>
          <LiveRefresh seconds={60} />
          {denied && (
            <p role="alert" className="mt-2 rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
              Editors can edit existing content, but only an admin can create, delete, trash or restore it, or manage users and backups.
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="admin-card admin-card-hover flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
                <Icon name={q.icon} className="size-4 text-brand-sky" />
                {q.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ul className="admin-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <li key={s.label} style={{ "--i": i } as CSSProperties}>
            <Link href={s.href ?? "/admin"} className="admin-card flex h-full items-center gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${s.tone}22`, color: s.tone, boxShadow: `0 0 24px -6px ${s.tone}88` }}>
                <Icon name={s.icon} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-3xl font-semibold">
                  <AdminCount value={s.value} />
                </span>
                <span className="text-sm text-text-secondary">{s.label}</span>
                {s.note && <span className="text-xs text-text-secondary/70">{s.note}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="admin-card flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Website enquiries, last 14 days</h2>
          <span className="text-sm text-text-secondary">
            <span className="tabular font-semibold text-text-primary">{leads14}</span> in total
          </span>
        </div>
        <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Leads per day: ${perDay.map((d) => `${d.label} ${d.n}`).join(", ")}`}>
          {perDay.map((d, i) => (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label}: ${d.n}`}>
              {d.n > 0 && <span className="tabular text-[10px] text-text-secondary">{d.n}</span>}
              <span
                className="admin-bar w-full rounded-t-md bg-linear-to-t from-brand-royal to-brand-sky"
                style={{ height: `${Math.max(4, (d.n / peak) * 100)}%`, opacity: d.n ? 1 : 0.25, "--i": i } as CSSProperties}
              />
              <span className="text-[10px] text-text-secondary">{i % 2 === 0 ? d.label : "\u00a0"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <ProgressRing done={todos.length - open.length} total={todos.length} />
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-semibold">Still to add to the website</h2>
            <span className="text-sm text-text-secondary">
              {todos.length - open.length} of {todos.length} done. Each item ticks itself off once the content is added and published.
            </span>
          </div>
        </div>
        <ul className="admin-stagger grid gap-2 md:grid-cols-2">
          {todos.map((x, i) => (
            <li key={x.label} style={{ "--i": i } as CSSProperties}>
              <Link href={x.href} className="admin-card flex h-full items-start gap-3 p-4">
                <span aria-hidden="true" className={x.done ? "mt-0.5 text-market-up" : "mt-0.5 text-gold"}>{x.done ? "✓" : "○"}</span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">{x.label}</span>
                  <span className="text-sm text-text-secondary">{x.detail}</span>
                </span>
                <span className="sr-only">{x.done ? "Done" : "To do"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">Latest leads</h2>
          <Link href="/admin/leads" className="text-sm text-text-secondary hover:text-brand-sky">
            All leads →
          </Link>
        </div>
        <ul className="admin-card divide-y divide-fg/10">
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
        <ul className="admin-card divide-y divide-fg/10">
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

export const dynamic = "force-dynamic";
