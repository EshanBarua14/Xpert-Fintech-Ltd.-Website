import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formatDhaka } from "@/components/admin/AdminList";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 50;
const VERB: Record<string, string> = { create: "Created", createMany: "Created", update: "Updated", updateMany: "Updated", upsert: "Saved", delete: "Deleted", deleteMany: "Deleted" };
const NAME: Record<string, string> = {
  Offering: "product", Page: "page", PageSection: "page section", ContentBlock: "content block", Organization: "organisation", Deployment: "app deployment",
  CaseStudy: "case study", Person: "person", PersonRole: "person's role", Career: "job", CareerApplication: "job application", Article: "news story",
  ArticleCategory: "news category", Event: "event", Resource: "resource", Album: "photo album", Video: "video", Lead: "lead", Media: "media file",
  NavItem: "menu link", NavMenu: "menu", SiteSetting: "setting", Office: "office", AdminUser: "admin", MarketShare: "market-share figure",
  MarketDataSource: "market data source", EcosystemNode: "ecosystem node", EcosystemEdge: "ecosystem link", EcosystemFlow: "ecosystem flow",
  Redirect: "redirect", SeoMetadata: "SEO settings", OfferingItem: "product item", OfferingMedia: "product media",
};
const LINK: Record<string, string> = {
  Offering: "/admin/products/", Page: "/admin/pages/", Organization: "/admin/organizations/", Deployment: "/admin/deployments/", CaseStudy: "/admin/case-studies/",
  Person: "/admin/people/", Career: "/admin/careers/", CareerApplication: "/admin/applications/", Article: "/admin/news/", Event: "/admin/events/",
  Resource: "/admin/resources/", Album: "/admin/albums/", Video: "/admin/videos/", Lead: "/admin/leads/", Media: "/admin/media/",
  EcosystemNode: "/admin/ecosystem/nodes/", EcosystemFlow: "/admin/ecosystem/flows/",
};

type Search = { actor?: string; area?: string; page?: string };

/** Who changed what, and when: every admin create, update and delete. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(params.actor && { actorId: params.actor }),
    ...(params.area && { action: { startsWith: `${params.area}.` } }),
  };
  const [rows, total, admins] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.auditLog.count({ where }),
    db.adminUser.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);
  const who = new Map<string, { id: string; name: string; email: string }>(admins.map((a) => [a.id, a]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: Partial<Search>) => {
    const q = new URLSearchParams();
    const next = { ...params, ...p };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, String(v));
    return `/admin/audit${q.size ? `?${q}` : ""}`;
  };
  const areas = Object.keys(NAME).sort((a, b) => NAME[a]!.localeCompare(NAME[b]!));

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Activity log</h1>
        <p className="mt-1 text-sm text-text-secondary">Every change an admin makes, newest first: who, what, which record and which fields. Kept for reference; it cannot be edited.</p>
      </div>
      <form className="flex flex-wrap items-end gap-3 text-sm" action="/admin/audit">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Admin</span>
          <select name="actor" defaultValue={params.actor ?? ""} className="h-10 rounded-control border border-fg/15 bg-ink-950/60 px-3">
            <option value="">Everyone</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Area</span>
          <select name="area" defaultValue={params.area ?? ""} className="h-10 rounded-control border border-fg/15 bg-ink-950/60 px-3">
            <option value="">Everything</option>
            {areas.map((m) => (
              <option key={m} value={m}>
                {NAME[m]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-10 rounded-control border border-fg/15 px-4 hover:border-brand-sky">
          Filter
        </button>
        <span className="ml-auto text-xs text-text-secondary">{total.toLocaleString("en-US")} entries</span>
      </form>
      <div className="overflow-x-auto rounded-card border border-fg/10">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-fg/10 text-xs tracking-wide text-text-secondary uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">What</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fg/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-text-secondary">
                  Nothing recorded yet.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const [model = "", op = ""] = r.action.split(".");
              const actor = r.actorId ? who.get(r.actorId) : undefined;
              const c = (r.changes ?? {}) as { fields?: string[]; values?: Record<string, unknown>; count?: number };
              const link = r.entityId && LINK[model] && !op.startsWith("delete") ? `${LINK[model]}${r.entityId}` : null;
              const trashed = c.values && "deletedAt" in c.values ? (c.values.deletedAt ? "moved to trash" : "restored") : null;
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{formatDhaka(r.createdAt)}</td>
                  <td className="px-4 py-3">{actor ? actor.name : <span className="text-text-secondary">(removed admin)</span>}</td>
                  <td className="px-4 py-3">
                    <span className={cn(op.startsWith("delete") && "text-market-down")}>{trashed ? `${NAME[model] ?? model} ${trashed}` : `${VERB[op] ?? op} ${NAME[model] ?? model}`}</span>
                    {link && (
                      <Link href={link} className="ml-2 text-xs text-brand-sky hover:underline">
                        Open
                      </Link>
                    )}
                    {typeof c.count === "number" && op.endsWith("Many") && <span className="ml-2 text-xs text-text-secondary">({c.count})</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {c.values &&
                      Object.entries(c.values).map(([k, v]) => (
                        <span key={k} className="mr-3 inline-block">
                          {k}: <span className="text-text-primary">{v === null ? "—" : String(v)}</span>
                        </span>
                      ))}
                    {c.fields && c.fields.length > 0 && <span className="block">Fields: {c.fields.filter((f) => !f.endsWith("ById")).join(", ")}</span>}
                    {r.ip && <span className="block font-mono">{r.ip}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm" aria-label="Pages">
          {page > 1 && <Link href={href({ page: String(page - 1) })}>← Newer</Link>}
          <span className="text-text-secondary">
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={href({ page: String(page + 1) })}>Older →</Link>}
        </nav>
      )}
    </div>
  );
}
