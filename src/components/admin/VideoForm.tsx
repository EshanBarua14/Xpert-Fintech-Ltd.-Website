"use client";

import Link from "next/link";
import { useState } from "react";
import { saveVideo, type VideoState } from "@/app/admin/(protected)/videos/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { Select, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { parseVideoUrl } from "@/lib/public/text";

type Text = { title: string; description: string };
export type VideoFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  source: "LINK" | "FILE";
  url: string;
  mediaId: string;
  posterMediaId: string;
  eventId: string;
  recordedAt: string;
  duration: string;
  isFeatured: boolean;
  en: Text;
  bn: Text;
};

const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Video title" },
  { name: "Description", label: "Description", kind: "textarea", rows: 3, hint: "Optional. Shown under the player." },
];

const PROVIDER_NAMES = { YOUTUBE: "YouTube", VIMEO: "Vimeo", FACEBOOK: "Facebook" } as const;

export function VideoForm({
  values,
  images,
  files,
  events,
}: {
  values: VideoFormValues;
  images: ImageOption[];
  files: { value: string; label: string }[];
  events: { value: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useActionForm<VideoState>(saveVideo, {});
  const e = state.errors ?? {};
  const [source, setSource] = useState<"LINK" | "FILE">(values.source);
  const [url, setUrl] = useState(values.url);
  const link = parseVideoUrl(url);

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Video</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Where the video is">
            {(
              [
                ["LINK", "YouTube, Vimeo or Facebook link"],
                ["FILE", "Uploaded MP4 / WebM file"],
              ] as const
            ).map(([k, label]) => (
              <label
                key={k}
                className={
                  "flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2 text-sm " +
                  (source === k ? "border-brand-sky bg-brand-sky/10" : "border-fg/15 hover:border-fg/30")
                }
              >
                <input type="radio" name="source" value={k} checked={source === k} onChange={() => setSource(k)} className="accent-brand-royal" />
                {label}
              </label>
            ))}
          </div>
          {source === "LINK" ? (
            <>
              <TextInput
                id="url"
                type="url"
                label="Video address"
                placeholder="https://www.youtube.com/watch?v=…"
                hint="Paste the address from the browser or the Share button. Recommended for anything longer than a minute."
                value={url}
                onChange={(ev) => setUrl(ev.target.value)}
                error={e.url}
              />
              {url && (
                <p className={"text-xs " + (link ? "text-market-up" : "text-market-down")} role="status">
                  {link ? `✓ ${PROVIDER_NAMES[link.provider]} video recognised.` : "Not a YouTube, Vimeo or Facebook video address yet."}
                </p>
              )}
              {link && (
                <div className="aspect-video w-full max-w-xl overflow-hidden rounded-control border border-fg/10 bg-black">
                  <iframe src={link.embedUrl} title="Preview" className="h-full w-full" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
                </div>
              )}
            </>
          ) : (
            <>
              <input type="hidden" name="url" value="" />
              {files.length === 0 ? (
                <p className="rounded-control border border-dashed border-fg/20 p-4 text-sm text-text-secondary">
                  No video files yet.{" "}
                  <Link href="/admin/media" className="text-brand-sky hover:underline">
                    Upload an MP4 or WebM in Media
                  </Link>{" "}
                  (up to 45 MB), then come back.
                </p>
              ) : (
                <Select id="mediaId" label="Video file" options={files} placeholder="Choose a file…" defaultValue={values.mediaId} error={e.mediaId} />
              )}
            </>
          )}
        </fieldset>
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} />
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Feature at the top of the Gallery
              <span className="block text-xs text-text-secondary">Only one video is featured; choosing this one replaces the current one.</span>
            </span>
          </label>
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <ImagePicker name="posterMediaId" label="Thumbnail" options={images} defaultValue={values.posterMediaId} error={e.posterMediaId} />
          <p className="-mt-2 text-xs text-text-secondary">YouTube videos get a thumbnail automatically. Add one for Vimeo, Facebook and uploaded videos.</p>
          <Select id="eventId" label="Event" options={[{ value: "", label: "— Not linked to an event —" }, ...events]} defaultValue={values.eventId} error={e.eventId} />
          <TextInput id="recordedAt" type="date" label="Date" hint="Optional. When it was recorded." defaultValue={values.recordedAt} error={e.recordedAt} />
          <TextInput id="duration" label="Length" placeholder="3:45" hint="Optional, minutes:seconds." defaultValue={values.duration} error={e.duration} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
