"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { PERSON_GROUPS } from "@/lib/validation/people";
import { optionalHttpsUrl, optionalId, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { purgePerson } from "@/lib/admin/purge";

export type PersonState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  photoMediaId: optionalId,
  linkedinUrl: optionalHttpsUrl.refine((v) => !v || /^https:\/\/([a-z]{2,3}\.)?(www\.)?linkedin\.com\//i.test(v), "Enter a LinkedIn address, e.g. https://www.linkedin.com/in/name"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => v || null),
  enName: z.string().trim().min(1, "English name is required.").max(120),
  bnName: z.string().trim().max(120),
  enBio: optionalText(3000),
  bnBio: optionalText(3000),
});

const role = z.object({
  enabled: z.boolean(),
  enTitle: z.string().trim().max(120),
  bnTitle: z.string().trim().max(120),
  order: z.coerce.number().int().min(0).max(9999).catch(0),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function savePerson(_prev: PersonState, formData: FormData): Promise<PersonState> {
  const admin = await requireAdmin();
  const get = (k: string) => formData.get(k) ?? "";
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    status: formData.get("status"),
    publishAt: formData.get("publishAt") || undefined,
    sortOrder: get("sortOrder") || 0,
    photoMediaId: get("photoMediaId"),
    linkedinUrl: get("linkedinUrl"),
    email: get("email"),
    enName: get("enName"),
    bnName: get("bnName"),
    enBio: get("enBio"),
    bnBio: get("bnBio"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const errors: FieldErrors = {};
  const roles = PERSON_GROUPS.map((group) => {
    const r = role.parse({
      enabled: formData.get(`role.${group}`) === "on",
      enTitle: get(`role.${group}.enTitle`),
      bnTitle: get(`role.${group}.bnTitle`),
      order: get(`role.${group}.order`) || 0,
    });
    if (r.enabled && !r.enTitle) errors[`role.${group}.enTitle`] = "Enter the title for this role.";
    return { group, ...r };
  });
  if (!roles.some((r) => r.enabled)) errors.roles = "Choose at least one group (board, management…).";
  if (!(await isUsableImage(v.photoMediaId))) errors.photoMediaId = "That image is no longer in the media library.";
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    photoMediaId: v.photoMediaId,
    linkedinUrl: v.linkedinUrl,
    email: v.email,
    updatedById: admin.id,
  };

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.person.update({ where: { id }, data });
      else id = (await tx.person.create({ data: { ...data, createdById: admin.id } })).id;
      const personId = id!;

      await tx.personTranslation.upsert({
        where: { personId_locale: { personId, locale: "en" } },
        update: { name: v.enName, bio: v.enBio ?? null },
        create: { personId, locale: "en", name: v.enName, bio: v.enBio ?? null },
      });
      if (v.bnName) {
        await tx.personTranslation.upsert({
          where: { personId_locale: { personId, locale: "bn" } },
          update: { name: v.bnName, bio: v.bnBio ?? null },
          create: { personId, locale: "bn", name: v.bnName, bio: v.bnBio ?? null },
        });
      } else {
        await tx.personTranslation.deleteMany({ where: { personId, locale: "bn" } });
      }

      for (const r of roles) {
        if (!r.enabled) {
          await tx.personRole.deleteMany({ where: { personId, group: r.group } });
          continue;
        }
        const saved = await tx.personRole.upsert({
          where: { personId_group: { personId, group: r.group } },
          update: { sortOrder: r.order },
          create: { personId, group: r.group, sortOrder: r.order },
        });
        await tx.personRoleTranslation.upsert({
          where: { roleId_locale: { roleId: saved.id, locale: "en" } },
          update: { title: r.enTitle },
          create: { roleId: saved.id, locale: "en", title: r.enTitle },
        });
        if (r.bnTitle) {
          await tx.personRoleTranslation.upsert({
            where: { roleId_locale: { roleId: saved.id, locale: "bn" } },
            update: { title: r.bnTitle },
            create: { roleId: saved.id, locale: "bn", title: r.bnTitle },
          });
        } else {
          await tx.personRoleTranslation.deleteMany({ where: { roleId: saved.id, locale: "bn" } });
        }
      }

      await syncMediaUsage(tx, "PERSON", personId, "photo", v.photoMediaId);
    });
  } catch (error) {
    console.error("[admin] savePerson failed", error);
    return { message: "Could not save. Please try again." };
  }

  refresh();
  redirect(`/admin/people/${id}?saved=1`);
}

export async function trashPerson(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.person.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/people?trashed=1");
}

export async function restorePerson(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.person.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/people/${id}?restored=1`);
}

export async function deletePersonForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const person = await db.person.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!person?.deletedAt) redirect(`/admin/people/${id}`);
  await purgePerson(id);
  refresh();
  redirect("/admin/people?view=trash&deleted=1");
}
