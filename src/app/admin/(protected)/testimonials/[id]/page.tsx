import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { TestimonialForm, type TestimonialFormValues } from "@/components/admin/TestimonialForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { deleteTestimonialForever, restoreTestimonial, trashTestimonial } from "../actions";

async function organizationOptions() {
  const rows = await db.organization.findMany({
    where: { deletedAt: null },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    include: { translations: { where: { locale: "en" } } },
  });
  return rows.map((o) => ({ value: o.id, label: o.translations[0]?.name ?? "(unnamed)" }));
}

export default async function TestimonialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [images, organizations] = await Promise.all([imageOptions(), organizationOptions()]);
  const back = (
    <Link href="/admin/testimonials" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Testimonials
    </Link>
  );
  if (id === "new") {
    const values: TestimonialFormValues = {
      status: "DRAFT",
      publishAt: "",
      sortOrder: 0,
      personName: "",
      organizationId: "",
      photoMediaId: "",
      hasApproval: false,
      en: { role: "", quote: "" },
      bn: { role: "", quote: "" },
    };
    return (
      <div className="flex flex-col gap-6">
        {back}
        <h1 className="font-display text-3xl font-semibold">New testimonial</h1>
        <TestimonialForm values={values} images={images} organizations={organizations} />
      </div>
    );
  }
  if (!z.string().uuid().safeParse(id).success) notFound();
  const row = await db.testimonial.findUnique({ where: { id }, include: { translations: true } });
  if (!row) notFound();
  const text = (l: string) => {
    const t = row.translations.find((x) => x.locale === l);
    return { role: t?.personTitle ?? "", quote: t?.quote ?? "" };
  };
  return (
    <div className="flex flex-col gap-8">
      <div>
        {back}
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {row.personName}
          <StatusBadge status={row.status} publishAt={row.publishAt} deletedAt={row.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(row.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!row.deletedAt && (
        <TestimonialForm
          images={images}
          organizations={organizations}
          values={{
            id: row.id,
            status: row.status,
            publishAt: toLocalInput(row.publishAt),
            sortOrder: row.sortOrder,
            personName: row.personName,
            organizationId: row.organizationId ?? "",
            photoMediaId: row.photoMediaId ?? "",
            hasApproval: row.hasApproval,
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={row.id} inTrash={Boolean(row.deletedAt)} noun="testimonial" onTrash={trashTestimonial} onRestore={restoreTestimonial} onDelete={deleteTestimonialForever} />
    </div>
  );
}
