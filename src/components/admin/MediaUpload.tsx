"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadMedia } from "@/app/admin/(protected)/media/actions";
import { SubmitButton } from "@/components/admin/AdminUi";
import { DEFAULT_REQUEST_BYTES, fitForUpload, mbText } from "@/lib/media/client-upload";

/**
 * Uploads to the media library, one file per request so no request is ever over
 * the host's size limit (`maxRequestBytes`, about 4 MB on Vercel). Large photos
 * are made smaller in the browser first; a PDF or video over the limit is
 * reported with what to do instead.
 */
export function MediaUpload({ maxRequestBytes = DEFAULT_REQUEST_BYTES }: { maxRequestBytes?: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [round, setRound] = useState(0);

  async function upload(files: File[]) {
    setMessage(null);
    setProblems([]);
    if (!files.length) {
      setProblems(["Choose at least one file."]);
      return;
    }
    if (files.length > 10) {
      setProblems(["Upload at most 10 files at a time."]);
      return;
    }
    const found: string[] = [];
    let uploaded = 0;
    for (const [i, original] of files.entries()) {
      setBusy(`Uploading ${i + 1} of ${files.length}…`);
      const file = await fitForUpload(original, maxRequestBytes);
      if (!file) {
        found.push(
          /^video\//.test(original.type)
            ? `${original.name}: ${mbText(original.size)} is more than this server accepts (${mbText(maxRequestBytes)}). Upload the video to YouTube, Vimeo or Facebook and add the link in Admin → Videos.`
            : `${original.name}: ${mbText(original.size)} is more than this server accepts (${mbText(maxRequestBytes)}). Make the file smaller and try again.`,
        );
        continue;
      }
      const fd = new FormData();
      fd.append("files", file);
      try {
        const res = await uploadMedia({}, fd);
        uploaded += res.uploaded ?? 0;
        if (res.errors?.files) found.push(res.errors.files);
      } catch {
        found.push(`${original.name}: could not be uploaded. Check your connection and try again.`);
      }
    }
    setBusy(null);
    setProblems(found);
    if (uploaded) {
      setMessage(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.`);
      setRound((r) => r + 1);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("files") as HTMLInputElement | null;
        void upload(Array.from(input?.files ?? []));
      }}
      className="flex flex-col gap-3 rounded-card border border-dashed border-fg/20 p-5"
    >
      <label htmlFor="files" className="text-sm font-medium">
        Upload images, PDFs or short videos
      </label>
      <input
        key={round}
        id="files"
        name="files"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4,video/webm"
        aria-describedby="files-hint"
        className="text-sm file:mr-4 file:rounded-control file:border-0 file:bg-brand-royal file:px-4 file:py-2 file:text-white"
      />
      <p id="files-hint" className="text-xs text-text-secondary">
        PNG, JPEG, WebP or GIF images, PDFs and short MP4 or WebM videos, up to 10 files at a time. Each file can be up to {mbText(maxRequestBytes)} on
        this server; larger photos are made smaller automatically. SVG is not accepted for security reasons. For videos, upload to YouTube, Vimeo or
        Facebook and add the link in Admin → Videos.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={!!busy} pendingLabel={busy ?? "Uploading…"}>
          Upload
        </SubmitButton>
        {message && (
          <span role="status" className="text-sm text-market-up">
            {message}
          </span>
        )}
      </div>
      {problems.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-market-down">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
