"use client";

import { useRef, useState } from "react";
import { uploadFileFromEditor } from "@/app/admin/(protected)/media/actions";
import { Select } from "@/components/ui/Field";
import { mbText } from "@/lib/media/client-upload";

/**
 * A video or PDF from the media library, with "Upload new" right here: the
 * uploaded file joins the library and is chosen at once (no trip to Admin → Media).
 */
export function MediaFileSelect({
  id,
  name,
  label,
  kind,
  options: initial,
  placeholder,
  defaultValue,
  hint,
  error,
}: {
  id: string;
  name?: string;
  label: string;
  kind: "VIDEO" | "DOCUMENT";
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | null;
  hint?: string;
  error?: string;
}) {
  const [options, setOptions] = useState(initial);
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const what = kind === "VIDEO" ? "video" : "PDF";

  async function upload(file: File) {
    setProblem(null);
    setBusy(`Uploading ${file.name} (${mbText(file.size)})…`);
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);
    try {
      const res = await uploadFileFromEditor(fd);
      if (res.option) {
        setOptions((o) => [res.option!, ...o.filter((x) => x.value !== res.option!.value)]);
        setValue(res.option.value);
      } else setProblem(res.problem ?? "Upload failed.");
    } catch {
      setProblem(
        kind === "VIDEO"
          ? `${file.name} (${mbText(file.size)}) could not be uploaded: it may be larger than this server accepts. Upload the video to YouTube, Vimeo or Facebook and add the link instead.`
          : `${file.name} (${mbText(file.size)}) could not be uploaded: it may be larger than this server accepts. Make the file smaller and try again.`,
      );
    }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <Select id={id} name={name ?? id} label={label} options={options} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} hint={hint} error={error} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="cursor-pointer rounded-control border border-fg/15 px-3 py-1.5 hover:border-brand-sky">
          Upload new {what}
          <input
            ref={fileRef}
            type="file"
            accept={kind === "VIDEO" ? "video/mp4,video/webm" : "application/pdf"}
            className="sr-only"
            disabled={!!busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {value && (
          <button type="button" className="text-xs text-text-secondary hover:text-market-down" onClick={() => setValue("")}>
            Remove
          </button>
        )}
        {busy && (
          <span role="status" className="text-xs text-text-secondary">
            {busy}
          </span>
        )}
        {problem && (
          <span role="alert" className="text-xs text-market-down">
            {problem}
          </span>
        )}
      </div>
    </div>
  );
}
