"use client";

import Image from "next/image";
import { saveScreenDetails, type FormState } from "@/app/admin/(protected)/products/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";

export type ScreenRow = { id: string; url: string; width: number | null; height: number | null; device: string; captionEn: string; captionBn: string };

/**
 * Admin → Products → Screen details: where each saved screenshot appears in the
 * 3D display (web, tablet or phone) and its caption. "By shape" puts wide
 * screens on web and tablet and tall ones on the phone.
 */
export function ScreenDetailsForm({ offeringId, rows }: { offeringId: string; rows: ScreenRow[] }) {
  const { state, pending, onSubmit } = useActionForm<FormState>(saveScreenDetails, {});
  const e = state.errors ?? {};
  if (!rows.length) return <p className="text-sm text-text-secondary">Add screenshots above and save; then choose here where each one appears.</p>;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="offeringId" value={offeringId} />
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.id} className="grid items-start gap-4 rounded-card border border-fg/10 p-4 md:grid-cols-[9rem_12rem_1fr]">
            <div className="flex flex-col gap-1.5">
              <span className="relative block aspect-[16/10] overflow-hidden rounded-lg bg-fg/[0.04]">
                <Image src={r.url} alt="" fill sizes="9rem" className="object-cover object-top" />
              </span>
              <span className="text-xs text-text-secondary">
                Screen {i + 1}
                {r.width && r.height ? ` · ${r.width}×${r.height}` : ""}
              </span>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Show on</span>
              <select name={`device_${r.id}`} defaultValue={r.device} className="h-10 rounded-control border border-fg/15 bg-transparent px-3">
                <option value="">By its shape</option>
                <option value="WEB">Web (browser)</option>
                <option value="TABLET">Tablet</option>
                <option value="PHONE">Phone</option>
              </select>
              {e[`device_${r.id}`] && <span className="text-market-down">{e[`device_${r.id}`]}</span>}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Caption (English)</span>
                <input name={`caption_en_${r.id}`} defaultValue={r.captionEn} maxLength={300} className="h-10 rounded-control border border-fg/15 bg-transparent px-3" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Caption (Bangla)</span>
                <input name={`caption_bn_${r.id}`} lang="bn" defaultValue={r.captionBn} maxLength={300} className="h-10 rounded-control border border-fg/15 bg-transparent px-3" />
              </label>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <SubmitButton pending={pending}>Save screen details</SubmitButton>
      </div>
    </form>
  );
}
