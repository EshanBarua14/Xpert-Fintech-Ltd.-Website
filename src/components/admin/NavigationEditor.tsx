"use client";

import { useEffect, useState } from "react";
import { deleteNavItem, moveNavItem, saveNavItem, toggleNavItem, type NavState } from "@/app/admin/(protected)/navigation/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/Badge";
import { Select, TextInput } from "@/components/ui/Field";

export type EditorNavItem = {
  id: string;
  parentId: string | null;
  linkType: "INTERNAL" | "EXTERNAL" | "NONE" | "ENTITY";
  href: string;
  openInNewTab: boolean;
  isCta: boolean;
  isHidden: boolean;
  en: { label: string; description: string };
  bn: { label: string; description: string };
  children: EditorNavItem[];
};

function NavItemForm({
  menuId,
  item,
  parents,
  defaultParentId = "",
  onSaved,
}: {
  menuId: string;
  item?: EditorNavItem;
  parents: { value: string; label: string }[];
  defaultParentId?: string;
  onSaved?: () => void;
}) {
  const { state, pending, onSubmit } = useActionForm<NavState>(saveNavItem, {});
  const e = state.errors ?? {};
  const [linkType, setLinkType] = useState<string>(item?.linkType === "ENTITY" ? "INTERNAL" : (item?.linkType ?? "INTERNAL"));
  const uid = item?.id ?? `new-${defaultParentId || "top"}`;

  useEffect(() => {
    if (state.savedAt) onSaved?.();
  }, [state.savedAt, onSaved]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" noValidate>
      <input type="hidden" name="menuId" value={menuId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <TextInput id={`${uid}-enLabel`} name="enLabel" label="Label (English)" required defaultValue={item?.en.label} error={e.enLabel} />
      <TextInput id={`${uid}-bnLabel`} name="bnLabel" label="Label (বাংলা)" lang="bn" defaultValue={item?.bn.label} error={e.bnLabel} />
      <Select
        id={`${uid}-linkType`}
        name="linkType"
        label="Link"
        value={linkType}
        onChange={(ev) => setLinkType(ev.target.value)}
        options={[
          { value: "INTERNAL", label: "Page on this website" },
          { value: "EXTERNAL", label: "Another website" },
          { value: "NONE", label: "No link (heading only)" },
        ]}
      />
      {linkType === "INTERNAL" && (
        <TextInput
          id={`${uid}-internalHref`}
          name="internalHref"
          label="Page path"
          hint="After the language, e.g. products/rms — empty for the home page."
          defaultValue={item?.linkType === "INTERNAL" ? item.href : ""}
          error={e.internalHref}
        />
      )}
      {linkType === "EXTERNAL" && (
        <TextInput
          id={`${uid}-externalHref`}
          name="externalHref"
          type="url"
          label="Web address"
          placeholder="https://"
          defaultValue={item?.linkType === "EXTERNAL" ? item.href : ""}
          error={e.externalHref}
        />
      )}
      {linkType === "NONE" && <div />}
      <Select
        id={`${uid}-parentId`}
        name="parentId"
        label="Place under"
        defaultValue={item ? (item.parentId ?? "") : defaultParentId}
        options={[{ value: "", label: "— Top level —" }, ...parents.filter((p) => p.value !== item?.id)]}
        error={e.parentId}
      />
      <TextInput
        id={`${uid}-enDescription`}
        name="enDescription"
        label="Short description (English)"
        hint="Optional. Shown under the link in dropdown menus."
        defaultValue={item?.en.description}
        error={e.enDescription}
      />
      <TextInput
        id={`${uid}-bnDescription`}
        name="bnDescription"
        label="Short description (বাংলা)"
        lang="bn"
        defaultValue={item?.bn.description}
        error={e.bnDescription}
      />
      <div className="flex flex-wrap gap-5 text-sm md:col-span-2">
        {linkType === "EXTERNAL" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="openInNewTab" defaultChecked={item?.openInNewTab} className="accent-brand-royal" />
            Open in a new tab
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isCta" defaultChecked={item?.isCta} className="accent-brand-royal" />
          Show as a button (e.g. Request a demo)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isHidden" defaultChecked={item?.isHidden} className="accent-brand-royal" />
          Hidden
        </label>
      </div>
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

function AddNavItem({ menuId, parents, parentId, label }: { menuId: string; parents: { value: string; label: string }[]; parentId?: string; label: string }) {
  const [round, setRound] = useState(0);
  return (
    <details className="rounded-control border border-dashed border-fg/15 p-4">
      <summary className="cursor-pointer text-sm text-brand-sky">{label}</summary>
      <div className="mt-4">
        <NavItemForm key={round} menuId={menuId} parents={parents} defaultParentId={parentId} onSaved={() => setRound((r) => r + 1)} />
      </div>
    </details>
  );
}

function RowControls({ item }: { item: EditorNavItem }) {
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-fg/10 px-2 text-xs hover:border-brand-sky";
  return (
    <div className="ml-auto flex items-center gap-1.5">
      {(["up", "down"] as const).map((direction) => (
        <form key={direction} action={moveNavItem}>
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="direction" value={direction} />
          <button type="submit" className={btn} aria-label={direction === "up" ? "Move up" : "Move down"}>
            {direction === "up" ? "↑" : "↓"}
          </button>
        </form>
      ))}
      <form action={toggleNavItem}>
        <input type="hidden" name="itemId" value={item.id} />
        <button type="submit" className={btn}>
          {item.isHidden ? "Show" : "Hide"}
        </button>
      </form>
      <form action={deleteNavItem}>
        <input type="hidden" name="itemId" value={item.id} />
        <ConfirmButton
          message={
            item.children.length
              ? `Delete "${item.en.label}" and the ${item.children.length} links under it?`
              : `Delete "${item.en.label}"?`
          }
          className="inline-flex h-8 items-center rounded-control border border-market-down/30 px-2 text-xs text-market-down hover:bg-market-down/10"
        >
          Delete
        </ConfirmButton>
      </form>
    </div>
  );
}

function Row({ item, menuId, parents, depth }: { item: EditorNavItem; menuId: string; parents: { value: string; label: string }[]; depth: number }) {
  const target = item.linkType === "NONE" ? "heading" : item.linkType === "EXTERNAL" ? item.href : `/${item.href}`;
  return (
    <li className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={item.isHidden ? "text-text-secondary line-through" : "font-medium"}>{item.en.label}</span>
        <span className="tabular text-xs text-text-secondary">{target}</span>
        {item.isCta && <Badge tone="brand">Button</Badge>}
        {!item.bn.label && <Badge>EN only</Badge>}
        {item.isHidden && <Badge>Hidden</Badge>}
        <RowControls item={item} />
      </div>
      <details>
        <summary className="cursor-pointer text-xs text-text-secondary hover:text-brand-sky">Edit</summary>
        <div className="mt-4">
          <NavItemForm menuId={menuId} item={item} parents={parents} />
        </div>
      </details>
      {depth === 0 && (
        <div className="flex flex-col gap-2 border-l border-fg/10 pl-5">
          {item.children.length > 0 && (
            <ul className="divide-y divide-fg/10">
              {item.children.map((child) => (
                <Row key={child.id} item={child} menuId={menuId} parents={parents} depth={1} />
              ))}
            </ul>
          )}
          <AddNavItem menuId={menuId} parents={parents} parentId={item.id} label={`+ Add a link under "${item.en.label}"`} />
        </div>
      )}
    </li>
  );
}

export function NavigationEditor({ menuId, items }: { menuId: string; items: EditorNavItem[] }) {
  const parents = items.map((i) => ({ value: i.id, label: i.en.label }));
  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-fg/10 rounded-card border border-fg/10 px-4">
        {items.length === 0 && <li className="py-8 text-center text-text-secondary">This menu is empty.</li>}
        {items.map((item) => (
          <Row key={item.id} item={item} menuId={menuId} parents={parents} depth={0} />
        ))}
      </ul>
      <AddNavItem menuId={menuId} parents={parents} label="+ Add a top-level item" />
    </div>
  );
}
