import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { SiteTextEditor, type TextRow } from "@/components/admin/SiteTextEditor";
import { defaultMessages } from "@/lib/i18n/messages";
import { TEXT_SETTING_KEY } from "@/lib/i18n/overrides";
import { groupOf, placeholders, TEXT_GROUPS } from "@/lib/i18n/groups";

/** Admin → Site text: every button, label and heading the site uses, in English and Bangla. */
export default async function SiteTextPage() {
  await requireAdmin();
  const row = await db.siteSetting.findUnique({ where: { key: TEXT_SETTING_KEY } });
  const saved = (row?.value ?? {}) as Record<string, Record<string, string>>;
  const en = defaultMessages("en") as Record<string, string>;
  const bn = defaultMessages("bn") as Record<string, string>;
  const rows: TextRow[] = Object.keys(en)
    .map((key) => ({
      key,
      group: groupOf(key),
      en: en[key]!,
      bn: bn[key] ?? "",
      enOverride: saved.en?.[key] ?? "",
      bnOverride: saved.bn?.[key] ?? "",
      placeholders: placeholders(en[key]!),
    }))
    .sort((a, b) => TEXT_GROUPS.indexOf(a.group) - TEXT_GROUPS.indexOf(b.group) || a.key.localeCompare(b.key));
  const edited = rows.filter((r) => r.enOverride || r.bnOverride).length;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Site text</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          Every button, label, heading and message on the website, in English and Bangla ({rows.length} texts, {edited} edited). Content such as products, people and news is
          edited in its own section; this page covers the words around it.
        </p>
      </div>
      <SiteTextEditor rows={rows} groups={TEXT_GROUPS.filter((g) => rows.some((r) => r.group === g))} />
    </div>
  );
}
