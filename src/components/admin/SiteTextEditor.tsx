"use client";

import { useMemo, useState } from "react";
import { saveSiteText, type SiteTextState } from "@/app/admin/(protected)/site-text/actions";
import { useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { cn } from "@/lib/utils/cn";

export type TextRow = {
  key: string;
  group: string;
  en: string; // default English
  bn: string; // default Bangla
  enOverride: string;
  bnOverride: string;
  placeholders: string[];
};

type Filter = "all" | "edited" | "bnSame";
const PER_PAGE = 40;

/**
 * Every interface string in English and Bangla, side by side. Editing a box
 * changes that text on the website; clearing it goes back to the default.
 * Only the changed strings are sent when saving.
 */
export function SiteTextEditor({ rows, groups }: { rows: TextRow[]; groups: string[] }) {
  const { state, pending, onSubmit } = useActionForm<SiteTextState>(saveSiteText, {});
  const [edits, setEdits] = useState<Record<string, string>>({}); // "en.key" → text
  const [group, setGroup] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const value = (r: TextRow, l: "en" | "bn") => edits[`${l}.${r.key}`] ?? (l === "en" ? r.enOverride : r.bnOverride);
  const shown = (r: TextRow, l: "en" | "bn") => value(r, l) || (l === "en" ? r.en : r.bn);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (group !== "all" && r.group !== group) return false;
      if (filter === "edited" && !(value(r, "en") || value(r, "bn"))) return false;
      if (filter === "bnSame" && shown(r, "bn").trim() !== shown(r, "en").trim()) return false;
      if (!needle) return true;
      return [r.key, shown(r, "en"), shown(r, "bn")].some((x) => x.toLowerCase().includes(needle));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, group, filter, q, edits]);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const dirty = Object.keys(edits).length;
  const err = state.errors ?? {};

  const changes = () => {
    const out: { en: Record<string, string>; bn: Record<string, string> } = { en: {}, bn: {} };
    for (const [k, v] of Object.entries(edits)) {
      const [l, ...rest] = k.split(".");
      out[l as "en" | "bn"][rest.join(".")] = v;
    }
    return JSON.stringify(out);
  };

  const box = (r: TextRow, l: "en" | "bn") => {
    const id = `${l}.${r.key}`;
    const v = value(r, l);
    const def = l === "en" ? r.en : r.bn;
    const long = def.length > 70;
    const Tag = long ? "textarea" : "input";
    return (
      <div className="flex flex-col gap-1">
        <Tag
          lang={l}
          value={v}
          placeholder={def}
          rows={long ? 3 : undefined}
          onChange={(e) => setEdits((m) => ({ ...m, [id]: e.target.value }))}
          aria-label={`${r.key} (${l === "en" ? "English" : "বাংলা"})`}
          aria-invalid={err[id] ? true : undefined}
          className={cn(
            "w-full rounded-lg border bg-fg/[0.03] px-3 py-2 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary/80 focus:border-brand-sky focus:outline-none",
            v ? "border-brand-sky/50" : "border-fg/15",
            err[id] && "border-market-down",
            long && "resize-y",
          )}
        />
        {err[id] && <p className="text-xs text-market-down">{err[id]}</p>}
        {v && (
          <button type="button" onClick={() => setEdits((m) => ({ ...m, [id]: "" }))} className="self-start text-xs text-text-secondary hover:text-fg">
            Back to default
          </button>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="changes" value={changes()} />
      <FormMessage message={state.message} isError={Boolean(state.errors)} />

      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-card border border-fg/10 bg-ink-950/95 p-3 backdrop-blur">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search English, Bangla or key"
          className="h-10 w-64 rounded-full border border-fg/15 bg-fg/[0.03] px-4 text-sm focus:border-brand-sky focus:outline-none"
        />
        <select
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setPage(1);
          }}
          className="field-select h-10 rounded-full border border-fg/15 bg-fg/[0.03] pl-4 text-sm"
          aria-label="Section"
        >
          <option value="all">All sections ({rows.length})</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g} ({rows.filter((r) => r.group === g).length})
            </option>
          ))}
        </select>
        <div role="group" aria-label="Show" className="flex gap-1">
          {(
            [
              ["all", "All"],
              ["edited", "Edited"],
              ["bnSame", "Bangla same as English"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => {
                setFilter(k);
                setPage(1);
              }}
              className={cn("h-10 rounded-full border px-3 text-sm", filter === k ? "border-brand-sky bg-brand-sky/10 text-fg" : "border-fg/15 text-text-secondary hover:text-fg")}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-text-secondary">{dirty ? `${dirty} unsaved` : "No unsaved changes"}</span>
        <button type="submit" disabled={pending || !dirty} className="h-10 rounded-full bg-brand-royal px-5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <p className="text-sm text-text-secondary">
        {list.length} text{list.length === 1 ? "" : "s"}. Grey text in a box is the current default; type to replace it, clear the box to go back to it. Words in {"{braces}"} are
        filled in by the site and must stay.
      </p>

      <div className="overflow-x-auto rounded-card border border-fg/10">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-fg/10 text-xs text-text-secondary">
            <tr>
              <th className="w-56 px-3 py-3 font-medium">Where</th>
              <th className="px-3 py-3 font-medium">English</th>
              <th className="px-3 py-3 font-medium">বাংলা</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fg/10">
            {visible.map((r) => (
              <tr key={r.key} className="align-top">
                <td className="px-3 py-3">
                  <span className="block font-mono text-xs break-all text-text-primary">{r.key}</span>
                  <span className="text-xs text-text-secondary">{r.group}</span>
                  {r.placeholders.length > 0 && <span className="mt-1 block font-mono text-[11px] text-gold">{r.placeholders.join(" ")}</span>}
                </td>
                <td className="px-3 py-3">{box(r, "en")}</td>
                <td className="px-3 py-3">{box(r, "bn")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-2">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="h-9 rounded-full border border-fg/15 px-3 text-sm disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page {current} of {pages}
          </span>
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="h-9 rounded-full border border-fg/15 px-3 text-sm disabled:opacity-40">
            Next
          </button>
        </nav>
      )}
    </form>
  );
}
