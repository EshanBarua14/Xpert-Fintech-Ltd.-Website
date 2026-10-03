import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { CaseStudyForm, type CaseStudyFormValues } from "@/components/admin/CaseStudyForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { deleteCaseStudyForever, restoreCaseStudy, trashCaseStudy } from "../actions";

const emptyText = { title: "", slug: "", summary: "", challenge: "", solution: "", outcome: "" };

export default async function CaseStudyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const images = await imageOptions();
  const back = (
    <Link href="/admin/case-studies" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Case studies
    </Link>
  );
  if (id === "new") {
    const values: CaseStudyFormValues = { status: "DRAFT", publishAt: "", sortOrder: 0, coverMediaId: "", en: { ...emptyText }, bn: { ...emptyText } };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New case study</h1>
        <CaseStudyForm values={values} images={images} />
      </div>
    );
  }
  if (!z.string().uuid().safeParse(id).success) notFound();
  const c = await db.caseStudy.findUnique({ where: { id }, include: { translations: true } });
  if (!c) notFound();
  const text = (l: string) => {
    const t = c.translations.find((x) => x.locale === l);
    return t
      ? { title: t.title, slug: t.slug, summary: t.summary ?? "", challenge: t.challenge ?? "", solution: t.solution ?? "", outcome: t.outcome ?? "" }
      : { ...emptyText };
  };
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled case study"}
          <StatusBadge status={c.status} publishAt={c.publishAt} deletedAt={c.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(c.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!c.deletedAt && (
        <CaseStudyForm
          images={images}
          values={{ id: c.id, status: c.status, publishAt: toLocalInput(c.publishAt), sortOrder: c.sortOrder, coverMediaId: c.coverMediaId ?? "", en: text("en"), bn: text("bn") }}
        />
      )}
      <TrashControls id={c.id} inTrash={Boolean(c.deletedAt)} noun="case study" onTrash={trashCaseStudy} onRestore={restoreCaseStudy} onDelete={deleteCaseStudyForever} />
    </div>
  );
}
