"use client";

import {
  addLeadActivity,
  createLead,
  updateLeadDetails,
  updateLeadPipeline,
  type LeadAdminState,
} from "@/app/admin/(protected)/leads/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import {
  ACTIVITY_KINDS,
  ACTIVITY_LABELS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPES,
  LEAD_STATUSES,
  STATUS_LABELS,
} from "@/lib/validation/lead";

type Option = { value: string; label: string };

export type LeadDetailValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  businessType: string;
  interestedOfferingId: string;
  expectedRequirement: string;
  message: string;
  preferredContact: string;
};

const initial: LeadAdminState = {};

/** Contact details — used to add a lead by hand and to correct one. */
export function LeadDetailsForm({ values, offerings }: { values: LeadDetailValues; offerings: Option[] }) {
  const { state, pending, onSubmit } = useActionForm(values.id ? updateLeadDetails : createLead, initial);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FormMessage message={state.message} isError={!state.savedAt} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput id="name" label="Full name" required defaultValue={values.name} error={e.name} />
        <TextInput id="email" type="email" label="Email" required defaultValue={values.email} error={e.email} />
        <TextInput id="phone" type="tel" label="Phone" defaultValue={values.phone} error={e.phone} />
        <TextInput id="organization" label="Organization" defaultValue={values.organization} error={e.organization} />
        <TextInput id="designation" label="Designation" defaultValue={values.designation} error={e.designation} />
        <Select
          id="businessType"
          label="Type of organization"
          defaultValue={values.businessType}
          options={[{ value: "", label: "—" }, ...BUSINESS_TYPES.map((b) => ({ value: b, label: BUSINESS_TYPE_LABELS[b] }))]}
        />
        <Select
          id="interestedOfferingId"
          label="Product of interest"
          defaultValue={values.interestedOfferingId}
          options={[{ value: "", label: "Not specified" }, ...offerings]}
        />
        <Select
          id="preferredContact"
          label="Preferred contact"
          defaultValue={values.preferredContact}
          options={[
            { value: "ANY", label: "Any" },
            { value: "EMAIL", label: "Email" },
            { value: "PHONE", label: "Phone call" },
            { value: "WHATSAPP", label: "WhatsApp" },
          ]}
        />
      </div>
      <TextArea id="expectedRequirement" label="Requirement" rows={3} defaultValue={values.expectedRequirement} error={e.expectedRequirement} />
      <TextArea id="message" label="Message" rows={4} defaultValue={values.message} error={e.message} />
      <div>
        <SubmitButton pending={pending}>{values.id ? "Save details" : "Add lead"}</SubmitButton>
      </div>
    </form>
  );
}

/** Status, owner and follow-up date. */
export function LeadPipelineForm({
  id,
  status,
  ownerId,
  followUpAt,
  owners,
}: {
  id: string;
  status: string;
  ownerId: string;
  followUpAt: string;
  owners: Option[];
}) {
  const { state, pending, onSubmit } = useActionForm(updateLeadPipeline, initial);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <Select id="status" label="Status" defaultValue={status} options={LEAD_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} />
      <Select id="ownerId" label="Owner" defaultValue={ownerId} options={[{ value: "", label: "Unassigned" }, ...owners]} />
      <TextInput
        id="followUpAt"
        type="datetime-local"
        label="Follow up on"
        hint="Bangladesh time"
        defaultValue={followUpAt}
        error={state.errors?.followUpAt}
      />
      <FormMessage message={state.message} isError={!state.savedAt} />
      <div>
        <SubmitButton pending={pending}>Save</SubmitButton>
      </div>
    </form>
  );
}

/** Log a note, call, email or meeting. Empties itself after saving. */
export function LeadActivityForm({ leadId }: { leadId: string }) {
  const { state, pending, onSubmit } = useActionForm(addLeadActivity, initial);
  return (
    <form key={state.savedAt ?? 0} onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <Select id="kind" label="Type" defaultValue="NOTE" options={ACTIVITY_KINDS.map((k) => ({ value: k, label: ACTIVITY_LABELS[k] }))} />
        <TextArea id="body" label="What happened?" rows={3} required error={state.errors?.body} />
      </div>
      {!state.errors?.body && <FormMessage message={state.message} isError />}
      <div>
        <SubmitButton pending={pending} pendingLabel="Adding…">
          Add to history
        </SubmitButton>
      </div>
    </form>
  );
}
