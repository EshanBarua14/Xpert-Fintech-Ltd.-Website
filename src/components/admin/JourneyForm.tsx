"use client";

import { saveJourney, type JourneyState } from "@/app/admin/(protected)/case-studies/journey-actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { TextArea, TextInput } from "@/components/ui/Field";
import { ClearRowButton } from "./ClearRowButton";
import { MAX_STEPS, type JourneySetting } from "@/lib/content/journey-shared";

const pair = "grid gap-4 md:grid-cols-2";

/** Admin → Success stories: the growth journey shown above the stories (3D bars for milestones with a number). */
export function JourneyForm({ journey }: { journey: JourneySetting }) {
  const { state, pending, onSubmit } = useActionForm<JourneyState>(saveJourney, {});
  const e = state.errors ?? {};
  const rows = Array.from({ length: MAX_STEPS }, (_, i) => journey.steps[i] ?? { date: "", value: null, titleEn: "", titleBn: "", bodyEn: "", bodyBn: "", source: "", sourceUrl: "" });
  return (
    <form onSubmit={onSubmit} className="flex max-w-5xl flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-5 rounded-card border border-fg/10 p-5">
        <legend className="px-2 text-base font-semibold">Growth journey</legend>
        <p className="max-w-3xl text-xs leading-relaxed text-text-secondary">
          Milestones shown at the top of the success stories page, oldest first. A milestone with a number is drawn as a 3D bar (the number is the metric below, e.g. brokerage houses on Xpert); without one, as a marker. Every milestone needs its source. Leave a row empty to drop it.
        </p>
        <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
        <div className={pair}>
          <TextInput id="jTitle" label="Section title (English)" defaultValue={journey.titleEn} error={e.jTitle} />
          <TextInput id="jTitleBnMain" label="Section title (বাংলা)" lang="bn" defaultValue={journey.titleBn} error={e.jTitleBnMain} />
          <TextArea id="jIntro" label="Lead line (English)" rows={2} defaultValue={journey.introEn} error={e.jIntro} />
          <TextArea id="jIntroBnMain" label="Lead line (বাংলা)" lang="bn" rows={2} defaultValue={journey.introBn} error={e.jIntroBnMain} />
          <TextInput id="jMetric" label="What the numbers count (English)" defaultValue={journey.metricEn} error={e.jMetric} />
          <TextInput id="jMetricBn" label="What the numbers count (বাংলা)" lang="bn" defaultValue={journey.metricBn} error={e.jMetricBn} />
        </div>
        <ol className="flex flex-col gap-4">
          {rows.map((r, i) => (
            <li key={i} className="grid gap-4 rounded-card border border-fg/10 p-4 md:grid-cols-4">
              <TextInput id={`jDate_${i}`} label={`Milestone ${i + 1}: date`} placeholder="2026-09-21" defaultValue={r.date} error={e[`jDate_${i}`]} />
              <TextInput id={`jValue_${i}`} label="Number (optional)" inputMode="decimal" defaultValue={r.value === null ? "" : String(r.value)} error={e[`jValue_${i}`]} />
              <TextInput id={`jSource_${i}`} label="Source" defaultValue={r.source} error={e[`jSource_${i}`]} />
              <TextInput id={`jSourceUrl_${i}`} label="Source link" type="url" placeholder="https://" defaultValue={r.sourceUrl} error={e[`jSourceUrl_${i}`]} />
              <div className="grid gap-4 md:col-span-4 md:grid-cols-2">
                <TextInput id={`jTitleEn_${i}`} label="Title (English)" defaultValue={r.titleEn} error={e[`jTitleEn_${i}`]} />
                <TextInput id={`jTitleBn_${i}`} label="Title (বাংলা)" lang="bn" defaultValue={r.titleBn} error={e[`jTitleBn_${i}`]} />
                <TextArea id={`jBodyEn_${i}`} label="Text (English)" rows={2} defaultValue={r.bodyEn} error={e[`jBodyEn_${i}`]} />
                <TextArea id={`jBodyBn_${i}`} label="Text (বাংলা)" lang="bn" rows={2} defaultValue={r.bodyBn} error={e[`jBodyBn_${i}`]} />
              </div>
              <ClearRowButton label="Remove this milestone" />
            </li>
          ))}
        </ol>
        <div>
          <SubmitButton pending={pending}>Save journey</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
