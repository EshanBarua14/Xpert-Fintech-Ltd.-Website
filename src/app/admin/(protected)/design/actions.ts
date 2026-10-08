"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { COLOR_FIELDS, DESIGN_KEY, HOME_SECTIONS, readDesign, TONE_FIELDS } from "@/lib/content/design";
import type { FieldErrors } from "@/lib/validation/common";

export type DesignState = { errors?: FieldErrors; message?: string; ok?: boolean; savedAt?: number };

const HEX = /^#[0-9a-f]{6}$/i;

/** Saves Admin → Design. Empty colour fields and "Automatic" icons keep the built-in look. */
export async function saveDesign(_prev: DesignState, formData: FormData): Promise<DesignState> {
  const admin = await requireAdmin();
  const errors: FieldErrors = {};
  const color = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    if (!v) return undefined;
    const withHash = v.startsWith("#") ? v : `#${v}`;
    if (!HEX.test(withHash)) {
      errors[name] = "Use a 6-digit colour code, e.g. #2a5fae, or leave empty.";
      return undefined;
    }
    return withHash.toLowerCase();
  };
  const colors = Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, color(`color.${f.key}`)]));
  const tones = Object.fromEntries(TONE_FIELDS.map((f) => [f.key, color(`tone.${f.key}`)]));
  const products: Record<string, { from?: string; to?: string; icon?: string }> = {};
  for (const key of formData.getAll("productKey").map(String)) {
    products[key] = { from: color(`product.${key}.from`), to: color(`product.${key}.to`), icon: String(formData.get(`product.${key}.icon`) ?? "") || undefined };
  }
  const navIcons: Record<string, string> = {};
  for (const path of formData.getAll("navPath").map(String)) {
    const icon = String(formData.get(`nav.${path}`) ?? "");
    if (icon) navIcons[path] = icon;
  }
  const hidden = HOME_SECTIONS.filter((s) => formData.get(`home.${s.key}`) !== "on").map((s) => s.key);
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted colour codes." };
  // Read back through the validator, so only known keys, valid colours and real icons are stored.
  const value = readDesign({ colors, tones, products, navIcons, hidden });
  await db.siteSetting.upsert({ where: { key: DESIGN_KEY }, update: { value, updatedById: admin.id }, create: { key: DESIGN_KEY, value, updatedById: admin.id } });
  revalidatePath("/", "layout");
  return { ok: true, savedAt: Date.now(), message: "Saved. The website uses the new design at once." };
}

/** Back to the built-in look. */
export async function resetDesign() {
  await requireAdmin();
  await db.siteSetting.deleteMany({ where: { key: DESIGN_KEY } });
  revalidatePath("/", "layout");
}
