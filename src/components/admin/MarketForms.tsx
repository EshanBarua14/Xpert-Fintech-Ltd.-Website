"use client";

import { saveRefreshInterval, saveHeadlineShare, saveTradingHours, saveMarketGoal, saveMarketShare, saveMarketSource, testMarketFeed, type MarketState } from "@/app/admin/(protected)/market/actions";
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
          <span className="font-medium">Show the licensed feed on the website</span>
          <span className="block text-text-secondary">
            For MARKET_DATA_MODE=licensed: turn on once the licence is confirmed and “Test connection” succeeds. DSE/CSE public data (exchange mode) shows without this.
          </span>
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

type ShareInitial = { tradeDate: string; sourceNote: string; dseXpert: string; dseMarket: string; cseXpert: string; cseMarket: string };

export function MarketShareForm({ today, live, initial }: { today: string; live: { DSE: number | null; CSE: number | null }; initial?: ShareInitial }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveMarketShare, {});
  const e = state.errors ?? {};
  const liveHint = (ex: "DSE" | "CSE") =>
    live[ex]
      ? `Today's total from ${ex} live data: ৳${live[ex]!.toLocaleString("en-US")}. Leave empty to use it.`
      : `The exchange's total turnover that day, in taka.${ex === "DSE" ? " DSE does not publish it outside its data feed, so enter it from the DSE daily report." : ""}`;
  return (
    <form key={state.ok ? state.savedAt : "form"} onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextInput id="tradeDate" type="date" label="Trading day" required defaultValue={initial?.tradeDate ?? today} max={today} error={e.tradeDate} />
        <TextInput id="sourceNote" label="Source" defaultValue={initial?.sourceNote} hint="Shown on the website, e.g. DSE and CSE daily broker turnover reports" error={e.sourceNote} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {(["DSE", "CSE"] as const).map((ex) => {
          const k = ex.toLowerCase();
          return (
            <fieldset key={ex} className="flex flex-col gap-4 rounded-card border border-fg/10 p-4">
              <legend className="px-2 font-mono text-sm font-semibold">{ex}</legend>
              <TextInput id={`${k}Xpert`} inputMode="decimal" defaultValue={initial?.[`${k}Xpert` as "dseXpert"]} label="Xpert turnover (BDT)" hint="Total traded through Xpert members. Leave this and the share empty to skip this exchange." error={e[`${k}Xpert`]} />
              <TextInput
                id={`${k}Share`}
                inputMode="decimal"
                label="…or Xpert's share (%)"
                placeholder="e.g. 45"
                hint="Used only when Xpert turnover is empty: the turnover is worked out from the market total."
                error={e[`${k}Share`]}
              />
              <TextInput id={`${k}Market`} inputMode="decimal" defaultValue={initial?.[`${k}Market` as "dseMarket"]} label="Market turnover (BDT)" placeholder={live[ex] ? String(live[ex]) : undefined} hint={liveHint(ex)} error={e[`${k}Market`]} />
            </fieldset>
          );
        })}
      </div>
      <FormMessage message={state.message} isError={!state.ok} />
      <div>
        <SubmitButton pending={pending}>Save the day&rsquo;s figures</SubmitButton>
      </div>
    </form>
  );
}

export type GoalValues = { targetPct: string; year: string; goalEn: string; goalBn: string };

/** Market-share goal: target percentage, year, and an optional line shown under it. */
export function MarketGoalForm({ values }: { values: GoalValues }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveMarketGoal, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput id="targetPct" type="number" inputMode="decimal" min={1} max={100} step="0.1" label="Target share (%)" defaultValue={values.targetPct} error={e.targetPct} />
        <TextInput id="year" type="number" inputMode="numeric" min={2024} max={2100} label="By the end of" defaultValue={values.year} error={e.year} />
        <TextInput id="goalEn" label="Line under the goal (English, optional)" placeholder="Our goal for the share of DSE and CSE turnover traded through Xpert." defaultValue={values.goalEn} error={e.goalEn} />
        <TextInput id="goalBn" label="Line under the goal (বাংলা, optional)" lang="bn" defaultValue={values.goalBn} error={e.goalBn} />
      </div>
      <div>
        <SubmitButton pending={pending}>Save goal</SubmitButton>
      </div>
    </form>
  );
}

/** Xpert's overall share as XFL states it (e.g. 45%), with the date it applies to. Empty removes it. */
export function HeadlineShareForm({ pct, asOf, dse = "", cse = "" }: { pct: string; asOf: string; dse?: string; cse?: string }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveHeadlineShare, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput id="headlinePct" inputMode="decimal" label="Overall market share (%)" placeholder="45" defaultValue={pct} hint="Leave empty to show the share worked out from the daily figures." error={e.headlinePct || undefined} />
        <TextInput id="headlineAsOf" type="date" label="As of" defaultValue={asOf} hint="Shown next to the figure. Optional." error={e.headlineAsOf || undefined} />
        <TextInput id="avgDse" inputMode="decimal" label="DSE daily average share (%)" placeholder="45" defaultValue={dse} hint="Shown on the DSE market card next to the day's figure (and alone until one is entered)." error={e.avgDse || undefined} />
        <TextInput id="avgCse" inputMode="decimal" label="CSE daily average share (%)" defaultValue={cse} hint="The same for CSE. Leave empty if not stated." error={e.avgCse || undefined} />
      </div>
      <div>
        <SubmitButton pending={pending}>Save shares</SubmitButton>
      </div>
    </form>
  );
}

/** Refresh interval for the ticker, hero indices, market cards and price boards. */
export function RefreshIntervalForm({ seconds }: { seconds: number }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveRefreshInterval, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4" noValidate>
      <div className="min-w-[14rem]">
        <Select
          id="refreshSeconds"
          label="Refresh prices every"
          defaultValue={String(seconds)}
          options={[
            { value: "15", label: "15 seconds" },
            { value: "30", label: "30 seconds" },
            { value: "60", label: "60 seconds" },
          ]}
          error={state.errors?.refreshSeconds}
        />
      </div>
      <SubmitButton pending={pending}>Save</SubmitButton>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
    </form>
  );
}

export type ScheduleValues = { days: number[]; preOpen: string; open: string; close: string; postClose: string; holidays: string[] };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Session times, trading days and holidays for DSE and CSE: the site's open / closed status follows them. */
export function TradingHoursForm({ values }: { values: { DSE: ScheduleValues; CSE: ScheduleValues } }) {
  const { state, pending, onSubmit } = useActionForm<MarketState>(saveTradingHours, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />
      <div className="grid gap-6 lg:grid-cols-2">
        {(["DSE", "CSE"] as const).map((ex) => {
          const v = values[ex];
          return (
            <fieldset key={ex} className="flex flex-col gap-4 rounded-card border border-fg/10 p-4">
              <legend className="px-1 font-semibold">{ex}</legend>
              <div className="grid grid-cols-2 gap-4">
                <TextInput id={`${ex}_preOpen`} type="time" label="Pre-opening starts" defaultValue={v.preOpen} error={e[`${ex}_preOpen`]} />
                <TextInput id={`${ex}_open`} type="time" label="Trading opens" defaultValue={v.open} error={e[`${ex}_open`]} />
                <TextInput id={`${ex}_close`} type="time" label="Trading closes" defaultValue={v.close} error={e[`${ex}_close`]} />
                <TextInput id={`${ex}_postClose`} type="time" label="Post-closing ends" defaultValue={v.postClose} error={e[`${ex}_postClose`]} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Trading days</span>
                <div className="flex flex-wrap gap-3">
                  {DAY_NAMES.map((d, i) => (
                    <label key={d} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name={`${ex}_days`} value={i} defaultChecked={v.days.includes(i)} className="size-4 accent-brand-royal" />
                      {d}
                    </label>
                  ))}
                </div>
                {e[`${ex}_days`] && <span className="text-sm text-market-down">{e[`${ex}_days`]}</span>}
              </div>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Holidays (no trading)</span>
                <textarea
                  name={`${ex}_holidays`}
                  rows={4}
                  defaultValue={v.holidays.join("\n")}
                  placeholder={"2026-12-16\n2026-12-25"}
                  className="rounded-control border border-fg/15 bg-transparent px-3 py-2 font-mono text-sm"
                />
                <span className="text-text-secondary">One date per line (YYYY-MM-DD), from the exchange&rsquo;s holiday notice.</span>
                {e[`${ex}_holidays`] && <span className="text-market-down">{e[`${ex}_holidays`]}</span>}
              </label>
            </fieldset>
          );
        })}
      </div>
      <div>
        <SubmitButton pending={pending}>Save trading hours</SubmitButton>
      </div>
    </form>
  );
}
