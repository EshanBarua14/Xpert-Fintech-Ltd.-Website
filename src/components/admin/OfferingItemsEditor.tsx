"use client";

import { useEffect, useState } from "react";
import {
  deleteOfferingItem,
  moveOfferingItem,
  saveOfferingItem,
  toggleOfferingItem,
  type FormState,
} from "@/app/admin/(protected)/products/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/Badge";
import { TextArea, TextInput } from "@/components/ui/Field";
import { ITEM_KIND_LABELS, OFFERING_ITEM_KINDS } from "@/lib/validation/offering";

type Kind = (typeof OFFERING_ITEM_KINDS)[number];

export type EditorItem = {
  id: string;
  kind: Kind;
  isHidden: boolean;
  en: { title: string; body: string };
  bn: { title: string; body: string };
};

function ItemForm({
  offeringId,
  kind,
  item,
  onSaved,
}: {
  offeringId: string;
  kind: Kind;
  item?: EditorItem;
  onSaved?: () => void;
}) {
  const { state, pending, onSubmit } = useActionForm<FormState>(saveOfferingItem, {});
  const errors = state.errors ?? {};
  const uid = item?.id ?? `new-${kind}`;

  useEffect(() => {
    if (state.savedAt) onSaved?.();
  }, [state.savedAt, onSaved]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <input type="hidden" name="offeringId" value={offeringId} />
      <input type="hidden" name="kind" value={kind} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <TextInput id={`${uid}-enTitle`} name="enTitle" label="Title (English)" required defaultValue={item?.en.title} error={errors.enTitle} />
      <TextInput id={`${uid}-bnTitle`} name="bnTitle" label="Title (বাংলা)" defaultValue={item?.bn.title} error={errors.bnTitle} lang="bn" />
      <TextArea id={`${uid}-enBody`} name="enBody" label="Details (English)" rows={3} defaultValue={item?.en.body} error={errors.enBody} />
      <TextArea id={`${uid}-bnBody`} name="bnBody" label="Details (বাংলা)" rows={3} defaultValue={item?.bn.body} error={errors.bnBody} lang="bn" />
      <div className="flex items-center gap-3 md:col-span-2">
        <SubmitButton pending={pending}>{item ? "Save" : "Add"}</SubmitButton>
        {state.message && !state.errors && (
          <span role="status" className="text-sm text-market-up">
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

function AddItem({ offeringId, kind }: { offeringId: string; kind: Kind }) {
  // Remounting the form after a save gives the admin an empty form for the next item.
  const [round, setRound] = useState(0);
  return (
    <details className="rounded-control border border-dashed border-white/15 p-4">
      <summary className="cursor-pointer text-sm text-brand-sky">+ Add to {ITEM_KIND_LABELS[kind].toLowerCase()}</summary>
      <div className="mt-4">
        <ItemForm key={round} offeringId={offeringId} kind={kind} onSaved={() => setRound((r) => r + 1)} />
      </div>
    </details>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-white/10 px-2 text-xs hover:border-brand-sky"
    >
      {children}
    </button>
  );
}

export function OfferingItemsEditor({ offeringId, items }: { offeringId: string; items: EditorItem[] }) {
  return (
    <div className="flex flex-col gap-8">
      {OFFERING_ITEM_KINDS.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        return (
          <section key={kind} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 font-semibold">
              {ITEM_KIND_LABELS[kind]}
              <span className="tabular text-xs text-text-secondary">{group.length}</span>
            </h3>

            {group.length > 0 && (
              <ol className="flex flex-col divide-y divide-white/10 rounded-card border border-white/10">
                {group.map((item, index) => (
                  <li key={item.id} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tabular text-xs text-text-secondary">{String(index + 1).padStart(2, "0")}</span>
                      <span className={item.isHidden ? "text-text-secondary line-through" : "font-medium"}>{item.en.title}</span>
                      {!item.bn.title && <Badge>EN only</Badge>}
                      {item.isHidden && <Badge>Hidden</Badge>}
                      <div className="ml-auto flex items-center gap-1.5">
                        <form action={moveOfferingItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <IconButton label="Move up">↑</IconButton>
                        </form>
                        <form action={moveOfferingItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <IconButton label="Move down">↓</IconButton>
                        </form>
                        <form action={toggleOfferingItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <IconButton label={item.isHidden ? "Show on website" : "Hide from website"}>
                            {item.isHidden ? "Show" : "Hide"}
                          </IconButton>
                        </form>
                        <form action={deleteOfferingItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <ConfirmButton
                            message={`Delete "${item.en.title}"? This cannot be undone.`}
                            className="inline-flex h-8 items-center rounded-control border border-market-down/30 px-2 text-xs text-market-down hover:bg-market-down/10"
                          >
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs text-text-secondary hover:text-brand-sky">Edit</summary>
                      <div className="mt-4">
                        <ItemForm offeringId={offeringId} kind={kind} item={item} />
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            )}

            <AddItem offeringId={offeringId} kind={kind} />
          </section>
        );
      })}
    </div>
  );
}
