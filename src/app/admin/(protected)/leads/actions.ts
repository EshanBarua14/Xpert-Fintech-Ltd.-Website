"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { parseLocalDateTime } from "@/lib/validation/common";
import { ACTIVITY_KINDS, ADMIN_ERROR_TEXT, LEAD_STATUSES, leadFields, STATUS_LABELS } from "@/lib/validation/lead";

export type LeadAdminState = { errors?: Record<string, string>; message?: string; savedAt?: number };

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/admin", "layout");
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const DETAIL_KEYS = [
  "name",
  "email",
  "phone",
  "organization",
  "designation",
  "businessType",
  "interestedOfferingId",
  "expectedRequirement",
  "message",
  "preferredContact",
] as const;

function parseDetails(formData: FormData) {
  const parsed = leadFields.safeParse(Object.fromEntries(DETAIL_KEYS.map((k) => [k, str(formData.get(k))])));
  if (parsed.success) return { data: parsed.data } as const;
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = ADMIN_ERROR_TEXT[issue.message] ?? issue.message;
  }
  return { errors } as const;
}

async function existingOffering(id: string | null) {
  if (!id) return null;
  return (await db.offering.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))?.id ?? null;
}

/** Admin adds a lead by hand (phone call, event, referral…). */
export async function createLead(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  const admin = await requireAdmin();
  const result = parseDetails(formData);
  if ("errors" in result) return { errors: result.errors, message: "Please fix the highlighted fields." };
  const v = result.data;
  let id: string;
  try {
    const lead = await db.lead.create({
      data: {
        ...v,
        interestedOfferingId: await existingOffering(v.interestedOfferingId),
        source: "MANUAL",
        ownerId: admin.id,
        activities: { create: { kind: "NOTE", body: `Added by ${admin.name}.`, createdById: admin.id } },
      },
    });
    id = lead.id;
  } catch (error) {
    console.error("[admin] createLead failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/leads/${id}?saved=1`);
}

/** Correct a lead's contact details. */
export async function updateLeadDetails(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { message: "This lead no longer exists." };
  const result = parseDetails(formData);
  if ("errors" in result) return { errors: result.errors, message: "Please fix the highlighted fields." };
  const v = result.data;
  try {
    await db.lead.update({
      where: { id: id.data },
      data: { ...v, interestedOfferingId: await existingOffering(v.interestedOfferingId) },
    });
  } catch (error) {
    console.error("[admin] updateLeadDetails failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  return { message: "Details saved.", savedAt: Date.now() };
}

const pipelineSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
  ownerId: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((v) => v || null),
  followUpAt: z.string().max(20),
});

/** Status, owner and follow-up date. A status change is written to the activity log. */
export async function updateLeadPipeline(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  const admin = await requireAdmin();
  const parsed = pipelineSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    ownerId: str(formData.get("ownerId")),
    followUpAt: str(formData.get("followUpAt")),
  });
  if (!parsed.success) return { message: "Please check the values and try again." };
  const v = parsed.data;
  const followUpAt = parseLocalDateTime(v.followUpAt || null);
  if (v.followUpAt && !followUpAt) return { errors: { followUpAt: "Enter a valid date and time." } };

  try {
    await db.$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: v.id }, select: { status: true } });
      const owner = v.ownerId ? await tx.adminUser.findFirst({ where: { id: v.ownerId, isActive: true }, select: { id: true } }) : null;
      await tx.lead.update({ where: { id: v.id }, data: { status: v.status, ownerId: owner?.id ?? null, followUpAt } });
      if (lead.status !== v.status) {
        await tx.leadActivity.create({
          data: {
            leadId: v.id,
            kind: "STATUS_CHANGE",
            fromStatus: lead.status,
            toStatus: v.status,
            body: `${STATUS_LABELS[lead.status]} → ${STATUS_LABELS[v.status]}`,
            createdById: admin.id,
          },
        });
      }
    });
  } catch (error) {
    console.error("[admin] updateLeadPipeline failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  return { message: "Saved.", savedAt: Date.now() };
}

const activitySchema = z.object({
  leadId: z.string().uuid(),
  kind: z.enum(ACTIVITY_KINDS),
  body: z.string().trim().min(1, "Write a short note.").max(5000, "Keep this under 5000 characters."),
});

/** Log a note, call, email or meeting. */
export async function addLeadActivity(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  const admin = await requireAdmin();
  const parsed = activitySchema.safeParse({ leadId: formData.get("leadId"), kind: formData.get("kind"), body: str(formData.get("body")) });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { errors: issue?.path[0] === "body" ? { body: issue.message } : {}, message: issue?.message ?? "Please try again." };
  }
  try {
    await db.leadActivity.create({ data: { ...parsed.data, createdById: admin.id } });
    await db.lead.update({ where: { id: parsed.data.leadId }, data: { updatedAt: new Date() } });
  } catch (error) {
    console.error("[admin] addLeadActivity failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  return { savedAt: Date.now() };
}

export async function deleteLeadActivity(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const activity = await db.leadActivity.findUnique({ where: { id }, select: { leadId: true, kind: true } });
  // Status changes are the lead's history; only notes and logged contacts can be removed.
  if (activity && activity.kind !== "STATUS_CHANGE") await db.leadActivity.delete({ where: { id } });
  refresh();
  if (activity) redirect(`/admin/leads/${activity.leadId}`);
}

export async function trashLead(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  refresh();
  redirect("/admin/leads?trashed=1");
}

export async function restoreLead(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.lead.update({ where: { id }, data: { deletedAt: null } });
  refresh();
  redirect(`/admin/leads/${id}?restored=1`);
}

/** Permanently removes the lead and its history (e.g. on a data-deletion request). */
export async function deleteLeadForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const lead = await db.lead.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!lead?.deletedAt) redirect(`/admin/leads/${id}`);
  await db.lead.delete({ where: { id } });
  refresh();
  redirect("/admin/leads?view=trash&deleted=1");
}
