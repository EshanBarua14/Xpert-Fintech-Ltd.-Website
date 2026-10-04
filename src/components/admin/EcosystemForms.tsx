"use client";

import { useState } from "react";
import { addEdge, saveFlow, saveNode, type EcoState } from "@/app/admin/(protected)/ecosystem/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { Select, TextArea, TextInput } from "@/components/ui/Field";

type Opt = { value: string; label: string };

export type NodeFormValues = {
  id?: string;
  key: string;
  layer: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  offeringId: string;
  mobileOrder: number;
  editorNote: string;
  en: { label: string; description: string; cta: string };
  bn: { label: string; description: string; cta: string };
};

const LAYERS: Opt[] = [
  { value: "MARKET", label: "Market infrastructure (DSE, CSE…)" },
  { value: "XFL", label: "Xpert Fintech" },
  { value: "PRODUCT", label: "Product" },
  { value: "INSTITUTION", label: "Institution (brokerages…)" },
  { value: "USER", label: "Investors and teams" },
];

export function NodeForm({ values, offerings }: { values: NodeFormValues; offerings: Opt[] }) {
  const { state, pending, onSubmit } = useActionForm<EcoState>(saveNode, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        {(["en", "bn"] as const).map((l) => (
          <fieldset key={l} lang={l} className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
            <legend className="px-2 text-sm font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
            <TextInput id={`${l}Label`} label="Label" required={l === "en"} hint="Shown on the node, e.g. “BO Account Opening”." defaultValue={values[l].label} error={e[`${l}Label`]} />
            <TextInput id={`${l}Cta`} label="Button text" hint="Optional. Default: “Explore product”." defaultValue={values[l].cta} error={e[`${l}Cta`]} />
            <div className="md:col-span-2">
              <TextArea id={`${l}Description`} label="Description" rows={3} hint="One sentence, shown on hover, in the tour and on phones." defaultValue={values[l].description} error={e[`${l}Description`]} />
            </div>
          </fieldset>
        ))}
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <TextInput id="key" label="Key" hint="Short id used by flows, e.g. oms, rms, dse." defaultValue={values.key} error={e.key} required />
          <Select id="layer" label="Layer" options={LAYERS} defaultValue={values.layer} error={e.layer} />
          <Select id="offeringId" label="Product page" options={[{ value: "", label: "— None —" }, ...offerings]} defaultValue={values.offeringId} error={e.offeringId} />
          <TextInput id="mobileOrder" type="number" min={0} label="Order" hint="Order within its layer on phones." defaultValue={String(values.mobileOrder)} error={e.mobileOrder} />
          <TextArea id="editorNote" label="Note for editors" rows={3} hint="Never shown on the website." defaultValue={values.editorNote} error={e.editorNote} />
        </fieldset>
      </aside>
    </form>
  );
}

export function EdgeForm({ nodeId, nodes }: { nodeId: string; nodes: Opt[] }) {
  const { state, pending, onSubmit } = useActionForm<EcoState>(addEdge, {});
  const e = state.errors ?? {};
  return (
    <form key={state.ok ? state.message : "edge"} onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
      <input type="hidden" name="nodeId" value={nodeId} />
      <Select
        id="direction"
        label="Direction"
        options={[
          { value: "out", label: "This node → other" },
          { value: "in", label: "Other → this node" },
        ]}
        defaultValue="out"
      />
      <Select id="otherId" label="Other node" options={nodes} placeholder="Choose…" error={e.otherId} />
      <Select
        id="kind"
        label="Kind"
        options={[
          { value: "DATA", label: "Market data" },
          { value: "ORDER", label: "Orders" },
          { value: "ONBOARDING", label: "Onboarding" },
          { value: "RISK", label: "Risk" },
          { value: "OPERATIONS", label: "Operations" },
        ]}
        defaultValue="ORDER"
      />
      <SubmitButton pending={pending}>Add link</SubmitButton>
      {state.message && (
        <div className="md:col-span-4">
          <FormMessage message={state.message} isError={!state.ok} />
        </div>
      )}
    </form>
  );
}

type Step = { nodeId: string; enTitle: string; enBody: string; bnTitle: string; bnBody: string };
export type FlowFormValues = { id?: string; key: string; status: "DRAFT" | "PUBLISHED"; publishAt: string; isPlayback: boolean; enName: string; bnName: string; steps: Step[] };

export function FlowForm({ values, nodes }: { values: FlowFormValues; nodes: Opt[] }) {
  const { state, pending, onSubmit } = useActionForm<EcoState>(saveFlow, {});
  const e = state.errors ?? {};
  const [steps, setSteps] = useState<Step[]>(values.steps.length ? values.steps : [{ nodeId: "", enTitle: "", enBody: "", bnTitle: "", bnBody: "" }]);
  const set = (i: number, patch: Partial<Step>) => setSteps((list) => list.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    setSteps((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const field = "h-10 w-full rounded-control border border-fg/15 bg-ink-950/60 px-3 text-sm focus:border-brand-sky focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <fieldset className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">Name</legend>
          <TextInput id="enName" label="English" required defaultValue={values.enName} error={e.enName} />
          <TextInput id="bnName" label="বাংলা — optional" lang="bn" defaultValue={values.bnName} error={e.bnName} />
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Steps</legend>
          <p className="text-xs text-text-secondary">Each step highlights one node. Steps on unpublished nodes are skipped on the website. The guided tour shows each step for about 3–4 seconds.</p>
          {e.steps && <p className="text-xs text-market-down">{e.steps}</p>}
          <ol className="flex flex-col gap-4">
            {steps.map((s, i) => (
              <li key={i} className="grid gap-3 rounded-control border border-fg/10 p-4 md:grid-cols-2">
                <div className="flex items-center justify-between gap-2 md:col-span-2">
                  <span className="font-mono text-xs text-text-secondary">Step {i + 1}</span>
                  <span className="flex gap-1 text-xs">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-2 py-1 hover:bg-fg/10 disabled:opacity-30" aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="rounded px-2 py-1 hover:bg-fg/10 disabled:opacity-30" aria-label="Move down">
                      ↓
                    </button>
                    <button type="button" onClick={() => setSteps((l) => l.filter((_, k) => k !== i))} className="rounded px-2 py-1 text-text-secondary hover:text-market-down">
                      Remove
                    </button>
                  </span>
                </div>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="font-medium">Node</span>
                  <select value={s.nodeId} onChange={(ev) => set(i, { nodeId: ev.target.value })} className={field}>
                    <option value="">Choose…</option>
                    {nodes.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Title (English)</span>
                  <input value={s.enTitle} onChange={(ev) => set(i, { enTitle: ev.target.value })} className={field} maxLength={80} />
                </label>
                <label className="flex flex-col gap-1 text-sm" lang="bn">
                  <span className="font-medium">শিরোনাম (বাংলা)</span>
                  <input value={s.bnTitle} onChange={(ev) => set(i, { bnTitle: ev.target.value })} className={field} maxLength={80} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Text (English, optional)</span>
                  <input value={s.enBody} onChange={(ev) => set(i, { enBody: ev.target.value })} className={field} maxLength={300} />
                </label>
                <label className="flex flex-col gap-1 text-sm" lang="bn">
                  <span className="font-medium">লেখা (বাংলা)</span>
                  <input value={s.bnBody} onChange={(ev) => set(i, { bnBody: ev.target.value })} className={field} maxLength={300} />
                </label>
              </li>
            ))}
          </ol>
          <div>
            <button
              type="button"
              disabled={steps.length >= 20}
              onClick={() => setSteps((l) => [...l, { nodeId: "", enTitle: "", enBody: "", bnTitle: "", bnBody: "" }])}
              className="rounded-control border border-fg/15 px-3 py-1.5 text-sm hover:border-brand-sky disabled:opacity-40"
            >
              Add step
            </button>
          </div>
        </fieldset>
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="isPlayback" defaultChecked={values.isPlayback} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Guided tour
              <span className="block text-xs text-text-secondary">Plays under the map when visitors press the tour button. Only one flow can be the tour.</span>
            </span>
          </label>
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <TextInput id="key" label="Key" defaultValue={values.key} error={e.key} required hint="Short id, e.g. onboarding." />
        </fieldset>
      </aside>
    </form>
  );
}
