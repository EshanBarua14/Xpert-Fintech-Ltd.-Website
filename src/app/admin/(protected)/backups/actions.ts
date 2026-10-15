"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createBackup, restoreBackup, unpack } from "@/lib/admin/backup";

export async function backupNow(formData: FormData) {
  const admin = await requireAdmin();
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  await createBackup("manual", admin.id, note);
  redirect("/admin/backups?made=1");
}

export async function restoreFromBackup(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const row = await db.backup.findUnique({ where: { id } });
  if (!row) redirect("/admin/backups?error=" + encodeURIComponent("That backup no longer exists."));
  let message = "";
  try {
    await restoreBackup(unpack(row.data), admin.id);
  } catch (error) {
    console.error("[backup] restore failed", error);
    message = "The backup could not be restored, and nothing was changed. " + ((error as Error)?.message ?? "");
  }
  revalidatePath("/", "layout");
  redirect(message ? "/admin/backups?error=" + encodeURIComponent(message.slice(0, 300)) : "/admin/backups?restored=1");
}

export async function restoreFromFile(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  let message = "";
  try {
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a backup file (.json.gz) first.");
    await restoreBackup(unpack(new Uint8Array(await file.arrayBuffer())), admin.id);
  } catch (error) {
    message = "The file could not be restored, and nothing was changed. " + ((error as Error)?.message ?? "");
  }
  revalidatePath("/", "layout");
  redirect(message ? "/admin/backups?error=" + encodeURIComponent(message.slice(0, 300)) : "/admin/backups?restored=1");
}

export async function deleteBackup(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.backup.delete({ where: { id } }).catch(() => null);
  redirect("/admin/backups?deleted=1");
}
