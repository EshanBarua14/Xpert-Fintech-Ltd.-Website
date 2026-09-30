"use client";

import { ConfirmButton } from "@/components/admin/AdminUi";
import { buttonClasses } from "@/components/ui/Button";

type IdAction = (formData: FormData) => Promise<void>;

/**
 * The "danger zone" at the bottom of every edit page: move to trash, or —
 * when already in the trash — restore / delete permanently.
 */
export function TrashControls({
  id,
  inTrash,
  noun,
  onTrash,
  onRestore,
  onDelete,
  deleteBlockedReason,
}: {
  id: string;
  inTrash: boolean;
  noun: string;
  onTrash: IdAction;
  onRestore: IdAction;
  onDelete: IdAction;
  deleteBlockedReason?: string | null;
}) {
  if (!inTrash) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-fg/10 pt-8">
        <p className="text-sm text-text-secondary">Move to trash to hide this {noun} from the website. You can restore it later.</p>
        <form action={onTrash}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton message={`Move this ${noun} to the trash? It disappears from the website.`}>Move to trash</ConfirmButton>
        </form>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4 rounded-card border border-market-down/30 p-6">
      <p>This {noun} is in the trash and hidden from the website.</p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={onRestore}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={buttonClasses({})}>
            Restore
          </button>
        </form>
        {deleteBlockedReason ? (
          <p className="text-sm text-text-secondary">{deleteBlockedReason}</p>
        ) : (
          <form action={onDelete}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton message={`Delete this ${noun} permanently? This cannot be undone.`}>Delete permanently</ConfirmButton>
          </form>
        )}
      </div>
    </section>
  );
}

/** Draft/Published radios + optional publish date, shared by every editor. */
export function PublishFields({
  status,
  publishAt,
  error,
}: {
  status: "DRAFT" | "PUBLISHED";
  publishAt?: string;
  error?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 text-sm" role="radiogroup" aria-label="Status">
        {(["DRAFT", "PUBLISHED"] as const).map((s) => (
          <label key={s} className="flex items-center gap-2">
            <input type="radio" name="status" value={s} defaultChecked={status === s} className="accent-brand-royal" />
            {s === "DRAFT" ? "Draft — hidden from visitors" : "Published — visible on the website"}
          </label>
        ))}
      </div>
      {publishAt !== undefined && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Publish at (Dhaka time)</span>
          <input
            type="datetime-local"
            name="publishAt"
            defaultValue={publishAt}
            className="h-11 rounded-control border border-fg/15 bg-ink-950/60 px-3 focus:border-brand-sky focus:outline-none"
          />
          <span className="text-xs text-text-secondary">Optional. A published item appears from this moment.</span>
          {error && <span className="text-xs text-market-down">{error}</span>}
        </label>
      )}
    </>
  );
}

export function FormMessage({ message, isError }: { message?: string; isError: boolean }) {
  if (!message) return null;
  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        "rounded-control border px-4 py-2 text-sm " +
        (isError ? "border-market-down/40 bg-market-down/10" : "border-market-up/30 bg-market-up/10")
      }
    >
      {message}
    </p>
  );
}
