import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { organizationOptions } from "@/lib/admin/options";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteEventForever, restoreEvent, trashEvent } from "../actions";

const emptyText = { title: "", slug: "", summary: "", body: "", location: "" };

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [images, organizations] = await Promise.all([imageOptions(), organizationOptions()]);

  if (id === "new") {
    const values: EventFormValues = {
      status: "DRAFT",
      publishAt: "",
      sortOrder: 0,
      startsAt: "",
      endsAt: "",
      dateIsApprox: false,
      coverMediaId: "",
      videoUrl: "",
      legacyUrl: null,
      participants: [],
      en: { ...emptyText },
      bn: { ...emptyText },
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New event</h1>
        <EventForm values={values} images={images} organizations={organizations} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const ev = await db.event.findUnique({
    where: { id },
    include: { translations: true, organizations: { orderBy: { sortOrder: "asc" } } },
  });
  if (!ev) notFound();
  const text = (l: string) => {
    const t = ev.translations.find((x) => x.locale === l);
    return t
      ? { title: t.title, slug: t.slug, summary: t.summary ?? "", body: t.body ?? "", location: t.location ?? "" }
      : { ...emptyText };
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {text("en").title || "Untitled event"}
          <StatusBadge status={ev.status} publishAt={ev.publishAt} deletedAt={ev.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(ev.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!ev.deletedAt && (
        <EventForm
          images={images}
          organizations={organizations}
          values={{
            id: ev.id,
            status: ev.status,
            publishAt: toLocalInput(ev.publishAt),
            sortOrder: ev.sortOrder,
            startsAt: toDateInput(ev.startsAt),
            endsAt: toDateInput(ev.endsAt),
            dateIsApprox: ev.dateIsApprox,
            coverMediaId: ev.coverMediaId ?? "",
            videoUrl: ev.videoUrl ?? "",
            legacyUrl: ev.legacyUrl,
            participants: ev.organizations.map((o) => o.organizationId),
            en: text("en"),
            bn: text("bn"),
          }}
        />
      )}
      <TrashControls
        id={ev.id}
        inTrash={Boolean(ev.deletedAt)}
        noun="event"
        onTrash={trashEvent}
        onRestore={restoreEvent}
        onDelete={deleteEventForever}
      />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/events" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Events
    </Link>
  );
}
