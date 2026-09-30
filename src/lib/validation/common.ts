import { z } from "zod";

/** "Xpert eKYC Portal" → "xpert-ekyc-portal". Non-Latin text yields "". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Admins enter dates in Bangladesh time (UTC+06:00, no daylight saving).
 * `<input type="datetime-local">` gives "2026-10-05T09:30"; store it as that
 * moment in Dhaka.
 */
export const SITE_UTC_OFFSET = "+06:00";

export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}:00${SITE_UTC_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DDTHH:mm" in Dhaka time, for datetime-local inputs. */
export function toLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  const shifted = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** Optional text: trims, and turns "" into null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Use lowercase letters, numbers and hyphens only.");

/** Form checkbox: present = "on". */
export const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

export type FieldErrors = Record<string, string>;

/** Flattens zod issues to { "en.name": "message" } for the form. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Optional media id from a hidden input: "" → null. */
export const optionalId = z
  .string()
  .uuid()
  .or(z.literal(""))
  .transform((v) => v || null);

/** Optional https URL: "" → null. */
export const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Enter a full address starting with https://")
  .transform((v) => v || null);
