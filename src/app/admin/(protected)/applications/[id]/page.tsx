import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { ApplicationReview } from "@/components/admin/ApplicationReview";
import { deleteApplicationForever, restoreApplication, trashApplication } from "../../careers/actions";

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ restored?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const app = await db.careerApplication.findUnique({ where: { id }, include: { career: { include: { translations: true } } } });
  if (!app) notFound();
  const cv = app.cvMediaId ? await db.media.findUnique({ where: { id: app.cvMediaId }, select: { storageKey: true, originalName: true, sizeBytes: true } }) : null;
  const job = app.career.translations.find((t) => t.locale === "en")?.title ?? "Job";

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <Link href="/admin/applications" className="text-sm text-text-secondary hover:text-brand-sky">
          ← Applications
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{app.name}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Applied for{" "}
          <Link href={`/admin/careers/${app.careerId}`} className="text-brand-sky hover:underline">
            {job}
          </Link>{" "}
          · {formatDhaka(app.createdAt)}
        </p>
      </div>
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      <dl className="grid gap-4 rounded-card border border-fg/10 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-secondary">Email</dt>
          <dd>
            <a href={`mailto:${app.email}`} className="text-brand-sky hover:underline">
              {app.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Phone</dt>
          <dd>{app.phone ? <a href={`tel:${app.phone}`} className="text-brand-sky hover:underline">{app.phone}</a> : "—"}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">CV</dt>
          <dd>
            {cv ? (
              <a href={`/media/${cv.storageKey}`} target="_blank" rel="noopener noreferrer" className="text-brand-sky hover:underline">
                {cv.originalName} ({Math.round(cv.sizeBytes / 1024)} KB) ↗
              </a>
            ) : (
              "Not attached"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Consent to store data</dt>
          <dd>{app.consent ? "Given" : "Not given"}</dd>
        </div>
        {app.coverLetter && (
          <div className="sm:col-span-2">
            <dt className="text-text-secondary">Cover letter</dt>
            <dd className="mt-1 whitespace-pre-line">{app.coverLetter}</dd>
          </div>
        )}
      </dl>
      {!app.deletedAt && <ApplicationReview id={app.id} status={app.status} notes={app.adminNotes ?? ""} />}
      <TrashControls id={app.id} inTrash={Boolean(app.deletedAt)} noun="application" onTrash={trashApplication} onRestore={restoreApplication} onDelete={deleteApplicationForever} />
    </div>
  );
}
