"use client";

import { useState } from "react";
import { saveEvent, type EventState } from "@/app/admin/(protected)/events/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TextArea, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { slugify } from "@/lib/validation/common";

type Text = { title: string; slug: string; summary: string; body: string; location: string };

export type EventFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  dateIsApprox: boolean;
  coverMediaId: string;
  videoUrl: string;
  legacyUrl: string | null;
  participants: string[];
  en: Text;
  bn: Text;
};

function Language({ l, values, errors }: { l: "en" | "bn"; values: Text; errors: Record<string, string> }) {
  const [slug, setSlug] = useState(values.slug);
  const [touched, setTouched] = useState(Boolean(values.slug));
  const k = (f: string) => `${l}${f}`;
  return (
    <fieldset lang={l} className="grid gap-5 rounded-card border border-white/10 p-5 md:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
      <TextInput
        id={k("Title")}
        label="Title"
        required={l === "en"}
        defaultValue={values.title}
        onChange={(e) => l === "en" && !touched && setSlug(slugify(e.target.value))}
        error={errors[k("Title")]}
      />
      <TextInput
        id={k("Slug")}
        label="URL slug"
        hint={l === "en" ? "Shown in the address: /en/events/your-slug" : "Leave empty to reuse the English slug."}
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setTouched(true);
        }}
        error={errors[k("Slug")]}
      />
      <TextInput id={k("Location")} label="Location" defaultValue={values.location} error={errors[k("Location")]} />
      <div />
      <div className="md:col-span-2">
        <TextArea id={k("Summary")} label="Summary" rows={3} hint="Shown in event lists." defaultValue={values.summary} error={errors[k("Summary")]} />
      </div>
      <div className="md:col-span-2">
        <TextArea id={k("Body")} label="Full story" rows={10} defaultValue={values.body} error={errors[k("Body")]} />
      </div>
    </fieldset>
  );
}

export function EventForm({
  values,
  images,
  organizations,
}: {
  values: EventFormValues;
  images: ImageOption[];
  organizations: { value: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useActionForm<EventState>(saveEvent, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <Language l="en" values={values.en} errors={e} />
        <Language l="bn" values={values.bn} errors={e} />
        <fieldset className="flex flex-col gap-3 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Participating organizations</legend>
          <p className="text-xs text-text-secondary">Shown on the event page. Only tick organizations you may name publicly.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="participants"
                  value={o.value}
                  defaultChecked={values.participants.includes(o.value)}
                  className="accent-brand-royal"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">When</legend>
          <TextInput id="startsAt" type="date" label="Start date" defaultValue={values.startsAt} error={e.startsAt} />
          <TextInput id="endsAt" type="date" label="End date" hint="Optional, for multi-day events." defaultValue={values.endsAt} error={e.endsAt} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="dateIsApprox" defaultChecked={values.dateIsApprox} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Exact date not confirmed
              <span className="block text-xs text-text-secondary">The website shows only the month and year.</span>
            </span>
          </label>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Media</legend>
          <ImagePicker name="coverMediaId" label="Cover image" options={images} defaultValue={values.coverMediaId} error={e.coverMediaId} />
          <TextInput
            id="videoUrl"
            type="url"
            label="Video (YouTube or Vimeo)"
            placeholder="https://www.youtube.com/watch?v=…"
            defaultValue={values.videoUrl}
            error={e.videoUrl}
          />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
          {values.legacyUrl && <p className="text-xs text-text-secondary">Old site address: {values.legacyUrl}</p>}
        </fieldset>
      </aside>
    </form>
  );
}
