"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { formInput } from "@/lib/admin/forms";
import { isUsableImage, isUsableVideoFile, syncMediaUsage } from "@/lib/admin/media";
import { purgeVideo } from "@/lib/admin/purge";
import { parseVideoUrl } from "@/lib/public/text";
import { parseDateOnly } from "@/lib/validation/organizations";
import { checkbox, optionalId, optionalText, parseLocalDateTime, toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type VideoState = { errors?: FieldErrors; message?: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  source: z.enum(["LINK", "FILE"]),
  url: z.string().trim().max(500),
  mediaId: optionalId,
  posterMediaId: optionalId,
  eventId: optionalId,
  recordedAt: z.string().optional(),
  duration: z
    .string()
    .trim()
    .regex(/^$|^(\d{1,2}:)?\d{1,2}:\d{2}$/, "Use minutes:seconds, e.g. 3:45 or 1:02:30."),
  isFeatured: checkbox,
  enTitle: z.string().trim().min(1, "English title is required.").max(200),
  enDescription: optionalText(2000),
  bnTitle: z.string().trim().max(200),
  bnDescription: optionalText(2000),
});

const uuid = z.string().uuid();
const refresh = () => revalidatePath("/", "layout");

/** "1:02:30" → 3750 seconds; "" → null. */
function toSeconds(value: string): number | null {
  if (!value) return null;
  return value.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

export async function saveVideo(_prev: VideoState, formData: FormData): Promise<VideoState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(formInput(schema.shape, formData, ["recordedAt"]));
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;

  let provider: "UPLOAD" | "YOUTUBE" | "VIMEO" | "FACEBOOK";
  let url: string | null = null;
  let mediaId: string | null = null;
  if (v.source === "LINK") {
    const link = parseVideoUrl(v.url);
    if (!link) return { errors: { url: "Paste a YouTube, Vimeo or Facebook video address (starting with https://)." }, message: "Please fix the highlighted fields." };
    provider = link.provider;
    url = v.url;
  } else {
    if (!v.mediaId) return { errors: { mediaId: "Choose an uploaded video, or switch to a link." }, message: "Please fix the highlighted fields." };
    if (!(await isUsableVideoFile(v.mediaId))) return { errors: { mediaId: "That video is no longer in the media library." } };
    provider = "UPLOAD";
    mediaId = v.mediaId;
  }
  if (!(await isUsableImage(v.posterMediaId))) return { errors: { posterMediaId: "That image is no longer in the media library." } };
  if (v.eventId && !(await db.event.findFirst({ where: { id: v.eventId, deletedAt: null }, select: { id: true } }))) {
    return { errors: { eventId: "That event no longer exists." } };
  }

  const data = {
    status: v.status,
    publishAt: parseLocalDateTime(v.publishAt),
    sortOrder: v.sortOrder,
    provider,
    url,
    mediaId,
    posterMediaId: v.posterMediaId,
    eventId: v.eventId,
    recordedAt: parseDateOnly(v.recordedAt),
    durationSec: toSeconds(v.duration),
    isFeatured: v.isFeatured,
    updatedById: admin.id,
  };
  const text = (l: "en" | "bn") => ({ title: l === "en" ? v.enTitle : v.bnTitle, description: (l === "en" ? v.enDescription : v.bnDescription) ?? null });

  let id = v.id;
  try {
    await db.$transaction(async (tx) => {
      // Only one featured video leads the gallery.
      if (v.isFeatured) await tx.video.updateMany({ where: { isFeatured: true, ...(id && { id: { not: id } }) }, data: { isFeatured: false } });
      if (id) await tx.video.update({ where: { id }, data });
      else id = (await tx.video.create({ data: { ...data, createdById: admin.id } })).id;
      const videoId = id!;
      await tx.videoTranslation.upsert({ where: { videoId_locale: { videoId, locale: "en" } }, update: text("en"), create: { videoId, locale: "en", ...text("en") } });
      if (v.bnTitle) {
        await tx.videoTranslation.upsert({ where: { videoId_locale: { videoId, locale: "bn" } }, update: text("bn"), create: { videoId, locale: "bn", ...text("bn") } });
      } else {
        await tx.videoTranslation.deleteMany({ where: { videoId, locale: "bn" } });
      }
      await syncMediaUsage(tx, "VIDEO", videoId, "file", mediaId);
      await syncMediaUsage(tx, "VIDEO", videoId, "poster", v.posterMediaId);
    });
  } catch (error) {
    console.error("[admin] saveVideo failed", error);
    return { message: "Could not save. Please try again." };
  }
  refresh();
  redirect(`/admin/videos/${id}?saved=1`);
}

export async function trashVideo(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.video.update({ where: { id }, data: { deletedAt: new Date(), updatedById: admin.id } });
  refresh();
  redirect("/admin/videos?trashed=1");
}

export async function restoreVideo(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await db.video.update({ where: { id }, data: { deletedAt: null, updatedById: admin.id } });
  refresh();
  redirect(`/admin/videos/${id}?restored=1`);
}

export async function deleteVideoForever(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const v = await db.video.findUnique({ where: { id }, select: { deletedAt: true } });
  if (!v?.deletedAt) redirect(`/admin/videos/${id}`);
  await purgeVideo(id);
  refresh();
  redirect("/admin/videos?view=trash&deleted=1");
}
