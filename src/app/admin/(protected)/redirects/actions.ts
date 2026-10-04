"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { toFieldErrors, type FieldErrors } from "@/lib/validation/common";

export type RedirectState = { errors?: FieldErrors; message?: string; savedAt?: number };

/** "/about-us.html/" → "/about-us.html"; old-site paths are stored without a language prefix. */
function cleanFrom(v: string) {
  let p = v.trim();
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname; // pasted a full old-site URL
  } catch {}
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
  return p.replace(/^\/(en|bn)(?=\/|$)/, "") || "/";
}

const schema = z
  .object({
    id: z.string().uuid().optional(),
    fromPath: z.string().trim().min(2, "Enter the old address, e.g. /about-us.html").max(500).transform(cleanFrom),
    toPath: z
      .string()
      .trim()
      .min(1, "Enter where visitors should go.")
      .max(1000)
      .refine((v) => v.startsWith("/") || /^https:\/\/[^\s]+$/i.test(v), "Use a site path such as /en/company/about, or a full https:// address."),
    statusCode: z.enum(["301", "302"]).transform(Number),
    isActive: z.literal("on").optional().transform(Boolean),
    note: z.string().trim().max(300).optional().transform((v) => v || null),
  })
  .refine((v) => v.fromPath !== "/", { path: ["fromPath"], message: "The home page cannot be redirected." })
  .refine((v) => !/^\/(admin|api|media|_next)(\/|$)/.test(v.fromPath), { path: ["fromPath"], message: "This address belongs to the system and cannot be redirected." })
  .refine((v) => v.toPath.replace(/\/+$/, "") !== v.fromPath, { path: ["toPath"], message: "This would send visitors back to the same address." });

export async function saveRedirect(_prev: RedirectState, formData: FormData): Promise<RedirectState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    fromPath: formData.get("fromPath") ?? "",
    toPath: formData.get("toPath") ?? "",
    statusCode: formData.get("statusCode") ?? "301",
    isActive: formData.get("isActive") ?? undefined,
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { id, ...data } = parsed.data;
  try {
    if (id) await db.redirect.update({ where: { id }, data });
    else await db.redirect.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { fromPath: "There is already a redirect for this address." } };
    }
    console.error("[admin] saveRedirect failed", error);
    return { message: "Could not save. Please try again." };
  }
  revalidatePath("/admin/redirects");
  return { message: id ? "Saved." : "Redirect added.", savedAt: Date.now() };
}

export async function deleteRedirect(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.redirect.delete({ where: { id } });
  revalidatePath("/admin/redirects");
}
