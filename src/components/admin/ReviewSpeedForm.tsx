"use client";

import { saveReviewSpeed, type ReviewSpeedState } from "@/app/admin/(protected)/testimonials/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select } from "@/components/ui/Field";

/** How fast the home-page review slider moves on by itself. */
export function ReviewSpeedForm({ seconds, choices }: { seconds: number; choices: readonly number[] }) {
  const { state, pending, onSubmit } = useActionForm<ReviewSpeedState>(saveReviewSpeed, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4" noValidate>
      <div className="min-w-[14rem]">
        <Select
          id="slideSeconds"
          label="Slider moves on every"
          hint="It still pauses on hover, keyboard focus and for visitors who prefer less motion."
          defaultValue={String(seconds)}
          options={choices.map((c) => ({ value: String(c), label: `${c} seconds${c === 4 ? " (default)" : ""}` }))}
          error={state.errors?.slideSeconds}
        />
      </div>
      <SubmitButton pending={pending}>Save</SubmitButton>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
    </form>
  );
}
