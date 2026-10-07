"use client";

import { saveLeaderMessage, type MessageState } from "@/app/admin/(protected)/messages/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextArea } from "@/components/ui/Field";

export type LeaderMessageValues = { key: "chairman" | "md"; personKey: string; en: string; bn: string; published: boolean };

export function LeaderMessageForm({ values, people }: { values: LeaderMessageValues; people: { value: string; label: string }[] }) {
  const { state, pending, onSubmit } = useActionForm<MessageState>(saveLeaderMessage, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="key" value={values.key} />
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <Select
        id={`personKey-${values.key}`}
        name="personKey"
        label="Signed by"
        hint="Name, title and photo come from Admin → People."
        options={people}
        placeholder="Choose a person"
        defaultValue={values.personKey}
        error={e.personKey}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <TextArea
          id={`en-${values.key}`}
          name="en"
          label="Message (English)"
          rows={12}
          hint="Leave a blank line between paragraphs."
          defaultValue={values.en}
          error={e.en}
        />
        <TextArea id={`bn-${values.key}`} name="bn" label="Message (বাংলা)" rows={12} lang="bn" hint="Empty = the English text is shown." defaultValue={values.bn} error={e.bn} />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="published" defaultChecked={values.published} className="mt-0.5 h-4 w-4 accent-brand-royal" />
        <span>
          Publish on the website
          <span className="block text-xs text-text-secondary">Only tick this once the signatory has approved the wording.</span>
        </span>
      </label>
      <div>
        <SubmitButton pending={pending}>Save message</SubmitButton>
      </div>
    </form>
  );
}
