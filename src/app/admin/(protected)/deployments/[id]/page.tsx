import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { DeploymentForm, type DeploymentFormValues } from "@/components/admin/DeploymentForm";
import { StatusBadge } from "@/components/admin/AdminUi";
import { formatDhaka, Notice } from "@/components/admin/AdminList";
import { TrashControls } from "@/components/admin/EditorParts";
import { offeringOptions, organizationOptions } from "@/lib/admin/options";
import { toLocalInput } from "@/lib/validation/common";
import { toDateInput } from "@/lib/validation/organizations";
import { deleteDeploymentForever, restoreDeployment, trashDeployment } from "../actions";

export default async function DeploymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; restored?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const flags = await searchParams;
  const [organizations, offerings] = await Promise.all([organizationOptions(), offeringOptions()]);

  if (id === "new") {
    const values: DeploymentFormValues = {
      status: "DRAFT",
      publishAt: "",
      sortOrder: 0,
      appName: "",
      organizationId: "",
      offeringId: "",
      androidPackage: "",
      playStoreUrl: "",
      appStoreUrl: "",
      webUrl: "",
      launchedAt: "",
      linksCheckedAt: "",
      enSummary: "",
      bnSummary: "",
    };
    return (
      <div className="flex flex-col gap-6">
        <Back />
        <h1 className="font-display text-3xl font-semibold">New deployment</h1>
        <DeploymentForm values={values} organizations={organizations} offerings={offerings} />
      </div>
    );
  }

  if (!z.string().uuid().safeParse(id).success) notFound();
  const d = await db.deployment.findUnique({ where: { id }, include: { translations: true } });
  if (!d) notFound();
  const summary = (l: string) => d.translations.find((t) => t.locale === l)?.summary ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Back />
        <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          {d.appName ?? "Unnamed app"}
          <StatusBadge status={d.status} publishAt={d.publishAt} deletedAt={d.deletedAt} />
        </h1>
        <p className="mt-1 text-xs text-text-secondary">Last edited {formatDhaka(d.updatedAt)}</p>
      </div>
      {flags.saved && <Notice tone="success">Saved.</Notice>}
      {flags.restored && <Notice tone="success">Restored from the trash.</Notice>}
      {!d.deletedAt && (
        <DeploymentForm
          organizations={organizations}
          offerings={offerings}
          values={{
            id: d.id,
            status: d.status,
            publishAt: toLocalInput(d.publishAt),
            sortOrder: d.sortOrder,
            appName: d.appName ?? "",
            organizationId: d.organizationId ?? "",
            offeringId: d.offeringId ?? "",
            androidPackage: d.androidPackage ?? "",
            playStoreUrl: d.playStoreUrl ?? "",
            appStoreUrl: d.appStoreUrl ?? "",
            webUrl: d.webUrl ?? "",
            launchedAt: toDateInput(d.launchedAt),
            linksCheckedAt: toDateInput(d.linksCheckedAt),
            enSummary: summary("en"),
            bnSummary: summary("bn"),
          }}
        />
      )}
      <TrashControls
        id={d.id}
        inTrash={Boolean(d.deletedAt)}
        noun="deployment"
        onTrash={trashDeployment}
        onRestore={restoreDeployment}
        onDelete={deleteDeploymentForever}
      />
    </div>
  );
}

function Back() {
  return (
    <Link href="/admin/deployments" className="text-sm text-text-secondary hover:text-brand-sky">
      ← App deployments
    </Link>
  );
}
