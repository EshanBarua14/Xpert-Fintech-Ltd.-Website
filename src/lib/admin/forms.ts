import "server-only";
import type { z } from "zod";

/**
 * Reads a FormData into an object for a zod schema: missing optional keys
 * become undefined, other missing keys become "" (so required-field messages show).
 */
export function formInput<T extends z.ZodRawShape>(shape: T, formData: FormData, optional: string[] = []) {
  const opt = new Set(["id", "publishAt", ...optional]);
  return Object.fromEntries(Object.keys(shape).map((k) => [k, formData.get(k) || (opt.has(k) ? undefined : "")]));
}

/** "Fintech, RegTech ,  fintech" → ["Fintech", "RegTech"] (case-insensitive de-duplication). */
export function splitList(value: string | null | undefined, max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (value ?? "").split(",")) {
    const v = raw.trim().slice(0, 60);
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out.slice(0, max);
}
