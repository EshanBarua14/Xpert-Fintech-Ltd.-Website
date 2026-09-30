"use client";

import { saveMarketShare, saveMarketSource, testMarketFeed, type MarketState } from "@/app/admin/(protected)/market/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Select, TextInput } from "@/components/ui/Field";

export type SourceValues = {
  providerName: string;
  licenceReference: string;
  licenceExpiresAt: string;
  displayDelayMinutes: number;
  isActive: boolean;
};

export function MarketSourceForm({ values }: { values: SourceValues }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveMarketSource, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput id="providerName" label="Data provider" hint="Shown under the widgets as the source." defaultValue={values.providerName} error={e.providerName} />
        <TextInput id="licenceReference" label="Licence reference" defaultValue={values.licenceReference} error={e.licenceReference} />
        <TextInput id="licenceExpiresAt" type="date" label="Licence expires" defaultValue={values.licenceExpiresAt} error={e.licenceExpiresAt} />
        <TextInput
          id="displayDelayMinutes"
          type="number"
          min={0}
          max={240}
          label="Display delay (minutes)"
          hint="0 shows the data as live. Use your licence's required delay, e.g. 15."
          defaultValue={values.displayDelayMinutes}
          error={e.displayDelayMinutes}
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="mt-0.5 size-4 accent-brand-royal" />
        <span>
          <span className="font-medium">Show market data on the website</span>
          <span className="block text-text-secondary">Turn on once the licence is confirmed and “Test connection” succeeds.</span>
        </span>
      </label>
      <FormMessage message={state.message} isError={!state.ok} />
      <div>
        <SubmitButton pending={pending}>Save feed settings</SubmitButton>
      </div>
    </form>
  );
}

export function TestFeedButton() {
  const { state, pending, onSubmit } = useActionForm<MarketState>(testMarketFeed, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <SubmitButton pending={pending} variant="secondary" pendingLabel="Testing…">
          Test connection
        </SubmitButton>
      </div>
      <FormMessage message={state.message} isError={!state.ok} />
    </form>
  );
}

export function MarketShareForm({ today }: { today: string }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveMarketShare, {});
  const e = state.errors ?? {};
  return (
    <form key={state.ok ? state.savedAt : "form"} onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-3">
        <TextInput id="tradeDate" type="date" label="Trading day" required defaultValue={today} error={e.tradeDate} />
        <Select
          id="exchange"
          label="Exchange"
          defaultValue="DSE"
          options={[
            { value: "DSE", label: "DSE" },
            { value: "CSE", label: "CSE" },
          ]}
        />
        <TextInput id="sourceNote" label="Source" hint="e.g. DSE daily broker turnover report" error={e.sourceNote} />
        <TextInput id="xpertTurnover" inputMode="decimal" label="Xpert turnover (BDT)" required hint="Total traded through Xpert members, in taka." error={e.xpertTurnover} />
        <TextInput id="marketTurnover" inputMode="decimal" label="Market turnover (BDT)" required hint="The exchange's total turnover that day, in taka." error={e.marketTurnover} />
      </div>
      <FormMessage message={state.message} isError={!state.ok} />
      <div>
        <SubmitButton pending={pending}>Save figure</SubmitButton>
      </div>
    </form>
  );
}
