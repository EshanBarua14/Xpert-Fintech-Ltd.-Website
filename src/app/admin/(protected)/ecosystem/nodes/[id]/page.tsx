import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ConfirmButton, StatusBadge } from "@/components/admin/AdminUi";
import { Notice } from "@/components/admin/AdminList";
import { EdgeForm, NodeForm, type NodeFormValues } from "@/components/admin/EcosystemForms";
import { toLocalInput } from "@/lib/validation/common";
import { deleteEdge, deleteNode } from "../../actions";

const KIND = { DATA: "Market data", ORDER: "Orders", ONBOARDING: "Onboarding", RISK: "Risk", OPERATIONS: "Operations" } as const;
const empty = { label: "", description: "", cta: "" };

export default async function NodePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [offerings, allNodes] = await Promise.all([
    db.offering.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { translations: { where: { locale: "en" } } } }),
    db.ecosystemNode.findMany({ orderBy: [{ mobileOrder: "asc" }], include: { translations: { where: { locale: "en" } } } }),
  ]);
  const offeringOpts = offerings.map((o) => ({ value: o.id, label: `${o.translations[0]?.name ?? o.key ?? "?"}${o.status === "PUBLISHED" ? "" : " (draft)"}` }));
  const back = (
    <Link href="/admin/ecosystem" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Ecosystem
    </Link>
  );
  if (id === "new") {
    const values: NodeFormValues = { key: "", layer: "PRODUCT", status: "DRAFT", publishAt: "", offeringId: "", mobileOrder: 50, editorNote: "", en: { ...empty }, bn: { ...empty } };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New node</h1>
        <NodeForm values={values} offerings={offeringOpts} />
      </div>
    );
  }
  const node = await db.ecosystemNode.findUnique({
    where: { id },
    include: {
      translations: true,
      outgoing: { include: { to: { include: { translations: { where: { locale: "en" } } } } } },
      incoming: { include: { from: { include: { translations: { where: { locale: "en" } } } } } },
    },
  });
  if (!node) notFound();
  const tr = (l: string) => {
    const t = node.translations.find((x) => x.locale === l);
    return t ? { label: t.label, description: t.description ?? "", cta: t.ctaLabel ?? "" } : { ...empty };
  };
  const nameOf = (n: { key: string; translations: { label: string }[] }) => n.translations[0]?.label ?? n.key;
  const links = [
    ...node.outgoing.map((e) => ({ id: e.id, text: `→ ${nameOf(e.to)}`, kind: e.kind })),
    ...node.incoming.map((e) => ({ id: e.id, text: `← ${nameOf(e.from)}`, kind: e.kind })),
  ];
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {tr("en").label || node.key}
          <StatusBadge status={node.status} publishAt={node.publishAt} deletedAt={node.deletedAt} />
        </h1>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      <NodeForm
        offerings={offeringOpts}
        values={{
          id: node.id,
          key: node.key,
          layer: node.layer,
          status: node.status,
          publishAt: toLocalInput(node.publishAt),
          offeringId: node.offeringId ?? "",
          mobileOrder: node.mobileOrder,
          editorNote: node.editorNote ?? "",
          en: tr("en"),
          bn: tr("bn"),
        }}
      />
      <section className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
        <h2 className="font-display text-xl font-semibold">Links</h2>
        <p className="text-xs text-text-secondary">Links show what works with what: on phones they appear as “Works with”. A link to an unpublished node is hidden on the website.</p>
        {links.length === 0 ? (
          <p className="text-sm text-text-secondary">No links yet.</p>
        ) : (
          <ul className="divide-y divide-fg/10">
            {links.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {l.text} <span className="ml-2 text-xs text-text-secondary">{KIND[l.kind]}</span>
                </span>
                <form action={deleteEdge}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="nodeId" value={node.id} />
                  <ConfirmButton message="Remove this link?" className="text-xs text-text-secondary hover:text-market-down">
                    Remove
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <EdgeForm nodeId={node.id} nodes={allNodes.filter((n) => n.id !== node.id).map((n) => ({ value: n.id, label: nameOf(n) }))} />
      </section>
      <form action={deleteNode} className="flex items-center justify-between gap-4 border-t border-fg/10 pt-6 text-sm text-text-secondary">
        <span>Delete removes the node, its links and its steps in every flow. To hide it for now, set it to Draft instead.</span>
        <input type="hidden" name="id" value={node.id} />
        <ConfirmButton message="Delete this node, its links and its flow steps permanently?" className="text-market-down hover:underline">
          Delete node
        </ConfirmButton>
      </form>
    </div>
  );
}
