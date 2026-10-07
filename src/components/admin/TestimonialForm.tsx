"use client";

import { saveTestimonial, type TestimonialState } from "@/app/admin/(protected)/testimonials/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { Select, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";

type Text = { role: string; quote: string };
export type TestimonialFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  personName: string;
  organizationId: string;
  photoMediaId: string;
  hasApproval: boolean;
  en: Text;
  bn: Text;
};

const FIELDS: FieldSpec[] = [
  { name: "Role", label: "Their title", hint: "e.g. Managing Director" },
  { name: "Quote", label: "Quote", kind: "textarea", rows: 5, wide: true, hint: "Their words, as approved. One to three sentences reads best." },
];

export function TestimonialForm({ values, images, organizations }: { values: TestimonialFormValues; images: ImageOption[]; organizations: { value: string; label: string }[] }) {
  const { state, pending, onSubmit } = useActionForm<TestimonialState>(saveTestimonial, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <fieldset className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">Who said it</legend>
          <TextInput id="personName" label="Name" required defaultValue={values.personName} error={e.personName} />
          <Select
            id="organizationId"
            label="Organization"
            options={[{ value: "", label: "— None —" }, ...organizations]}
            defaultValue={values.organizationId}
            hint="Its name and logo are shown with the quote."
            error={e.organizationId}
          />
        </fieldset>
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} />
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="hasApproval" defaultChecked={values.hasApproval} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Written approval from this person is on file
              <span className="block text-xs text-text-secondary">Required to publish. Keep the email or letter with your records.</span>
            </span>
          </label>
          {e.hasApproval && <p className="text-sm text-market-down">{e.hasApproval}</p>}
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <ImagePicker name="photoMediaId" label="Photo (optional)" options={images} defaultValue={values.photoMediaId} error={e.photoMediaId} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" hint="Lower numbers come first in the slider." defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
