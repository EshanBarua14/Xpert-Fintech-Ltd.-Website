"use client";

import { deleteTag, saveTag, type TagState } from "@/app/admin/(protected)/news/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { TextInput } from "@/components/ui/Field";

type Values = { id?: string; enName: string; bnName: string };

/** One tag row (or the "add" form when there is no id). */
export function TagForm({ values, articleCount }: { values: Values; articleCount?: number }) {
  const { state, pending, onSubmit } = useActionForm<TagState>(saveTag, {});
  const e = state.errors ?? {};
  const k = values.id ?? "new";
  return (
    <div className="rounded-card border border-fg/10 p-4">
      <form key={values.id ? undefined : state.savedAt} onSubmit={onSubmit} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate>
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <TextInput id={`tag-en-${k}`} name="enName" label="English" defaultValue={values.enName} error={e.enName} />
        <TextInput id={`tag-bn-${k}`} name="bnName" label="বাংলা" defaultValue={values.bnName} error={e.bnName} />
        <SubmitButton pending={pending}>{values.id ? "Save" : "Add"}</SubmitButton>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        {values.id && (
          <form action={deleteTag} className="ml-auto flex items-center gap-3 text-xs text-text-secondary">
            <input type="hidden" name="id" value={values.id} />
            <span>{articleCount ?? 0} article(s)</span>
            <ConfirmButton message="Delete this tag? It is removed from its articles; the articles stay.">Delete</ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}
