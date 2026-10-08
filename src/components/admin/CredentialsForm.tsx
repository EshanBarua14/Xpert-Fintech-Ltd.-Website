"use client";

import { saveCredentials, type CredentialsState } from "@/app/admin/(protected)/credentials/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextInput } from "@/components/ui/Field";

type Item = { orgKey: string; en: string; bn: string };

/** One row per membership or certification, in the order shown; two empty rows for new ones. */
export function CredentialsForm({ items, published, orgs, max }: { items: Item[]; published: boolean; orgs: { value: string; label: string }[]; max: number }) {
  const { state, pending, onSubmit } = useActionForm<CredentialsState>(saveCredentials, {});
  const e = state.errors ?? {};
  const rows = [...items, ...Array.from({ length: Math.max(0, Math.min(2, max - items.length)) }, () => ({ orgKey: "", en: "", bn: "" }))];
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <ol className="flex flex-col gap-4">
        {rows.map((r, i) => (
          <li key={i} className="grid gap-4 rounded-card border border-fg/10 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Select
              id={`orgKey-${i}`}
              name={`orgKey-${i}`}
              label={`${i + 1}. Granted by`}
              hint="Logo, name and website come from Admin → Organizations."
              options={orgs}
              placeholder="Choose an organization"
              defaultValue={r.orgKey}
              error={e[`orgKey-${i}`]}
            />
            <TextInput id={`en-${i}`} name={`en-${i}`} label="What XFL holds (English)" placeholder="FIX & ITCH certified" defaultValue={r.en} error={e[`en-${i}`]} maxLength={80} />
            <TextInput id={`bn-${i}`} name={`bn-${i}`} label="বাংলা" lang="bn" hint="Empty = English is shown." defaultValue={r.bn} error={e[`bn-${i}`]} maxLength={80} />
          </li>
        ))}
      </ol>
      <p className="text-xs text-text-secondary">To remove one, clear its row. To reorder, retype the rows in the order you want.</p>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={published} className="mt-0.5 h-4 w-4 accent-brand-royal" />
        <span>Show on the website (home page and footer)</span>
      </label>
      <div>
        <SubmitButton pending={pending}>Save credentials</SubmitButton>
      </div>
    </form>
  );
}
