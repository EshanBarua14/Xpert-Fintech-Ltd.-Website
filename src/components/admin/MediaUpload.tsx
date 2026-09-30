"use client";

import { useEffect, useState } from "react";
import { uploadMedia, type UploadState } from "@/app/admin/(protected)/media/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";

// Must stay within serverActions.bodySizeLimit in next.config.ts (50 MB).
const MAX_BATCH_BYTES = 45 * 1024 * 1024;

export function MediaUpload() {
  const { state, pending, onSubmit } = useActionForm<UploadState>(uploadMedia, {});
  const [clientError, setClientError] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  // After a successful upload, remount the input so it is empty again.
  useEffect(() => {
    if (state.savedAt && state.uploaded) setRound((r) => r + 1);
  }, [state.savedAt, state.uploaded]);

  return (
    <form
      onSubmit={(e) => {
        const input = e.currentTarget.elements.namedItem("files") as HTMLInputElement | null;
        const total = Array.from(input?.files ?? []).reduce((sum, f) => sum + f.size, 0);
        if (total > MAX_BATCH_BYTES) {
          e.preventDefault();
          setClientError("These files add up to more than 45 MB. Upload them in smaller groups.");
          return;
        }
        setClientError(null);
        onSubmit(e);
      }}
      className="flex flex-col gap-3 rounded-card border border-dashed border-white/20 p-5"
    >
      <label htmlFor="files" className="text-sm font-medium">
        Upload images or PDFs
      </label>
      <input
        key={round}
        id="files"
        name="files"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        aria-describedby="files-hint"
        className="text-sm file:mr-4 file:rounded-control file:border-0 file:bg-brand-royal file:px-4 file:py-2 file:text-white"
      />
      <p id="files-hint" className="text-xs text-text-secondary">
        PNG, JPEG, WebP or GIF up to 10 MB; PDF up to 25 MB; up to 10 files at a time. SVG is not accepted for security
        reasons. Add videos as YouTube or Vimeo links on the product page.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending} pendingLabel="Uploading…">
          Upload
        </SubmitButton>
        {state.message && (
          <span role="status" className="text-sm text-market-up">
            {state.message}
          </span>
        )}
      </div>
      {(clientError || state.errors?.files) && (
        <p role="alert" className="text-sm text-market-down">
          {clientError ?? state.errors?.files}
        </p>
      )}
    </form>
  );
}
