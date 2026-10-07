"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { purgeTestimonial } from "@/lib/admin/purge";
import { checkbox, optionalId, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type TestimonialState = { errors?: FieldErrors; message?: string };

const base = z.object({
    id: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishAt: z.string().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999),
    personName: z.string().trim().min(1, "Enter the person's name.").max(120),
    organizationId: optionalId,
    photoMediaId: optionalId,
    hasApproval: checkbox,
    rating: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 5), "Choose 1 to 5 stars, or none."),
    enRole: optionalText(160),
    enQuote: z.string().trim().min(10, "Enter the quote (at least a sentence).").max(1200),
    bnRole: optionalText(160),
    bnQuote: optionalText(1200),
});
const schema = base.refine((v) => v.status !== "PUBLISHED" || v.hasApproval, {
    path: ["hasApproval"],
    message: "A quote can be published only with the person's written approval on file.",
  });

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveTestimonial(_prev: TestimonialState, formData: FormData): Promise<TestimonialState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(base.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (!(await isUsableImage(v.photoMediaId))) return { errors: { photoMediaId: "That image is no longer in the media library." } };
  if (v.organizationId && !(await db.organization.findFirst({ where: { id: v.organizationId, deletedAt: null }, select: { id: true } }))) {
    return { errors: { organizationId: "That organization no longer exists." } };
  }
  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    personName: v.personName,
    organizationId: v.organizationId,
    photoMediaId: v.photoMediaId,
    hasApproval: v.hasApproval,
    rating: v.rating,
    updatedById: admin.id,
  };
  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.testimonial.update({ where: { id }, data });
      else id = (await tx.testimonial.create({ data: { ...data, createdById: admin.id } })).id;
      const testimonialId = id!;
      await tx.testimonialTranslation.upsert({
        where: { testimonialId_locale: { testimonialId, locale: "en" } },
        update: { quote: v.enQuote, personTitle: v.enRole ?? null },
        create: { testimonialId, locale: "en", quote: v.enQuote, personTitle: v.enRole ?? null },
      });
      if (v.bnQuote) {
        await tx.testimonialTranslation.upsert({
          where: { testimonialId_locale: { testimonialId, locale: "bn" } },
          update: { quote: v.bnQuote, personTitle: v.bnRole ?? null },
          create: { testimonialId, locale: "bn", quote: v.bnQuote, personTitle: v.bnRole ?? null },
        });
      } else {
        await tx.testimonialTranslation.deleteMany({ where: { testimonialId, locale: "bn" } });
      }
      await syncMediaUsage(tx, "TESTIMONIAL", testimonialId, "photo", v.photoMediaId);
    });
  } catch (error) {
    console.error("[admin] saveTestimonial failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/testimonials/${id}?saved=1`);
}

export async function trashTestimonial(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.testimonial.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/testimonials?trashed=1");
}

export async function restoreTestimonial(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.testimonial.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/testimonials/${id}?restored=1`);
}

export async function deleteTestimonialForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const t = await db.testimonial.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!t?.deletedAt) redirect(`/admin/testimonials/${id}`);
  await purgeTestimonial(id);
  refresh();
  redirect("/admin/testimonials?view=trash&deleted=1");
}
