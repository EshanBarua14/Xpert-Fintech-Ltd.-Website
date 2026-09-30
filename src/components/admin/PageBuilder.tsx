"use client";

import { useEffect, useState } from "react";
import {
  addBlock,
  addSection,
  deleteBlock,
  deleteItem,
  deleteSection,
  moveBlock,
  moveItem,
  moveSection,
  saveBlock,
  saveItem,
  saveSection,
  toggleItem,
  toggleSection,
  type PageState,
} from "@/app/admin/(protected)/pages/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Badge } from "@/components/ui/Badge";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { BLOCK_KEYS, BLOCKS, blockDefinition, type Setting } from "@/content/blocks/registry";

type Text = { eyebrow: string; title: string; subtitle: string; body: string; ctaLabel: string; ctaHref: string };
type ItemText = { title: string; subtitle: string; body: string; ctaLabel: string };

export type BuilderItem = {
  id: string;
  isHidden: boolean;
  mediaId: string;
  linkUrl: string;
  iconName: string;
  props: Record<string, unknown>;
  en: ItemText;
  bn: ItemText;
};
export type BuilderBlock = {
  id: string;
  type: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  isHidden: boolean;
  props: Record<string, unknown>;
  en: Text;
  bn: Text;
  items: BuilderItem[];
};
export type BuilderSection = { id: string; variant: string; anchorId: string; isHidden: boolean; blocks: BuilderBlock[] };

const iconBtn = "inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-fg/10 px-2 text-xs hover:border-brand-sky";
const dangerBtn = "inline-flex h-8 items-center rounded-control border border-market-down/30 px-2 text-xs text-market-down hover:bg-market-down/10";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto flex flex-wrap items-center gap-1.5">{children}</div>;
}

function IdForm({ action, name, id, extra, children }: { action: (fd: FormData) => Promise<void>; name: string; id: string; extra?: Record<string, string>; children: React.ReactNode }) {
  return (
    <form action={action}>
      <input type="hidden" name={name} value={id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
    </form>
  );
}

function SettingField({ s, prefix, value, error }: { s: Setting; prefix: string; value: unknown; error?: string }) {
  const id = `${prefix}.${s.key}`;
  if (s.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={id} defaultChecked={value === undefined ? s.default : Boolean(value)} className="accent-brand-royal" />
        {s.label}
      </label>
    );
  }
  if (s.type === "select") {
    return <Select id={id} label={s.label} hint={s.hint} options={s.options} defaultValue={String(value ?? s.default)} error={error} />;
  }
  return (
    <TextInput
      id={id}
      label={s.label}
      hint={s.hint}
      type={s.type === "number" ? "number" : s.type === "url" ? "url" : "text"}
      min={s.type === "number" ? s.min : undefined}
      max={s.type === "number" ? s.max : undefined}
      defaultValue={String(value ?? s.default)}
      error={error}
    />
  );
}

// ── Card form ────────────────────────────────────────────────────────────────

function ItemForm({ block, item, images, onSaved }: { block: BuilderBlock; item?: BuilderItem; images: ImageOption[]; onSaved?: () => void }) {
  const def = blockDefinition(block.type)!;
  const cards = def.cards!;
  const { state, pending, onSubmit } = useActionForm<PageState>(saveItem, {});
  const e = state.errors ?? {};
  const uid = item?.id ?? `new-${block.id}`;

  useEffect(() => {
    if (state.savedAt) onSaved?.();
  }, [state.savedAt, onSaved]);

  const textFields = (["title", "subtitle", "body"] as const).filter((f) => cards.fields[f]);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="blockId" value={block.id} />
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        {(["en", "bn"] as const).map((l) =>
          textFields.map((f) =>
            f === "body" ? (
              <TextArea
                key={`${l}-${f}`}
                id={`${uid}-${l}-${f}`}
                name={`${l}.${f}`}
                lang={l}
                rows={3}
                label={`${cards.fields[f]} (${l === "en" ? "English" : "বাংলা"})`}
                defaultValue={item?.[l][f]}
                error={e[`${l}.${f}`]}
              />
            ) : (
              <TextInput
                key={`${l}-${f}`}
                id={`${uid}-${l}-${f}`}
                name={`${l}.${f}`}
                lang={l}
                label={`${cards.fields[f]} (${l === "en" ? "English" : "বাংলা"})`}
                defaultValue={item?.[l][f]}
                error={e[`${l}.${f}`]}
              />
            ),
          ),
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.fields.media && (
          <ImagePicker name="mediaId" label={cards.fields.media} options={images} defaultValue={item?.mediaId} error={e.mediaId} />
        )}
        {cards.fields.link && (
          <TextInput id={`${uid}-linkUrl`} name="linkUrl" label="Link (page path or https://…)" defaultValue={item?.linkUrl} error={e.linkUrl} />
        )}
        {cards.fields.icon && (
          <TextInput id={`${uid}-iconName`} name="iconName" label="Icon name" hint="Optional: shield, lock, chart, network, users, document, bolt, globe, exchange, check, cloud, id" defaultValue={item?.iconName} />
        )}
        {(cards.settings ?? []).map((s) => (
          <SettingField key={s.key} s={s} prefix="cardSetting" value={item?.props[s.key]} error={e[s.key]} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>{item ? "Save" : `Add ${cards.singular.toLowerCase()}`}</SubmitButton>
        {state.message && !state.errors && <span className="text-sm text-market-up">{state.message}</span>}
        {state.message && state.errors && <span className="text-sm text-market-down">{state.message}</span>}
      </div>
    </form>
  );
}

function AddItem({ block, images }: { block: BuilderBlock; images: ImageOption[] }) {
  const [round, setRound] = useState(0);
  const singular = blockDefinition(block.type)?.cards?.singular ?? "card";
  return (
    <details className="rounded-control border border-dashed border-fg/15 p-4">
      <summary className="cursor-pointer text-sm text-brand-sky">+ Add {singular.toLowerCase()}</summary>
      <div className="mt-4">
        <ItemForm key={round} block={block} images={images} onSaved={() => setRound((r) => r + 1)} />
      </div>
    </details>
  );
}

// ── Block form ───────────────────────────────────────────────────────────────

function BlockForm({ block }: { block: BuilderBlock }) {
  const def = blockDefinition(block.type)!;
  const { state, pending, onSubmit } = useActionForm<PageState>(saveBlock, {});
  const e = state.errors ?? {};
  const fields = (["eyebrow", "title", "subtitle", "body"] as const).filter((f) => def.text[f]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="blockId" value={block.id} />
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <div className="grid gap-5 lg:grid-cols-2">
        {(["en", "bn"] as const).map((l) => (
          <fieldset key={l} lang={l} className="flex flex-col gap-4 rounded-control border border-fg/10 p-4">
            <legend className="px-2 text-xs font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
            {fields.map((f) =>
              f === "body" ? (
                <TextArea
                  key={f}
                  id={`${block.id}-${l}-${f}`}
                  name={`${l}.${f}`}
                  label={def.text[f]!}
                  rows={6}
                  defaultValue={block[l][f]}
                  error={e[`${l}.${f}`]}
                />
              ) : (
                <TextInput key={f} id={`${block.id}-${l}-${f}`} name={`${l}.${f}`} label={def.text[f]!} defaultValue={block[l][f]} error={e[`${l}.${f}`]} />
              ),
            )}
            {def.text.cta && (
              <>
                <TextInput id={`${block.id}-${l}-ctaLabel`} name={`${l}.ctaLabel`} label="Button label" defaultValue={block[l].ctaLabel} error={e[`${l}.ctaLabel`]} />
                {l === "en" && (
                  <TextInput
                    id={`${block.id}-en-ctaHref`}
                    name="en.ctaHref"
                    label="Button link"
                    hint="Page path such as request-demo, or https://…"
                    defaultValue={block.en.ctaHref}
                    error={e["en.ctaHref"]}
                  />
                )}
              </>
            )}
          </fieldset>
        ))}
      </div>
      {def.settings.length > 0 && (
        <fieldset className="grid gap-4 rounded-control border border-fg/10 p-4 md:grid-cols-2">
          <legend className="px-2 text-xs font-semibold">Settings</legend>
          {def.settings.map((s) => (
            <SettingField key={s.key} s={s} prefix="setting" value={block.props[s.key]} error={e[s.key]} />
          ))}
        </fieldset>
      )}
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-3">
          <PublishFields status={block.status} publishAt={block.publishAt} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isHidden" defaultChecked={block.isHidden} className="accent-brand-royal" />
          Hidden
        </label>
        <SubmitButton pending={pending}>Save block</SubmitButton>
      </div>
    </form>
  );
}

function BlockCard({ block, images, index, total }: { block: BuilderBlock; images: ImageOption[]; index: number; total: number }) {
  const def = blockDefinition(block.type);
  const title = block.en.title || block.en.eyebrow || "(no heading)";
  return (
    <li className="flex flex-col gap-3 rounded-card border border-fg/10 bg-ink-950/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">{def?.label ?? block.type}</Badge>
        <span className="font-medium">{title}</span>
        {block.status === "DRAFT" && <Badge>Draft</Badge>}
        {block.isHidden && <Badge>Hidden</Badge>}
        {!block.bn.title && !block.bn.body && <Badge>EN only</Badge>}
        <Row>
          {index > 0 && (
            <IdForm action={moveBlock} name="blockId" id={block.id} extra={{ direction: "up" }}>
              <button type="submit" className={iconBtn} aria-label="Move block up">↑</button>
            </IdForm>
          )}
          {index < total - 1 && (
            <IdForm action={moveBlock} name="blockId" id={block.id} extra={{ direction: "down" }}>
              <button type="submit" className={iconBtn} aria-label="Move block down">↓</button>
            </IdForm>
          )}
          <IdForm action={deleteBlock} name="blockId" id={block.id}>
            <ConfirmButton message={`Delete this ${def?.label ?? ""} block and its cards?`} className={dangerBtn}>
              Delete
            </ConfirmButton>
          </IdForm>
        </Row>
      </div>
      {!def ? (
        <p className="text-sm text-market-down">This block type is no longer supported. Delete it.</p>
      ) : (
        <>
          <p className="text-xs text-text-secondary">{def.description}</p>
          <details>
            <summary className="cursor-pointer text-sm text-brand-sky">Edit text and settings</summary>
            <div className="mt-4">
              <BlockForm block={block} />
            </div>
          </details>
          {def.cards && (
            <div className="flex flex-col gap-2 border-l border-fg/10 pl-4">
              <p className="text-xs font-semibold text-text-secondary">
                {def.cards.singular}s ({block.items.length})
              </p>
              {block.items.length > 0 && (
                <ol className="flex flex-col divide-y divide-fg/10">
                  {block.items.map((item, i) => (
                    <li key={item.id} className="flex flex-col gap-2 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="tabular text-xs text-text-secondary">{String(i + 1).padStart(2, "0")}</span>
                        <span className={item.isHidden ? "text-text-secondary line-through" : ""}>
                          {item.en.title || item.en.subtitle || (item.mediaId ? "Image" : "(empty)")}
                        </span>
                        {item.isHidden && <Badge>Hidden</Badge>}
                        <Row>
                          {i > 0 && (
                            <IdForm action={moveItem} name="itemId" id={item.id} extra={{ direction: "up" }}>
                              <button type="submit" className={iconBtn} aria-label="Move up">↑</button>
                            </IdForm>
                          )}
                          {i < block.items.length - 1 && (
                            <IdForm action={moveItem} name="itemId" id={item.id} extra={{ direction: "down" }}>
                              <button type="submit" className={iconBtn} aria-label="Move down">↓</button>
                            </IdForm>
                          )}
                          <IdForm action={toggleItem} name="itemId" id={item.id}>
                            <button type="submit" className={iconBtn}>{item.isHidden ? "Show" : "Hide"}</button>
                          </IdForm>
                          <IdForm action={deleteItem} name="itemId" id={item.id}>
                            <ConfirmButton message="Delete this card?" className={dangerBtn}>
                              Delete
                            </ConfirmButton>
                          </IdForm>
                        </Row>
                      </div>
                      <details>
                        <summary className="cursor-pointer text-xs text-text-secondary hover:text-brand-sky">Edit</summary>
                        <div className="mt-3">
                          <ItemForm block={block} item={item} images={images} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ol>
              )}
              <AddItem block={block} images={images} />
            </div>
          )}
        </>
      )}
    </li>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function SectionSettings({ section }: { section: BuilderSection }) {
  const { state, pending, onSubmit } = useActionForm<PageState>(saveSection, {});
  return (
    <form onSubmit={onSubmit} className="grid items-end gap-4 md:grid-cols-[200px_200px_auto]" noValidate>
      <input type="hidden" name="sectionId" value={section.id} />
      <Select
        id={`${section.id}-variant`}
        name="variant"
        label="Background"
        defaultValue={section.variant}
        options={[
          { value: "dark", label: "Dark" },
          { value: "grid", label: "Dark with grid" },
          { value: "light", label: "Navy (alternate)" },
          { value: "full-bleed", label: "Full width" },
        ]}
      />
      <TextInput
        id={`${section.id}-anchorId`}
        name="anchorId"
        label="Anchor (optional)"
        hint="For links like /#platform"
        defaultValue={section.anchorId}
        error={state.errors?.anchorId}
      />
      <div className="flex items-center gap-3 pb-1">
        <SubmitButton pending={pending} variant="secondary">
          Save section
        </SubmitButton>
        {state.message && !state.errors && <span className="text-sm text-market-up">{state.message}</span>}
      </div>
    </form>
  );
}

export function PageBuilder({ pageId, sections, images }: { pageId: string; sections: BuilderSection[]; images: ImageOption[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.length === 0 && (
        <p className="rounded-card border border-fg/10 px-4 py-8 text-center text-text-secondary">
          This page has no sections yet. Add one to start building.
        </p>
      )}
      {sections.map((section, si) => (
        <section key={section.id} className="flex flex-col gap-4 rounded-card border border-fg/15 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">Section {si + 1}</h3>
            {section.anchorId && <span className="tabular text-xs text-text-secondary">#{section.anchorId}</span>}
            {section.isHidden && <Badge>Hidden</Badge>}
            <Row>
              {si > 0 && (
                <IdForm action={moveSection} name="sectionId" id={section.id} extra={{ direction: "up" }}>
                  <button type="submit" className={iconBtn} aria-label="Move section up">↑</button>
                </IdForm>
              )}
              {si < sections.length - 1 && (
                <IdForm action={moveSection} name="sectionId" id={section.id} extra={{ direction: "down" }}>
                  <button type="submit" className={iconBtn} aria-label="Move section down">↓</button>
                </IdForm>
              )}
              <IdForm action={toggleSection} name="sectionId" id={section.id}>
                <button type="submit" className={iconBtn}>{section.isHidden ? "Show" : "Hide"}</button>
              </IdForm>
              <IdForm action={deleteSection} name="sectionId" id={section.id}>
                <ConfirmButton message={`Delete section ${si + 1} with all its blocks and cards?`} className={dangerBtn}>
                  Delete
                </ConfirmButton>
              </IdForm>
            </Row>
          </div>

          <SectionSettings section={section} />

          {section.blocks.length > 0 && (
            <ul className="flex flex-col gap-3">
              {section.blocks.map((block, bi) => (
                <BlockCard key={block.id} block={block} images={images} index={bi} total={section.blocks.length} />
              ))}
            </ul>
          )}

          <form action={addBlock} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="sectionId" value={section.id} />
            <Select
              id={`${section.id}-newType`}
              name="type"
              label="Add a block"
              defaultValue="RICH_TEXT"
              options={BLOCK_KEYS.map((k) => ({ value: k, label: `${BLOCKS[k].label} — ${BLOCKS[k].description}` }))}
            />
            <SubmitButton variant="secondary" pendingLabel="Adding…">
              Add block
            </SubmitButton>
          </form>
        </section>
      ))}
      <form action={addSection}>
        <input type="hidden" name="pageId" value={pageId} />
        <SubmitButton variant="secondary" pendingLabel="Adding…">
          + Add section
        </SubmitButton>
      </form>
    </div>
  );
}
