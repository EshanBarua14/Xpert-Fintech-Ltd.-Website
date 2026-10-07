import "server-only";
import { db } from "@/lib/db/client";
import { defaultMessages, setTextOverrides, textOverridesAge, type TextOverrides } from "./messages";

export const TEXT_SETTING_KEY = "site.text";
const REFRESH_MS = 60_000;
let loading: Promise<void> | null = null;

/** Reads Admin → Site text edits into memory. Unknown keys and blanks are dropped. */
export async function loadTextOverrides(): Promise<TextOverrides> {
  const row = await db.siteSetting.findUnique({ where: { key: TEXT_SETTING_KEY } });
  const clean: TextOverrides = {};
  const value = (row?.value ?? {}) as Record<string, unknown>;
  for (const locale of ["en", "bn"] as const) {
    const map = value[locale];
    if (!map || typeof map !== "object") continue;
    const known = defaultMessages(locale) as Record<string, string>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(map as Record<string, unknown>)) if (k in known && typeof v === "string" && v.trim()) out[k] = v;
    clean[locale] = out;
  }
  setTextOverrides(clean);
  return clean;
}

/**
 * Keeps the in-memory text fresh: loads it on the first request after a start,
 * then at most once a minute in the background (so several server processes
 * pick up an edit made on another one). Never blocks longer than the first load.
 */
export async function ensureTextOverrides(): Promise<void> {
  const age = textOverridesAge();
  if (age < REFRESH_MS) return;
  const first = age > 1e12; // never loaded in this process
  loading ??= loadTextOverrides()
    .then(() => undefined)
    .catch((e) => console.error("[site text] could not load edits", e))
    .finally(() => (loading = null));
  if (first) await loading;
}
