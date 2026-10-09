import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { CareerForm, type CareerFormValues } from "@/components/admin/CareerForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { APPLICATION_STATUSES, labelOf } from "@/lib/admin/labels";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteCareerForever, restoreCareer, trashCareer } from "../actions";

const emptyText = { title: "", slug: "", summary: "", about: "", responsibilities: "", requirements: "", benefits: "" };

export default async function CareerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;

  if (id === "new") {
    const values: CareerFormValues = {
      status: "DRAFT", publishAt: "", sortOrder: 0, department: "", location: "Dhaka", employmentType: "FULL_TIME",
      experience: "", deadline: "", isClosed: false, linkedinUrl: "", bdjobsUrl: "", applyEmail: "career@xpertfintech.com", en: { ...emptyText }, bn: { ...emptyText },
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New job</h1>
        <CareerForm values={values} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const job = await db.career.findUnique({
    where: { id },
    include: { translations: true, applications: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
  });
  if (!job) notFound();
  const text = (l: string) => {
    const t = job.translations.find((x) => x.locale === l);
    return t
      ? { title: t.title, slug: t.slug, summary: t.summary ?? "", about: t.about ?? "", responsibilities: t.responsibilities ?? "", requirements: t.requirements ?? "", benefits: t.benefits ?? "" }
      : { ...emptyText };
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled job"}
          <StatusBadge status={job.status} publishAt={job.publishAt} deletedAt={job.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(job.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}

      <section className="flex flex-col gap-3 rounded-card border border-fg/10 p-5">
        <h2 className="font-semibold">Applications ({job.applications.length})</h2>
        {job.applications.length === 0 ? (
          <p className="text-sm text-text-secondary">No applications yet.</p>
        ) : (
          <ul className="divide-y divide-fg/10 text-sm">
            {job.applications.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5 hover:text-brand-sky">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-text-secondary">
                    {labelOf(APPLICATION_STATUSES, a.status)} · {formatDhaka(a.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!job.deletedAt && (
        <CareerForm
          values={{
            id: job.id,
            status: job.status,
            publishAt: toLocalInput(job.publishAt),
            sortOrder: job.sortOrder,
            department: job.department ?? "",
            location: job.location ?? "",
            employmentType: job.employmentType,
            experience: job.experience ?? "",
            deadline: toDateInput(job.deadline),
            isClosed: job.isClosed,
            linkedinUrl: job.linkedinUrl ?? "",
            bdjobsUrl: job.bdjobsUrl ?? "",
            applyEmail: job.applyEmail ?? "",
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls id={job.id} inTrash={Boolean(job.deletedAt)} noun="job" onTrash={trashCareer} onRestore={restoreCareer} onDelete={deleteCareerForever} />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/careers" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Careers
    </Link>
  );
}
