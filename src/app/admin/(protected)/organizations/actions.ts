"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import {
  checkbox,
  optionalHttpsUrl,
  optionalId,
  optionalText,
  parseLocalDateTime,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/common";
import { ORGANIZATION_KINDS } from "@/lib/validation/organizations";
import { purgeOrganization } from "@/lib/admin/purge";

export type OrgState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(ORGANIZATION_KINDS),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  websiteUrl: optionalHttpsUrl,
  logoMediaId: optionalId,
  logoPermission: checkbox,
  enName: z.string().trim().min(1, "English name is required.").max(160),
  enShortName: optionalText(40),
  enDescription: optionalText(1000),
  bnName: z.string().trim().max(160),
  bnShortName: optionalText(40),
  bnDescription: optionalText(1000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveOrganization(_prev: OrgState, formData: FormData): Promise<OrgState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(
    Object.fromEntries(Object.keys(schema.shape).map((k) => [k, formData.get(k) ?? (k === "id" || k === "publishAt" ? undefined : "")])),
  );
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (!(await isUsableImage(v.logoMediaId))) return { errors: { logoMediaId: "That image is no longer in the media library." } };

  const data = {
    kind: v.kind,
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    websiteUrl: v.websiteUrl,
    logoMediaId: v.logoMediaId,
    logoPermission: v.logoPermission,
    updatedById: admin.id,
  };

  let id = v.id || undefined;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.organization.update({ where: { id }, data });
      else id = (await tx.organization.create({ data: { ...data, createdById: admin.id } })).id;
      const organizationId = id!;
      const en = { name: v.enName, shortName: v.enShortName ?? null, description: v.enDescription ?? null };
      await tx.organizationTranslation.upsert({
        where: { organizationId_locale: { organizationId, locale: "en" } },
        update: en,
        create: { organizationId, locale: "en", ...en },
      });
      if (v.bnName) {
        const bn = { name: v.bnName, shortName: v.bnShortName ?? null, description: v.bnDescription ?? null };
        await tx.organizationTranslation.upsert({
          where: { organizationId_locale: { organizationId, locale: "bn" } },
          update: bn,
          create: { organizationId, locale: "bn", ...bn },
        });
      } else {
        await tx.organizationTranslation.deleteMany({ where: { organizationId, locale: "bn" } });
      }
      await syncMediaUsage(tx, "ORGANIZATION", organizationId, "logo", v.logoMediaId);
    });
  } catch (error) {
    console.error("[admin] saveOrganization failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/organizations/${id}?saved=1`);
}

export async function trashOrganization(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.organization.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/organizations?trashed=1");
}

export async function restoreOrganization(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.organization.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/organizations/${id}?restored=1`);
}

export async function deleteOrganizationForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const org = await db.organization.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!org?.deletedAt) redirect(`/admin/organizations/${id}`);
  await purgeOrganization(id);
  refresh();
  redirect("/admin/organizations?view=trash&deleted=1");
}
