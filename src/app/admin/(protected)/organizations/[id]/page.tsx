import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { OrganizationForm, type OrgFormValues } from "@/components/admin/OrganizationForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { imageOptions } from "@/lib/admin/media";
import { toLocalInput } from "@/lib/validation/common";
import { deleteOrganizationForever, restoreOrganization, trashOrganization } from "../actions";

const emptyText = { name: "", shortName: "", description: "" };

export default async function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const images = await imageOptions();

  if (id === "new") {
    const values: OrgFormValues = {
      kind: "CONSORTIUM_MEMBER",
      status: "DRAFT",
      publishAt: "",
      sortOrder: 0,
      websiteUrl: "",
      logoMediaId: "",
      logoPermission: false,
      en: { ...emptyText },
      bn: { ...emptyText },
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New organization</h1>
        <OrganizationForm values={values} images={images} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const org = await db.organization.findUnique({
    where: { id },
    include: { translations: true, deployments: { where: { deletedAt: null }, select: { id: true, appName: true } } },
  });
  if (!org) notFound();
  const t = (l: string) => org.translations.find((x) => x.locale === l);
  const text = (l: string) => ({
    name: t(l)?.name ?? "",
    shortName: t(l)?.shortName ?? "",
    description: t(l)?.description ?? "",
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {t("en")?.name ?? "Unnamed"}
          <StatusBadge status={org.status} publishAt={org.publishAt} deletedAt={org.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(org.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!org.deletedAt && (
        <>
          <OrganizationForm
            images={images}
            values={{
              id: org.id,
              kind: org.kind,
              status: org.status,
              publishAt: toLocalInput(org.publishAt),
              sortOrder: org.sortOrder,
              websiteUrl: org.websiteUrl ?? "",
              logoMediaId: org.logoMediaId ?? "",
              logoPermission: org.logoPermission,
              en: text("en"),
              bn: text("bn"),
            }}
          />
          {org.deployments.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-semibold">Apps</h2>
              <ul className="flex flex-wrap gap-2 text-sm">
                {org.deployments.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/deployments/${d.id}`} className="rounded-control border border-fg/10 px-3 py-1.5 hover:border-brand-sky">
                      {d.appName ?? "Unnamed app"}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <TrashControls
        id={org.id}
        inTrash={Boolean(org.deletedAt)}
        noun="organization"
        onTrash={trashOrganization}
        onRestore={restoreOrganization}
        onDelete={deleteOrganizationForever}
      />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/organizations" className="text-sm text-text-secondary hover:text-brand-sky">
      ← Organizations
    </Link>
  );
}
