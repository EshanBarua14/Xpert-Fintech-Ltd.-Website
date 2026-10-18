"use client";

import { saveHighlights, type HighlightsState } from "@/app/admin/(protected)/highlights/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { ClearRowButton } from "./ClearRowButton";
import type { SavingsSetting, StrengthsSetting, WhatsAppSetting } from "@/lib/content/highlights";

function Group({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5 rounded-card border border-fg/10 p-5">
      <legend className="px-2 text-base font-semibold">{title}</legend>
      {hint && <p className="max-w-3xl text-xs leading-relaxed text-text-secondary">{hint}</p>}
      {children}
    </fieldset>
  );
}

const pair = "grid gap-4 md:grid-cols-2";

export function HighlightsForm({
  strengths,
  savings,
  whatsapp,
  icons,
  max,
}: {
  strengths: StrengthsSetting;
  savings: SavingsSetting;
  whatsapp: WhatsAppSetting;
  icons: string[];
  max: number;
}) {
  const { state, pending, onSubmit } = useActionForm<HighlightsState>(saveHighlights, {});
  const e = state.errors ?? {};
  const rows = Array.from({ length: max }, (_, i) => strengths.items[i] ?? { icon: "check", titleEn: "", titleBn: "", bodyEn: "", bodyBn: "" });
  const iconOptions = icons.map((n) => ({ value: n, label: n }));
  const n = (v: number | null) => (v === null ? "" : String(v));

  return (
    <form onSubmit={onSubmit} className="flex max-w-5xl flex-col gap-8" noValidate>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />

      <Group title="Core strengths" hint="Cards shown right after the client logos on the home page. Leave a row empty to drop it. Switch the section off in Design → Home page.">
        <div className={pair}>
          <TextInput id="sTitleEn" label="Section title (English)" defaultValue={strengths.titleEn} error={e.sTitleEn} />
          <TextInput id="sTitleBn" label="Section title (বাংলা)" lang="bn" defaultValue={strengths.titleBn} error={e.sTitleBn} />
          <TextArea id="sIntroEn" label="Lead line (English)" rows={2} defaultValue={strengths.introEn} error={e.sIntroEn} />
          <TextArea id="sIntroBn" label="Lead line (বাংলা)" lang="bn" rows={2} defaultValue={strengths.introBn} error={e.sIntroBn} />
        </div>
        <ol className="flex flex-col gap-4">
          {rows.map((r, i) => (
            <li key={i} className="grid gap-4 rounded-card border border-fg/10 p-4 md:grid-cols-[10rem_1fr_1fr]">
              <Select id={`icon_${i}`} label={`Card ${i + 1}: icon`} defaultValue={r.icon} options={iconOptions} />
              <TextInput id={`titleEn_${i}`} label="Title (English)" defaultValue={r.titleEn} error={e[`titleEn_${i}`]} />
              <TextInput id={`titleBn_${i}`} label="Title (বাংলা)" lang="bn" defaultValue={r.titleBn} error={e[`titleBn_${i}`]} />
              <span className="hidden md:block" />
              <TextArea id={`bodyEn_${i}`} label="Text (English)" rows={2} defaultValue={r.bodyEn} error={e[`bodyEn_${i}`]} />
              <TextArea id={`bodyBn_${i}`} label="Text (বাংলা)" lang="bn" rows={2} defaultValue={r.bodyBn} error={e[`bodyBn_${i}`]} />
              <ClearRowButton label="Remove this card" />
            </li>
          ))}
        </ol>
      </Group>

      <Group
        title="Cost savings graphic"
        hint={
          <>
            A ring showing the share saved and two bars, the cost before Xpert and the cost with Xpert, in the same unit (e.g. ৳ 25 → 5 lakh a month, or 10 → 2 %
            of revenue). The percentage is worked out from the two figures; write <code>{"{pct}"}</code> in the title or text to show it. It appears on the live
            site only when published, with both figures and their source.
          </>
        }
      >
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" value="1" defaultChecked={savings.published} className="size-4 accent-brand-royal" /> Published (show on the live site)
        </label>
        <div className="grid gap-4 md:grid-cols-4">
          <TextInput id="before" label="Cost before Xpert" inputMode="decimal" placeholder="25" defaultValue={n(savings.before)} error={e.before} />
          <TextInput id="after" label="Cost with Xpert" inputMode="decimal" placeholder="5" defaultValue={n(savings.after)} error={e.after} />
          <TextInput id="prefix" label="Before the number" placeholder="৳" defaultValue={savings.prefix} error={e.prefix} />
          <TextInput id="pct" label="Or only the share saved (%)" inputMode="decimal" placeholder="80" hint="Used when the two costs are empty: bars drawn to scale." defaultValue={n(savings.pct)} error={e.pct} />
          <TextInput id="unitEn" label="Unit (English)" placeholder="lakh a month" defaultValue={savings.unitEn} error={e.unitEn} />
          <TextInput id="unitBn" label="Unit (বাংলা)" lang="bn" placeholder="লাখ / মাস" defaultValue={savings.unitBn} error={e.unitBn} />
        </div>
        <div className={pair}>
          <TextInput id="vTitleEn" label="Title (English)" defaultValue={savings.titleEn} error={e.vTitleEn} />
          <TextInput id="vTitleBn" label="Title (বাংলা)" lang="bn" defaultValue={savings.titleBn} error={e.vTitleBn} />
          <TextArea id="vBodyEn" label="Text (English)" rows={2} defaultValue={savings.bodyEn} error={e.vBodyEn} />
          <TextArea id="vBodyBn" label="Text (বাংলা)" lang="bn" rows={2} defaultValue={savings.bodyBn} error={e.vBodyBn} />
          <TextInput id="beforeLabelEn" label="First bar label (English)" defaultValue={savings.beforeLabelEn} error={e.beforeLabelEn} />
          <TextInput id="beforeLabelBn" label="First bar label (বাংলা)" lang="bn" defaultValue={savings.beforeLabelBn} error={e.beforeLabelBn} />
          <TextInput id="afterLabelEn" label="Second bar label (English)" defaultValue={savings.afterLabelEn} error={e.afterLabelEn} />
          <TextInput id="afterLabelBn" label="Second bar label (বাংলা)" lang="bn" defaultValue={savings.afterLabelBn} error={e.afterLabelBn} />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_10rem]">
          <TextInput id="source" label="Source" placeholder="XFL cost study of member brokers, 2026" defaultValue={savings.source} error={e.source} />
          <TextInput id="sourceUrl" type="url" label="Source link (optional)" placeholder="https://" defaultValue={savings.sourceUrl} error={e.sourceUrl} />
          <TextInput id="asOf" type="date" label="As of" defaultValue={savings.asOf} error={e.asOf} />
        </div>
        <div className={pair}>
          <TextArea id="noteEn" label="Note under the chart (English, optional)" rows={2} defaultValue={savings.noteEn} error={e.noteEn} />
          <TextArea id="noteBn" label="Note under the chart (বাংলা, optional)" lang="bn" rows={2} defaultValue={savings.noteBn} error={e.noteBn} />
        </div>
      </Group>

      <Group title="WhatsApp button" hint="A floating button at the bottom right of every page that opens a WhatsApp chat with this number, the greeting filled in. It appears as soon as a number is saved.">
        <div className={pair}>
          <TextInput id="waNumber" label="WhatsApp number" placeholder="+8801XXXXXXXXX" defaultValue={whatsapp.number} error={e.waNumber} />
          <span className="hidden md:block" />
          <TextInput id="waLabelEn" label="Button text (English)" defaultValue={whatsapp.labelEn} error={e.waLabelEn} />
          <TextInput id="waLabelBn" label="Button text (বাংলা)" lang="bn" defaultValue={whatsapp.labelBn} error={e.waLabelBn} />
          <TextArea id="waMessageEn" label="Greeting filled in (English)" rows={2} defaultValue={whatsapp.messageEn} error={e.waMessageEn} />
          <TextArea id="waMessageBn" label="Greeting filled in (বাংলা)" lang="bn" rows={2} defaultValue={whatsapp.messageBn} error={e.waMessageBn} />
        </div>
      </Group>

      <div>
        <SubmitButton pending={pending}>Save home highlights</SubmitButton>
      </div>
    </form>
  );
}
