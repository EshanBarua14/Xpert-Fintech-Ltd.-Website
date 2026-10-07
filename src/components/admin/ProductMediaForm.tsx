"use client";

import Link from "next/link";
import { useState } from "react";
import { saveOfferingMedia, type FormState } from "@/app/admin/(protected)/products/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Select, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { parseVideoUrl } from "@/lib/public/text";

export type ProductMediaValues = {
  screenshots: string[];
  source: "NONE" | "LINK" | "FILE";
  videoUrl: string;
  videoFileId: string;
  posterMediaId: string;
  captionEn: string;
  captionBn: string;
};

const PROVIDER_NAMES = { YOUTUBE: "YouTube", VIMEO: "Vimeo", FACEBOOK: "Facebook" } as const;

/** Admin → Products → a product: its screens (ordered) and its demo video. */
export function ProductMediaForm({
  offeringId,
  values,
  images,
  files,
}: {
  offeringId: string;
  values: ProductMediaValues;
  images: ImageOption[];
  files: { value: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useActionForm<FormState>(saveOfferingMedia, {});
  const e = state.errors ?? {};
  const [source, setSource] = useState(values.source);
  const [url, setUrl] = useState(values.videoUrl);
  const link = parseVideoUrl(url);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="offeringId" value={offeringId} />
      <FormMessage message={state.message} isError={Boolean(state.errors)} />

      <fieldset className="flex flex-col gap-3 rounded-card border border-fg/10 p-5">
        <legend className="px-2 text-sm font-semibold">Product screens</legend>
        <p className="text-sm text-text-secondary">
          Screenshots of the real product, in the order they should appear. The first one is shown large. PNG or JPG, 1600 px wide or more.
        </p>
        <GalleryPicker name="screenshots" options={images} defaultValue={values.screenshots} />
        {e.screenshots && <p className="text-sm text-market-down">{e.screenshots}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
        <legend className="px-2 text-sm font-semibold">Demo video</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Demo video">
          {(
            [
              ["NONE", "No video"],
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

        {source === "LINK" && (
          <>
            <TextInput
              id="videoUrl"
              type="url"
              label="Video address"
              placeholder="https://www.youtube.com/watch?v=…"
              hint="Paste the address from the browser or the Share button."
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              error={e.videoUrl}
            />
            {url && (
              <p className={"text-xs " + (link ? "text-market-up" : "text-market-down")} role="status">
                {link ? `✓ ${PROVIDER_NAMES[link.provider]} video recognised.` : "Not a YouTube, Vimeo or Facebook video address yet."}
              </p>
            )}
          </>
        )}
        {source !== "LINK" && <input type="hidden" name="videoUrl" value="" />}

        {source === "FILE" &&
          (files.length === 0 ? (
            <p className="rounded-control border border-dashed border-fg/20 p-4 text-sm text-text-secondary">
              No video files yet.{" "}
              <Link href="/admin/media" className="text-brand-sky hover:underline">
                Upload an MP4 or WebM in Media
              </Link>{" "}
              (up to 45 MB), then come back.
            </p>
          ) : (
            <Select id="videoFileId" label="Video file" options={files} placeholder="Choose a file…" defaultValue={values.videoFileId} error={e.videoFileId} />
          ))}

        {source !== "NONE" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <ImagePicker name="posterMediaId" label="Still before it plays" options={images} defaultValue={values.posterMediaId} error={e.posterMediaId} />
              <p className="text-xs text-text-secondary">YouTube videos get one automatically.</p>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput id="captionEn" label="Caption (English)" placeholder="Placing an order with pre-trade checks" defaultValue={values.captionEn} error={e.captionEn} />
              <TextInput id="captionBn" label="ক্যাপশন (বাংলা)" defaultValue={values.captionBn} error={e.captionBn} />
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <SubmitButton pending={pending}>Save screens and video</SubmitButton>
      </div>
    </form>
  );
}
