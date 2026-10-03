"use client";

import { saveCaseStudy, type CaseStudyState } from "@/app/admin/(protected)/case-studies/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";

type Text = { title: string; slug: string; summary: string; challenge: string; solution: string; outcome: string };
export type CaseStudyFormValues = { id?: string; status: "DRAFT" | "PUBLISHED"; publishAt: string; sortOrder: number; coverMediaId: string; en: Text; bn: Text };

const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Title" },
  { name: "Summary", label: "Summary", kind: "textarea", rows: 3, hint: "Shown on the case studies list." },
  { name: "Challenge", label: "The challenge", kind: "textarea", rows: 6 },
  { name: "Solution", label: "What we did", kind: "textarea", rows: 6 },
  { name: "Outcome", label: "The outcome", kind: "textarea", rows: 6, hint: "Only results the client has agreed to share, with sources for any figures." },
];

export function CaseStudyForm({ values, images }: { values: CaseStudyFormValues; images: ImageOption[] }) {
  const { state, pending, onSubmit } = useActionForm<CaseStudyState>(saveCaseStudy, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} slugBase="case-studies" />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} slugBase="case-studies" />
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Media</legend>
          <ImagePicker name="coverMediaId" label="Cover image" options={images} defaultValue={values.coverMediaId} error={e.coverMediaId} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
