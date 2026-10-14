"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { restoreRevision } from "@/lib/admin/revisions";

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
