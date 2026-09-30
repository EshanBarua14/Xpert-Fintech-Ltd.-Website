import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { PersonForm } from "@/components/admin/PersonForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toPersonFormValues } from "@/lib/admin/people";
import { deletePersonForever, restorePerson, trashPerson } from "../actions";

export default async function EditPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const flags = await searchParams;

  const person = await db.person.findUnique({
    where: { id },
    include: { translations: true, roles: { include: { translations: true } } },
  });
  if (!person) notFound();
  const name = person.translations.find((t) => t.locale === "en")?.name ?? "Unnamed";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/people" className="text-sm text-text-secondary hover:text-brand-sky">
          ← People
        </Link>
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {name}
          <StatusBadge status={person.status} publishAt={person.publishAt} deletedAt={person.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(person.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!person.deletedAt && <PersonForm values={toPersonFormValues(person)} images={await imageOptions()} />}
      <TrashControls
        id={person.id}
        inTrash={Boolean(person.deletedAt)}
        noun="person"
        onTrash={trashPerson}
        onRestore={restorePerson}
        onDelete={deletePersonForever}
      />
    </div>
  );
}
