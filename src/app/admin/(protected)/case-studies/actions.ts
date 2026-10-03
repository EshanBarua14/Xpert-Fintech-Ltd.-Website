"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { isUsableImage, syncMediaUsage } from "@/lib/admin/media";
import { purgeCaseStudy } from "@/lib/admin/purge";
import { optionalId, optionalText, parseLocalDateTime, slugField, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type CaseStudyState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  coverMediaId: optionalId,
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enSlug: slugField,
  enSummary: optionalText(800),
  enChallenge: optionalText(10000),
  enSolution: optionalText(10000),
  enOutcome: optionalText(10000),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnSummary: optionalText(800),
  bnChallenge: optionalText(10000),
  bnSolution: optionalText(10000),
  bnOutcome: optionalText(10000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveCaseStudy(_prev: CaseStudyState, formData: FormData): Promise<CaseStudyState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (!(await isUsableImage(v.coverMediaId))) return { errors: { coverMediaId: "That image is no longer in the media library." } };
  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;
  const data = { status: v.status, publishAt: parseLocalDateTime(v.publishAt), sortOrder: v.sortOrder, coverMediaId: v.coverMediaId, updatedById: admin.id };
  const text = (l: "en" | "bn") => ({
    slug: l === "en" ? enSlug : bnSlug,
    title: l === "en" ? v.enTitle : v.bnTitle,
    summary: (l === "en" ? v.enSummary : v.bnSummary) ?? null,
    challenge: (l === "en" ? v.enChallenge : v.bnChallenge) ?? null,
    solution: (l === "en" ? v.enSolution : v.bnSolution) ?? null,
    outcome: (l === "en" ? v.enOutcome : v.bnOutcome) ?? null,
  });
  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.caseStudy.update({ where: { id }, data });
      else id = (await tx.caseStudy.create({ data: { ...data, createdById: admin.id } })).id;
      const caseStudyId = id!;
      await tx.caseStudyTranslation.upsert({ where: { caseStudyId_locale: { caseStudyId, locale: "en" } }, update: text("en"), create: { caseStudyId, locale: "en", ...text("en") } });
      if (v.bnTitle) {
        await tx.caseStudyTranslation.upsert({ where: { caseStudyId_locale: { caseStudyId, locale: "bn" } }, update: text("bn"), create: { caseStudyId, locale: "bn", ...text("bn") } });
      } else {
        await tx.caseStudyTranslation.deleteMany({ where: { caseStudyId, locale: "bn" } });
      }
      await syncMediaUsage(tx, "CASE_STUDY", caseStudyId, "cover", v.coverMediaId);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another case study already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveCaseStudy failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/case-studies/${id}?saved=1`);
}

export async function trashCaseStudy(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.caseStudy.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/case-studies?trashed=1");
}

export async function restoreCaseStudy(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.caseStudy.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/case-studies/${id}?restored=1`);
}

export async function deleteCaseStudyForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const c = await db.caseStudy.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!c?.deletedAt) redirect(`/admin/case-studies/${id}`);
  await purgeCaseStudy(id);
  refresh();
  redirect("/admin/case-studies?view=trash&deleted=1");
}
