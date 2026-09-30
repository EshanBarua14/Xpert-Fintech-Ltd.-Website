"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { optionalHttpsUrl, optionalId, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { parseDateOnly } from "@/lib/validation/organizations";
import { purgeDeployment } from "@/lib/admin/purge";

export type DeploymentState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  appName: z.string().trim().min(1, "App name is required.").max(120),
  organizationId: optionalId,
  offeringId: optionalId,
  androidPackage: z
    .string()
    .trim()
    .max(150)
    .refine((v) => v === "" || /^[a-zA-Z][\w]*(\.[\w]+)+$/.test(v), "Looks like com.company.app")
    .transform((v) => v || null),
  playStoreUrl: optionalHttpsUrl,
  appStoreUrl: optionalHttpsUrl,
  webUrl: optionalHttpsUrl,
  launchedAt: z.string().optional(),
  linksCheckedAt: z.string().optional(),
  enSummary: optionalText(600),
  bnSummary: optionalText(600),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveDeployment(_prev: DeploymentState, formData: FormData): Promise<DeploymentState> {
  const admin = await requireAdmin();
  const optionalKeys = new Set(["id", "publishAt", "launchedAt", "linksCheckedAt"]);
  const parsed = schema.safeParse(
    Object.fromEntries(Object.keys(schema.shape).map((k) => [k, formData.get(k) || (optionalKeys.has(k) ? undefined : "")])),
  );
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    appName: v.appName,
    organizationId: v.organizationId,
    offeringId: v.offeringId,
    androidPackage: v.androidPackage,
    playStoreUrl: v.playStoreUrl,
    appStoreUrl: v.appStoreUrl,
    webUrl: v.webUrl,
    launchedAt: parseDateOnly(v.launchedAt),
    linksCheckedAt: parseDateOnly(v.linksCheckedAt),
    updatedById: admin.id,
  };

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.deployment.update({ where: { id }, data });
      else id = (await tx.deployment.create({ data: { ...data, createdById: admin.id } })).id;
      const deploymentId = id!;
      for (const [locale, summary] of [
        ["en", v.enSummary],
        ["bn", v.bnSummary],
      ] as const) {
        if (summary) {
          await tx.deploymentTranslation.upsert({
            where: { deploymentId_locale: { deploymentId, locale } },
            update: { summary },
            create: { deploymentId, locale, summary },
          });
        } else {
          await tx.deploymentTranslation.deleteMany({ where: { deploymentId, locale } });
        }
      }
    });
  } catch (error) {
    console.error("[admin] saveDeployment failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/deployments/${id}?saved=1`);
}

export async function trashDeployment(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.deployment.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/deployments?trashed=1");
}

export async function restoreDeployment(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.deployment.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/deployments/${id}?restored=1`);
}

export async function deleteDeploymentForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const d = await db.deployment.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!d?.deletedAt) redirect(`/admin/deployments/${id}`);
  await purgeDeployment(id);
  refresh();
  redirect("/admin/deployments?view=trash&deleted=1");
}
