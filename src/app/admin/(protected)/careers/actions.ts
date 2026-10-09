"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { purgeApplication, purgeCareer } from "@/lib/admin/purge";
import { checkbox, optionalHttpsUrl, optionalText, parseLocalDateTime, slugField, slugify, toFieldErrors, type FieldErrors } from "@/lib/validation/common";
import { parseDateOnly } from "@/lib/validation/organizations";

export type CareerState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  department: optionalText(120),
  location: optionalText(120),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  experience: optionalText(120),
  deadline: z.string().optional(),
  isClosed: checkbox,
  linkedinUrl: optionalHttpsUrl.refine((v) => !v || /^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(v), "Enter a linkedin.com address."),
  bdjobsUrl: optionalHttpsUrl.refine((v) => !v || /^https:\/\/([a-z0-9]+\.)?bdjobs\.com\//i.test(v), "Enter a bdjobs.com address."),
  applyEmail: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter an email address.")
    .transform((v) => v.toLowerCase() || null),
  enTitle: z.string().trim().min(1, "English job title is required.").max(200),
  enSlug: slugField,
  enSummary: optionalText(800),
  enAbout: optionalText(4000),
  enResponsibilities: optionalText(10000),
  enRequirements: optionalText(10000),
  enBenefits: optionalText(5000),
  bnTitle: z.string().trim().max(200),
  bnSlug: slugField,
  bnSummary: optionalText(800),
  bnAbout: optionalText(4000),
  bnResponsibilities: optionalText(10000),
  bnRequirements: optionalText(10000),
  bnBenefits: optionalText(5000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

export async function saveCareer(_prev: CareerState, formData: FormData): Promise<CareerState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData, ["deadline"]));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const enSlug = v.enSlug || slugify(v.enTitle);
  if (!enSlug) return { errors: { enSlug: "Enter a URL slug using English letters." } };
  const bnSlug = v.bnSlug || enSlug;

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    department: v.department ?? null,
    location: v.location ?? null,
    employmentType: v.employmentType,
    experience: v.experience ?? null,
    deadline: parseDateOnly(v.deadline),
    isClosed: v.isClosed,
    linkedinUrl: v.linkedinUrl,
    bdjobsUrl: v.bdjobsUrl,
    applyEmail: v.applyEmail,
    updatedById: admin.id,
  };
  const text = (l: "en" | "bn") => ({
    title: l === "en" ? v.enTitle : v.bnTitle,
    slug: l === "en" ? enSlug : bnSlug,
    summary: (l === "en" ? v.enSummary : v.bnSummary) ?? null,
    about: (l === "en" ? v.enAbout : v.bnAbout) ?? null,
    responsibilities: (l === "en" ? v.enResponsibilities : v.bnResponsibilities) ?? null,
    requirements: (l === "en" ? v.enRequirements : v.bnRequirements) ?? null,
    benefits: (l === "en" ? v.enBenefits : v.bnBenefits) ?? null,
  });

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      if (id) await tx.career.update({ where: { id }, data });
      else id = (await tx.career.create({ data: { ...data, createdById: admin.id } })).id;
      const careerId = id!;
      await tx.careerTranslation.upsert({ where: { careerId_locale: { careerId, locale: "en" } }, update: text("en"), create: { careerId, locale: "en", ...text("en") } });
      if (v.bnTitle) {
        await tx.careerTranslation.upsert({ where: { careerId_locale: { careerId, locale: "bn" } }, update: text("bn"), create: { careerId, locale: "bn", ...text("bn") } });
      } else {
        await tx.careerTranslation.deleteMany({ where: { careerId, locale: "bn" } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { enSlug: "Another job already uses this URL slug." }, message: "That URL is taken." };
    }
    console.error("[admin] saveCareer failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/careers/${id}?saved=1`);
}

export async function trashCareer(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.career.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/careers?trashed=1");
}

export async function restoreCareer(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.career.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/careers/${id}?restored=1`);
}

export async function deleteCareerForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const c = await db.career.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!c?.deletedAt) redirect(`/admin/careers/${id}`);
  await purgeCareer(id);
  refresh();
  redirect("/admin/careers?view=trash&deleted=1");
}

// ── Applications ─────────────────────────────────────────────────────────────

export type ApplicationState = { message?: string; errors?: FieldErrors; savedAt?: number };

const appSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]),
  adminNotes: optionalText(5000),
});

export async function updateApplication(_prev: ApplicationState, formData: FormData): Promise<ApplicationState> {
  await requireAdmin();
  const parsed = appSchema.safeParse(formInput(appSchema.shape, formData));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  await db.careerApplication.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, adminNotes: parsed.data.adminNotes ?? null } });
  revalidatePath("/admin/applications");
  return { message: "Saved.", savedAt: Date.now() };
}

export async function trashApplication(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.careerApplication.update({ where: { id }, data: { deletedAt: new Date() } });
  redirect("/admin/applications?trashed=1");
}

export async function restoreApplication(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.careerApplication.update({ where: { id }, data: { deletedAt: null } });
  redirect(`/admin/applications/${id}?restored=1`);
}

/** Permanent delete also removes the CV file (personal data). */
export async function deleteApplicationForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const a = await db.careerApplication.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!a?.deletedAt) redirect(`/admin/applications/${id}`);
  await purgeApplication(id);
  redirect("/admin/applications?view=trash&deleted=1");
}
