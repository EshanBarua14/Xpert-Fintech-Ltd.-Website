"use client";

import { saveResource, type ResourceState } from "@/app/admin/(protected)/resources/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { Select, TextInput } from "@/components/ui/Field";
import type { DocumentOption, ImageOption } from "@/lib/admin/media";
import { RESOURCE_KINDS } from "@/lib/admin/labels";

type Text = { title: string; slug: string; summary: string };
export type ResourceFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  kind: string;
  fileMediaId: string;
  externalUrl: string;
  coverMediaId: string;
  en: Text;
  bn: Text;
};

const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Title" },
  { name: "Summary", label: "Summary", kind: "textarea", rows: 3 },
];

export function ResourceForm({ values, images, documents }: { values: ResourceFormValues; images: ImageOption[]; documents: DocumentOption[] }) {
  const { state, pending, onSubmit } = useActionForm<ResourceState>(saveResource, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} slugBase="resources" />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} slugBase="resources" />
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">File or link</legend>
          <Select id="fileMediaId" label="PDF from the media library" placeholder="No file" options={documents} defaultValue={values.fileMediaId} hint="Upload PDFs in Media first." error={e.fileMediaId} />
          <TextInput id="externalUrl" type="url" label="…or a link" placeholder="https://" hint="Used when no file is chosen, e.g. a video." defaultValue={values.externalUrl} error={e.externalUrl} />
        </fieldset>
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <Select id="kind" label="Type" options={[...RESOURCE_KINDS]} defaultValue={values.kind} error={e.kind} />
          <ImagePicker name="coverMediaId" label="Cover image" options={images} defaultValue={values.coverMediaId} error={e.coverMediaId} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
