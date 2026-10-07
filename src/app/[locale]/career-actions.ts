"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { publishedWhere } from "@/lib/db/publishing";
import { requestMeta } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/public/turnstile";
import { sniff } from "@/lib/media/inspect";
import { storage } from "@/lib/storage";

export type ApplyState = {
  status?: "success" | "error";
  /** field → message key */
  errors?: Record<string, "required" | "email" | "tooLong" | "cvType" | "cvSize" | "consent">;
  message?: "rateLimited" | "captcha" | "generic" | "fix" | "closed";
};

const MIN_FILL_MS = 3000;
const MAX_CV_BYTES = 5 * 1024 * 1024;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

const schema = z.object({
  careerId: z.string().uuid(),
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  email: z.string().trim().toLowerCase().min(1, "required").max(200, "tooLong").email("email"),
  phone: z.string().trim().max(40, "tooLong"),
  coverLetter: z.string().trim().max(5000, "tooLong"),
  consent: z.literal("on", { errorMap: () => ({ message: "consent" }) }),
});

/**
 * Job application with CV. Same defences as the demo form: honeypot, minimum
 * fill time, validation, per-IP rate limit, optional Turnstile. The CV must be
 * a real PDF (checked from its content) and is stored as a private file that
 * only signed-in admins can open.
 */
export async function applyForJob(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const { ip } = await requestMeta();
  if (str(formData.get("company_website"))) return { status: "success" };
  const startedAt = Number(str(formData.get("started_at")));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < MIN_FILL_MS) return { status: "success" };

  const parsed = schema.safeParse({
    careerId: str(formData.get("careerId")),
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    coverLetter: str(formData.get("coverLetter")),
    consent: str(formData.get("consent")),
  });
  const errors: NonNullable<ApplyState["errors"]> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message as NonNullable<ApplyState["errors"]>[string];
    }
  }
  const file = formData.get("cv");
  let cv: { data: Buffer; name: string } | null = null;
  if (!(file instanceof File) || file.size === 0) errors.cv = "required";
  else if (file.size > MAX_CV_BYTES) errors.cv = "cvSize";
  else {
    const data = Buffer.from(await file.arrayBuffer());
    const type = sniff(data);
    if (!type || type.ext !== "pdf") errors.cv = "cvType";
    else cv = { data, name: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "cv.pdf" };
  }
  if (!parsed.success || Object.keys(errors).length) return { status: "error", errors, message: "fix" };
  const v = parsed.data;

  if (!rateLimit(`apply:${ip ?? "unknown"}`, 3, 60 * 60 * 1000).ok) return { status: "error", message: "rateLimited" };
  if (!(await verifyTurnstile(str(formData.get("cf-turnstile-response")) || null, ip))) return { status: "error", message: "captcha" };

  const now = new Date();
  const job = await db.career.findFirst({ where: { id: v.careerId, ...publishedWhere(now) }, select: { id: true, isClosed: true, deadline: true } });
  if (!job || job.isClosed || (job.deadline && job.deadline.getTime() + 24 * 60 * 60 * 1000 < now.getTime())) {
    return { status: "error", message: "closed" };
  }
  // Double-submit guard: same person and job within a day.
  const recent = await db.careerApplication.findFirst({
    where: { careerId: job.id, email: v.email, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  });
  if (recent) return { status: "success" };

  const storageKey = `${randomUUID()}.pdf`;
  try {
    await storage().put(storageKey, cv!.data, "application/pdf");
    await db.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          kind: "DOCUMENT",
          storageKey,
          originalName: cv!.name.toLowerCase().endsWith(".pdf") ? cv!.name : `${cv!.name}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: cv!.data.length,
          checksum: createHash("sha256").update(cv!.data).digest("hex"),
          isScanned: true,
          tags: ["private", "cv"],
        },
      });
      const application = await tx.careerApplication.create({
        data: {
          careerId: job.id,
          name: v.name,
          email: v.email,
          phone: v.phone || null,
          coverLetter: v.coverLetter || null,
          cvMediaId: media.id,
          consent: true,
          ip,
        },
      });
      // Marks the CV as in use, so it cannot be deleted from the media library by mistake.
      await tx.mediaUsage.create({ data: { mediaId: media.id, entityType: "CAREER", entityId: job.id, field: `cv:${application.id}` } });
    });
  } catch (error) {
    console.error("[careers] could not save application", error);
    await storage().remove(storageKey).catch(() => {});
    return { status: "error", message: "generic" };
  }
  revalidatePath("/admin", "layout");
  return { status: "success" };
}
