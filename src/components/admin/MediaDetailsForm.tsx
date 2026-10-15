"use client";

import { saveMediaDetails, type MediaState } from "@/app/admin/(protected)/media/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { TextInput } from "@/components/ui/Field";
import { FocalPointPicker } from "./FocalPointPicker";

export type MediaDetailsValues = {
  id: string;
  enAlt: string;
  bnAlt: string;
  enCaption: string;
  bnCaption: string;
  tags: string;
  /** For images: the file, its size and the face point, for the face position control. */
  url?: string;
  width?: number | null;
  height?: number | null;
  focal?: { x: number; y: number; zoom: number | null } | null;
};

export function MediaDetailsForm({ values, isImage }: { values: MediaDetailsValues; isImage: boolean }) {
  const { state, pending, onSubmit } = useActionForm<MediaState>(saveMediaDetails, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <input type="hidden" name="id" value={values.id} />
      {isImage && (
        <>
          <TextInput
            id="enAlt"
            label="Alt text (English)"
            hint="Describes the image for screen readers and search engines."
            defaultValue={values.enAlt}
            error={e.enAlt}
          />
          <TextInput id="bnAlt" label="Alt text (বাংলা)" lang="bn" defaultValue={values.bnAlt} error={e.bnAlt} />
        </>
      )}
      <TextInput id="enCaption" label="Caption (English)" defaultValue={values.enCaption} error={e.enCaption} />
      <TextInput id="bnCaption" label="Caption (বাংলা)" lang="bn" defaultValue={values.bnCaption} error={e.bnCaption} />
      {isImage && values.url && <FocalPointPicker url={values.url} width={values.width ?? null} height={values.height ?? null} initial={values.focal ?? null} />}
      <div className="md:col-span-2">
        <TextInput id="tags" label="Tags" hint="Comma separated, e.g. oms, screenshot" defaultValue={values.tags} error={e.tags} />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <SubmitButton pending={pending}>Save</SubmitButton>
        {state.message && !state.errors && (
          <span role="status" className="text-sm text-market-up">
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
