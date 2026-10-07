import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { StatusBadge } from "@/components/admin/AdminUi";
import { Notice } from "@/components/admin/AdminList";
import { buttonClasses } from "@/components/ui/Button";

const LAYER = { MARKET: "Market infrastructure", XFL: "Xpert Fintech", PRODUCT: "Products", INSTITUTION: "Institutions", USER: "Investors and teams" } as const;

export default async function EcosystemAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const flags = await searchParams;
  const nodes = await db.ecosystemNode.findMany({
    orderBy: [{ mobileOrder: "asc" }, { sortOrder: "asc" }],
    include: { translations: true, _count: { select: { outgoing: true, incoming: true } } },
  });
  const offeringIds = nodes.map((n) => n.offeringId).filter((x): x is string => Boolean(x));
  const offerings = await db.offering.findMany({ where: { id: { in: offeringIds } }, select: { id: true, status: true, deletedAt: true, translations: { where: { locale: "en" }, select: { name: true } } } });
  type OfferingSummary = { id: string; status: string; deletedAt: Date | null; translations: { name: string }[] };
  const offeringById = new Map<string, OfferingSummary>(offerings.map((o) => [o.id, o]));

  return (
    <div className="flex max-w-6xl flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Ecosystem</h1>
          <p className="mt-1 max-w-3xl text-sm text-text-secondary">
            What the ecosystem map and its phone layout show. Publish a node to show it; a product node links to its page once the product is
            published (for example eKYC stays hidden until it launches).
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ecosystem/nodes/new" className={buttonClasses({ variant: "secondary" })}>
            New node
          </Link>
        </div>
      </div>
      {flags.deleted && <Notice>Deleted.</Notice>}
      {nodes.length === 0 && (
        <Notice>
          No ecosystem yet. Run <code>npm run db:seed:content</code> once to load the starting nodes and links, then edit them here.
        </Notice>
      )}


      {(Object.keys(LAYER) as (keyof typeof LAYER)[]).map((layer) => {
        const list = nodes.filter((n) => n.layer === layer);
        if (!list.length) return null;
        return (
          <section key={layer} className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold">{LAYER[layer]}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((n) => {
                const off = n.offeringId ? offeringById.get(n.offeringId) : null;
                return (
                  <li key={n.id}>
                    <Link href={`/admin/ecosystem/nodes/${n.id}`} className="flex h-full flex-col gap-2 rounded-card border border-fg/10 p-4 hover:border-brand-sky/50">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{n.translations.find((t) => t.locale === "en")?.label ?? n.key}</span>
                        <StatusBadge status={n.status} publishAt={n.publishAt} deletedAt={n.deletedAt} />
                      </span>
                      <span className="font-mono text-xs text-text-secondary">{n.key}</span>
                      <span className="text-xs text-text-secondary">
                        {n._count.outgoing + n._count.incoming} link(s)
                        {off && ` · product: ${off.translations[0]?.name ?? "?"}${off.status !== "PUBLISHED" || off.deletedAt ? " (not published)" : ""}`}
                        {!n.translations.some((t) => t.locale === "bn") && " · no Bangla yet"}
                      </span>
                      {n.editorNote && <span className="text-xs text-gold">Note: {n.editorNote}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
