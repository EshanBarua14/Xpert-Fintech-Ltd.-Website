"use client";

import { savePerson, type PersonState } from "@/app/admin/(protected)/people/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TextArea, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { DEPARTMENT_NAMES } from "@/lib/people/departments";
import { PERSON_GROUP_LABELS, PERSON_GROUPS, type PersonGroupKey } from "@/lib/validation/people";

export type PersonFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  photoMediaId: string;
  linkedinUrl: string;
  email: string;
  department: string;
  isPlaceholder: boolean;
  enName: string;
  bnName: string;
  enBio: string;
  bnBio: string;
  roles: Record<PersonGroupKey, { enabled: boolean; enTitle: string; bnTitle: string; order: number }>;
};

export function PersonForm({ values, images }: { values: PersonFormValues; images: ImageOption[] }) {
  const { state, pending, onSubmit } = useActionForm<PersonState>(savePerson, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />

        <fieldset className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">Person</legend>
          <TextInput id="enName" label="Name (English)" required defaultValue={values.enName} error={e.enName} />
          <TextInput id="bnName" label="Name (বাংলা)" lang="bn" defaultValue={values.bnName} error={e.bnName} />
          <TextArea id="enBio" label="Short bio (English)" rows={5} defaultValue={values.enBio} error={e.enBio} />
          <TextArea id="bnBio" label="Short bio (বাংলা)" rows={5} lang="bn" defaultValue={values.bnBio} error={e.bnBio} />
          <TextInput
            id="email"
            type="email"
            label="Work email"
            placeholder="name@xpertfintech.com"
            hint="Optional. Shown as an email icon on the card and in the profile."
            defaultValue={values.email}
            error={e.email}
          />
          <TextInput
            id="linkedinUrl"
            type="url"
            label="LinkedIn profile"
            placeholder="https://www.linkedin.com/in/…"
            hint="Optional. Shown as a LinkedIn icon on the card and in the profile."
            defaultValue={values.linkedinUrl}
            error={e.linkedinUrl}
          />
          <TextInput
            id="department"
            label="Department"
            list="department-options"
            placeholder="Engineering"
            hint="Optional. Colours the card and sets the filter on the Team page. Pick one or type a new one."
            defaultValue={values.department}
            error={e.department}
            autoComplete="off"
          />
          <datalist id="department-options">
            {DEPARTMENT_NAMES.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Roles</legend>
          <p className="text-xs text-text-secondary">
            Tick every group this person appears in. Each group has its own title and order.
          </p>
          {e.roles && (
            <p role="alert" className="text-xs text-market-down">
              {e.roles}
            </p>
          )}
          {PERSON_GROUPS.map((group) => {
            const r = values.roles[group];
            return (
              <div key={group} className="grid gap-4 rounded-control border border-fg/10 p-4 md:grid-cols-[180px_1fr_1fr_90px]">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name={`role.${group}`} defaultChecked={r.enabled} className="accent-brand-royal" />
                  {PERSON_GROUP_LABELS[group]}
                </label>
                <TextInput
                  id={`role.${group}.enTitle`}
                  label="Title (English)"
                  placeholder="e.g. Chairman"
                  defaultValue={r.enTitle}
                  error={e[`role.${group}.enTitle`]}
                />
                <TextInput id={`role.${group}.bnTitle`} label="Title (বাংলা)" lang="bn" defaultValue={r.bnTitle} />
                <TextInput id={`role.${group}.order`} type="number" min={0} label="Order" defaultValue={String(r.order)} />
              </div>
            );
          })}
        </fieldset>
      </div>

      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="isPlaceholder" defaultChecked={values.isPlaceholder} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Placeholder profile
              <span className="block text-xs text-text-secondary">A stand-in until the real name, photo and bio arrive. Untick once the real profile is in.</span>
            </span>
          </label>
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Photo</legend>
          <ImagePicker
            name="photoMediaId"
            label="Portrait"
            hint="A square or portrait photo works best."
            options={images}
            defaultValue={values.photoMediaId}
            error={e.photoMediaId}
          />
          <TextInput
            id="sortOrder"
            type="number"
            min={0}
            label="Overall order"
            hint="Used when a page lists everyone together."
            defaultValue={String(values.sortOrder)}
          />
        </fieldset>
      </aside>
    </form>
  );
}
