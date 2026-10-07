"use client";

import { deleteRedirect, saveRedirect, type RedirectState } from "@/app/admin/(protected)/redirects/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextInput } from "@/components/ui/Field";

type Values = { id?: string; fromPath: string; toPath: string; statusCode: number; isActive: boolean; note: string };

/** One redirect (or the "add" form when there is no id). */
export function RedirectForm({ values, hits }: { values: Values; hits?: number }) {
  const { state, pending, onSubmit } = useActionForm<RedirectState>(saveRedirect, {});
  const e = state.errors ?? {};
  const k = values.id ?? "new";
  return (
    <div className="rounded-card border border-fg/10 p-4">
      <form key={values.id ? undefined : state.savedAt} onSubmit={onSubmit} className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_150px]" noValidate>
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <TextInput id={`from-${k}`} name="fromPath" label="Old address" placeholder="/about-us.html" defaultValue={values.fromPath} error={e.fromPath} />
        <TextInput id={`to-${k}`} name="toPath" label="Send visitors to" placeholder="/en/company/about" defaultValue={values.toPath} error={e.toPath} />
        <Select
          id={`code-${k}`}
          name="statusCode"
          label="Type"
          defaultValue={String(values.statusCode)}
          options={[
            { value: "301", label: "Permanent (301)" },
            { value: "302", label: "Temporary (302)" },
          ]}
        />
        <TextInput id={`note-${k}`} name="note" label="Note (optional)" defaultValue={values.note} error={e.note} className="md:col-span-1" />
        <label className="flex h-12 items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="size-4 accent-brand-sky" />
          On
        </label>
        <div>
          <SubmitButton pending={pending}>{values.id ? "Save" : "Add redirect"}</SubmitButton>
        </div>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        {values.id && (
          <form action={deleteRedirect} className="ml-auto flex items-center gap-3 text-xs text-text-secondary">
            <input type="hidden" name="id" value={values.id} />
            <span>Used {hits ?? 0} time(s)</span>
            <ConfirmButton message={`Delete the redirect from ${values.fromPath}? Visitors to that address will see “page not found”.`}>Delete</ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}
