"use client";

import { saveCareer, type CareerState } from "@/app/admin/(protected)/careers/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { Select, TextInput } from "@/components/ui/Field";
import { EMPLOYMENT_TYPES } from "@/lib/admin/labels";

type Text = { title: string; slug: string; summary: string; about: string; responsibilities: string; requirements: string; benefits: string };

export type CareerFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  deadline: string;
  isClosed: boolean;
  linkedinUrl: string;
  bdjobsUrl: string;
  applyEmail: string;
  en: Text;
  bn: Text;
};

const LIST_HINT = "One item per line; each line becomes a bullet point. Start a line with ## to make it a small heading (for example ## Education).";
const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Job title" },
  { name: "Summary", label: "Summary", kind: "textarea", rows: 3, hint: "Shown on the jobs list and at the top of the job." },
  { name: "About", label: "About Xpert and why join", kind: "textarea", rows: 5, hint: "Optional. Paragraphs shown before the role details; leave a blank line between paragraphs." },
  { name: "Responsibilities", label: "Responsibilities", kind: "textarea", rows: 8, hint: LIST_HINT },
  { name: "Requirements", label: "Requirements", kind: "textarea", rows: 8, hint: LIST_HINT },
  { name: "Benefits", label: "What we offer", kind: "textarea", rows: 5, hint: LIST_HINT },
];

export function CareerForm({ values }: { values: CareerFormValues }) {
  const { state, pending, onSubmit } = useActionForm<CareerState>(saveCareer, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} slugBase="careers" />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} slugBase="careers" />
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="isClosed" defaultChecked={values.isClosed} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Closed to applications
              <span className="block text-xs text-text-secondary">Stays on the site, marked closed. Jobs also close after the deadline.</span>
            </span>
          </label>
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Ways to apply</legend>
          <p className="text-xs text-text-secondary">Shown as buttons next to the application form on the website.</p>
          <TextInput id="linkedinUrl" type="url" label="LinkedIn job post" placeholder="https://www.linkedin.com/jobs/view/…" hint="Empty: the button opens Xpert's LinkedIn jobs page." defaultValue={values.linkedinUrl} error={e.linkedinUrl} />
          <TextInput id="bdjobsUrl" type="url" label="Bdjobs job post" placeholder="https://jobs.bdjobs.com/jobdetails/?id=…" hint="Empty: no Bdjobs button." defaultValue={values.bdjobsUrl} error={e.bdjobsUrl} />
          <TextInput id="applyEmail" type="email" label="Apply by email to" placeholder="career@xpertfintech.com" hint="Empty: no email option. The subject is filled in with the job title." defaultValue={values.applyEmail} error={e.applyEmail} />
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Job details</legend>
          <TextInput id="department" label="Department" placeholder="Engineering" defaultValue={values.department} error={e.department} />
          <TextInput id="location" label="Location" placeholder="Dhaka" defaultValue={values.location} error={e.location} />
          <Select id="employmentType" label="Type" options={[...EMPLOYMENT_TYPES]} defaultValue={values.employmentType} error={e.employmentType} />
          <TextInput id="experience" label="Experience" placeholder="3+ years" defaultValue={values.experience} error={e.experience} />
          <TextInput id="deadline" type="date" label="Application deadline" hint="Optional." defaultValue={values.deadline} error={e.deadline} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
