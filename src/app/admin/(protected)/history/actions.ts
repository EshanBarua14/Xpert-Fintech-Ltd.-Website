"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { redoLast, restoreRevision, undoLast, undoRedoState, type StepResult } from "@/lib/admin/revisions";

/** Puts a record back as it was in the chosen version (Admin → History). */
export async function restoreVersion(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const back = String(formData.get("back") ?? "/admin/history");
  const result = await restoreRevision(id);
  // The website and every admin list show the restored version at once.
  revalidatePath("/", "layout");
  const safe = back.startsWith("/admin/") ? back : "/admin/history";
  const sep = safe.includes("?") ? "&" : "?";
  if (result.ok) redirect(`${safe}${sep}restored=1`);
  redirect(`${safe}${sep}error=${encodeURIComponent(result.message)}`);
}

/** Undo / Redo from the admin bar (or Ctrl+Z / Ctrl+Shift+Z). */
export async function undoAction(): Promise<StepResult> {
  const r = await undoLast();
  if (r.ok) revalidatePath("/", "layout");
  return r;
}

export async function redoAction(): Promise<StepResult> {
  const r = await redoLast();
  if (r.ok) revalidatePath("/", "layout");
  return r;
}

/** What Undo and Redo would do now, for the admin bar's labels. */
export async function undoRedoStatus(): Promise<{ undo: string | null; redo: string | null }> {
  const admin = await requireAdmin();
  const s = await undoRedoState(admin.id);
  return { undo: s.undo?.label ?? null, redo: s.redo?.label ?? null };
}
