"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
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
  slugField,
  slugify,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/common";
import { parseDateOnly } from "@/lib/validation/organizations";
import { purgeEvent } from "@/lib/admin/purge";

export type EventState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  dateIsApprox: checkbox,
  coverMediaId: optionalId,
  videoUrl: optionalHttpsUrl,
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enSlug: slugField,
  enSummary: optionalText(600),
  enBody: optionalText(20000),
  enLocation: optionalText(200),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnSummary: optionalText(600),
  bnBody: optionalText(20000),
  bnLocation: optionalText(200),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const admin = await requireAdmin();
  const optionalKeys = new Set(["id", "publishAt", "startsAt", "endsAt"]);
  const parsed = schema.safeParse(
    Object.fromEntries(Object.keys(schema.shape).map((k) => [k, formData.get(k) || (optionalKeys.has(k) ? undefined : "")])),
  );
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const startsAt = parseDateOnly(v.startsAt);
  const endsAt = parseDateOnly(v.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) return { errors: { endsAt: "The end date is before the start date." } };
  if (!(await isUsableImage(v.coverMediaId))) return { errors: { coverMediaId: "That image is no longer in the media library." } };

  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;

  const participantIds = z.array(z.string().uuid()).parse(formData.getAll("participants").map(String));

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    startsAt,
    endsAt,
    dateIsApprox: v.dateIsApprox,
    coverMediaId: v.coverMediaId,
    videoUrl: v.videoUrl,
    updatedById: admin.id,
  };

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.event.update({ where: { id }, data });
      else id = (await tx.event.create({ data: { ...data, createdById: admin.id } })).id;
      const eventId = id!;

      const en = { slug: enSlug, title: v.enTitle, summary: v.enSummary ?? null, body: v.enBody ?? null, location: v.enLocation ?? null };
      await tx.eventTranslation.upsert({
        where: { eventId_locale: { eventId, locale: "en" } },
        update: en,
        create: { eventId, locale: "en", ...en },
      });
      if (v.bnTitle) {
        const bn = { slug: bnSlug, title: v.bnTitle, summary: v.bnSummary ?? null, body: v.bnBody ?? null, location: v.bnLocation ?? null };
        await tx.eventTranslation.upsert({
          where: { eventId_locale: { eventId, locale: "bn" } },
          update: bn,
          create: { eventId, locale: "bn", ...bn },
        });
      } else {
        await tx.eventTranslation.deleteMany({ where: { eventId, locale: "bn" } });
      }

      await tx.eventOrganization.deleteMany({ where: { eventId } });
      if (participantIds.length) {
        await tx.eventOrganization.createMany({
          data: participantIds.map((organizationId, i) => ({ eventId, organizationId, sortOrder: i })),
          skipDuplicates: true,
        });
      }
      await syncMediaUsage(tx, "EVENT", eventId, "cover", v.coverMediaId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another event already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveEvent failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/events/${id}?saved=1`);
}

export async function trashEvent(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.event.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/events?trashed=1");
}

export async function restoreEvent(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.event.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/events/${id}?restored=1`);
}

export async function deleteEventForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const ev = await db.event.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!ev?.deletedAt) redirect(`/admin/events/${id}`);
  await purgeEvent(id);
  refresh();
  redirect("/admin/events?view=trash&deleted=1");
}
