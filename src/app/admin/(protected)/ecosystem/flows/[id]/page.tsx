import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ConfirmButton, StatusBadge } from "@/components/admin/AdminUi";
import { Notice } from "@/components/admin/AdminList";
import { FlowForm, type FlowFormValues } from "@/components/admin/EcosystemForms";
import { toLocalInput } from "@/lib/validation/common";
import { deleteFlow } from "../../actions";

export default async function FlowPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const nodes = await db.ecosystemNode.findMany({ orderBy: [{ mobileOrder: "asc" }], include: { translations: { where: { locale: "en" } } } });
  const nodeOpts = nodes.map((n) => ({ value: n.id, label: `${n.translations[0]?.label ?? n.key}${n.status === "PUBLISHED" ? "" : " (draft — skipped on the website)"}` }));
  const back = (
    <Link href="/admin/ecosystem" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Ecosystem
    </Link>
  );
  if (id === "new") {
    const values: FlowFormValues = { key: "", status: "DRAFT", publishAt: "", isPlayback: false, enName: "", bnName: "", steps: [] };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New flow</h1>
        <FlowForm values={values} nodes={nodeOpts} />
      </div>
    );
  }
  const flow = await db.ecosystemFlow.findUnique({ where: { id }, include: { translations: true, steps: { orderBy: { sortOrder: "asc" }, include: { translations: true } } } });
  if (!flow) notFound();
  const name = (l: string) => flow.translations.find((t) => t.locale === l)?.name ?? "";
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {name("en") || flow.key}
          <StatusBadge status={flow.status} publishAt={flow.publishAt} deletedAt={flow.deletedAt} />
        </h1>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      <FlowForm
        nodes={nodeOpts}
        values={{
          id: flow.id,
          key: flow.key,
          status: flow.status,
          publishAt: toLocalInput(flow.publishAt),
          isPlayback: flow.isPlayback,
          enName: name("en"),
          bnName: name("bn"),
          steps: flow.steps.map((s) => {
            const t = (l: string) => s.translations.find((x) => x.locale === l);
            return { nodeId: s.nodeId, enTitle: t("en")?.title ?? "", enBody: t("en")?.body ?? "", bnTitle: t("bn")?.title ?? "", bnBody: t("bn")?.body ?? "" };
          }),
        }}
      />
      <form action={deleteFlow} className="flex items-center justify-between gap-4 border-t border-fg/10 pt-6 text-sm text-text-secondary">
        <span>To hide this flow for now, set it to Draft instead.</span>
        <input type="hidden" name="id" value={flow.id} />
        <ConfirmButton message="Delete this flow permanently?" className="text-market-down hover:underline">
          Delete flow
        </ConfirmButton>
      </form>
    </div>
  );
}
