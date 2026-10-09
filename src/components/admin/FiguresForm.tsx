"use client";

import { saveFigures, type FiguresState } from "@/app/admin/(protected)/figures/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { TextInput } from "@/components/ui/Field";

export type FigureRow = { value: string; labelEn: string; labelBn: string; source: string; asOf: string };

const EXAMPLES = ["Orders a day", "Years live", "Members on the platform", "BO accounts opened online", "Branded trading apps", "Uptime this year"];

export function FiguresForm({ rows, max }: { rows: FigureRow[]; max: number }) {
  const { state, pending, onSubmit } = useActionForm<FiguresState>(saveFigures, {});
  const e = state.errors ?? {};
  const all = Array.from({ length: max }, (_, i) => rows[i] ?? { value: "", labelEn: "", labelBn: "", source: "", asOf: "" });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
      <ol className="flex flex-col gap-4">
        {all.map((r, i) => (
          <li key={i} className="grid gap-4 rounded-card border border-fg/10 p-4 md:grid-cols-[8rem_1fr_1fr] lg:grid-cols-[8rem_1fr_1fr_1.2fr_10rem]">
            <TextInput id={`value_${i}`} label={`Figure ${i + 1}`} placeholder={i === 1 ? "6" : "120,000"} defaultValue={r.value} error={e[`value_${i}`]} />
            <TextInput id={`labelEn_${i}`} label="What it counts (English)" placeholder={EXAMPLES[i]} defaultValue={r.labelEn} error={e[`labelEn_${i}`]} />
            <TextInput id={`labelBn_${i}`} label="What it counts (বাংলা)" lang="bn" defaultValue={r.labelBn} />
            <TextInput id={`source_${i}`} label="Source" placeholder="OMS order log, Sep 2026" defaultValue={r.source} error={e[`source_${i}`]} />
            <TextInput id={`asOf_${i}`} type="date" label="As of" defaultValue={r.asOf} error={e[`asOf_${i}`]} />
          </li>
        ))}
      </ol>
      <div>
        <SubmitButton pending={pending}>Save figures</SubmitButton>
      </div>
    </form>
  );
}
