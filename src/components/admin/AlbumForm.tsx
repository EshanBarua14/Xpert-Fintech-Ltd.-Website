"use client";

import { saveAlbum, type AlbumState } from "@/app/admin/(protected)/albums/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";

type Text = { title: string; slug: string; description: string };
export type AlbumFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  takenAt: string;
  coverMediaId: string;
  photos: string[];
  en: Text;
  bn: Text;
};

const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Album title" },
  { name: "Description", label: "Description", kind: "textarea", rows: 3, hint: "Optional. One or two sentences shown above the photos." },
];

export function AlbumForm({ values, images }: { values: AlbumFormValues; images: ImageOption[] }) {
  const { state, pending, onSubmit } = useActionForm<AlbumState>(saveAlbum, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} slugBase="gallery" />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} slugBase="gallery" />
        <fieldset className="flex flex-col gap-3 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Photos</legend>
          <p className="text-xs text-text-secondary">
            Upload new photos here or pick from the media library. Add alt text to each photo in Media so the website can describe it to screen
            readers.
          </p>
          <GalleryPicker name="photos" options={images} defaultValue={values.photos} />
          {e.photos && <p className="text-xs text-market-down">{e.photos}</p>}
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
          <TextInput id="takenAt" type="date" label="Date" hint="Optional. When the photos were taken." defaultValue={values.takenAt} error={e.takenAt} />
          <ImagePicker name="coverMediaId" label="Cover photo" options={images} defaultValue={values.coverMediaId} error={e.coverMediaId} />
          <p className="-mt-2 text-xs text-text-secondary">Optional. Without one, the first photo is the cover.</p>
          <TextInput id="sortOrder" type="number" min={0} label="Order" hint="Lower numbers appear first among albums of the same date." defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
