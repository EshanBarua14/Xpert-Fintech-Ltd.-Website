"use client";

import { updateApplication, type ApplicationState } from "@/app/admin/(protected)/careers/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextArea } from "@/components/ui/Field";
import { APPLICATION_STATUSES } from "@/lib/admin/labels";

/** Status and private notes for one application. */
export function ApplicationReview({ id, status, notes }: { id: string; status: string; notes: string }) {
  const { state, pending, onSubmit } = useActionForm<ApplicationState>(updateApplication, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-fg/10 p-5" noValidate>
      <input type="hidden" name="id" value={id} />
      <h2 className="font-semibold">Review</h2>
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <Select id="status" label="Status" options={[...APPLICATION_STATUSES]} defaultValue={status} error={e.status} />
      <TextArea id="adminNotes" label="Notes" hint="Private to admins. Never shown to the applicant." rows={5} defaultValue={notes} error={e.adminNotes} />
      <div>
        <SubmitButton pending={pending}>Save</SubmitButton>
      </div>
    </form>
  );
}
