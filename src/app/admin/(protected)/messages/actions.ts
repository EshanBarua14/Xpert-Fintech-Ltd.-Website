"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type MessageState = { errors?: FieldErrors; message?: string; savedAt?: number };

const schema = z
  .object({
    key: z.enum(["chairman", "md"]),
    personKey: z.string().trim().max(120),
    en: z.string().trim().max(6000, "Keep the message under 6,000 characters."),
    bn: z.string().trim().max(6000, "Keep the message under 6,000 characters."),
    published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.published && !v.en) ctx.addIssue({ code: "custom", path: ["en"], message: "Write the English message before publishing." });
    if (v.published && !v.personKey) ctx.addIssue({ code: "custom", path: ["personKey"], message: "Choose who signs the message before publishing." });
  });

/** Saves the Chairman's or the Managing Director's message (Settings key "message.<key>"). */
export async function saveLeaderMessage(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    key: formData.get("key"),
    personKey: formData.get("personKey") ?? "",
    en: formData.get("en") ?? "",
    bn: formData.get("bn") ?? "",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { key, ...value } = parsed.data;
  if (value.personKey && !(await db.person.findFirst({ where: { key: value.personKey, deletedAt: null }, select: { id: true } }))) {
    return { errors: { personKey: "That person is no longer in Admin → People." }, message: "Please fix the highlighted fields." };
  }
  await db.siteSetting.upsert({
    where: { key: `message.${key}` },
    update: { value, updatedById: admin.id },
    create: { key: `message.${key}`, value, updatedById: admin.id },
  });
  revalidatePath("/", "layout");
  return {
    message: value.published ? "Saved and published. It shows on the About page and the Board or Management page." : "Saved as a draft. It is not on the website until you tick Publish.",
    savedAt: Date.now(),
  };
}
