import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ResourceForm, type ResourceFormValues } from "@/components/admin/ResourceForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { documentOptions, imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { deleteResourceForever, restoreResource, trashResource } from "../actions";

const emptyText = { title: "", slug: "", summary: "" };

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [images, documents] = await Promise.all([imageOptions(), documentOptions()]);
  const back = (
    <Link href="/admin/resources" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Resources
    </Link>
  );
  if (id === "new") {
    const values: ResourceFormValues = { status: "DRAFT", publishAt: "", sortOrder: 0, kind: "BROCHURE", fileMediaId: "", externalUrl: "", coverMediaId: "", en: { ...emptyText }, bn: { ...emptyText } };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New resource</h1>
        <ResourceForm values={values} images={images} documents={documents} />
      </div>
    );
  }
  if (!z.string().uuid().safeParse(id).success) notFound();
  const r = await db.resource.findUnique({ where: { id }, include: { translations: true } });
  if (!r) notFound();
  const text = (l: string) => {
    const t = r.translations.find((x) => x.locale === l);
    return t ? { title: t.title, slug: t.slug, summary: t.summary ?? "" } : { ...emptyText };
  };
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled resource"}
          <StatusBadge status={r.status} publishAt={r.publishAt} deletedAt={r.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(r.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!r.deletedAt && (
        <ResourceForm
          images={images}
          documents={documents}
          values={{
            id: r.id, status: r.status, publishAt: toLocalInput(r.publishAt), sortOrder: r.sortOrder, kind: r.kind,
            fileMediaId: r.fileMediaId ?? "", externalUrl: r.externalUrl ?? "", coverMediaId: r.coverMediaId ?? "", en: text("en"), bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={r.id} inTrash={Boolean(r.deletedAt)} noun="resource" onTrash={trashResource} onRestore={restoreResource} onDelete={deleteResourceForever} />
    </div>
  );
}
