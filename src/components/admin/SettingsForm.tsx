"use client";

import { saveSettings, type SettingsState } from "@/app/admin/(protected)/settings/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { TextArea, TextInput } from "@/components/ui/Field";

export type SettingsValues = {
  companyNameEn: string;
  companyNameBn: string;
  summaryEn: string;
  summaryBn: string;
  contactEmail: string;
  contactPhone: string;
  appSupportEmail: string;
  appSupportPhone: string;
  addressEn: string;
  mapUrl: string;
  hoursEn: string;
  hoursBn: string;
  registrationEn: string;
  registrationBn: string;
  regulatoryEn: string;
  regulatoryBn: string;
  addressBn: string;
  socialLinks: string;
  alertEmails: string;
};

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">{title}</legend>
      {hint && <p className="text-xs text-text-secondary md:col-span-2">{hint}</p>}
      {children}
    </fieldset>
  );
}

export function SettingsForm({ values }: { values: SettingsValues }) {
  const { state, pending, onSubmit } = useActionForm<SettingsState>(saveSettings, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="flex max-w-4xl flex-col gap-6" noValidate>
      {state.message && (
        <p
          role={state.errors ? "alert" : "status"}
          className={
            "rounded-control border px-4 py-2 text-sm " +
            (state.errors ? "border-market-down/40 bg-market-down/10" : "border-market-up/30 bg-market-up/10")
          }
        >
          {state.message}
        </p>
      )}

      <Group title="Company" hint="Shown in the footer and in search results.">
        <TextInput id="companyNameEn" label="Company name (English)" required defaultValue={values.companyNameEn} error={e.companyNameEn} />
        <TextInput id="companyNameBn" label="Company name (বাংলা)" lang="bn" defaultValue={values.companyNameBn} error={e.companyNameBn} />
        <TextArea id="summaryEn" label="Short description (English)" rows={3} defaultValue={values.summaryEn} error={e.summaryEn} />
        <TextArea id="summaryBn" label="Short description (বাংলা)" rows={3} lang="bn" defaultValue={values.summaryBn} error={e.summaryBn} />
      </Group>

      <Group title="Contact">
        <TextInput id="contactEmail" type="email" label="General email" defaultValue={values.contactEmail} error={e.contactEmail} />
        <TextInput id="contactPhone" type="tel" label="Office phone" defaultValue={values.contactPhone} error={e.contactPhone} />
        <TextInput id="appSupportEmail" type="email" label="App support email" defaultValue={values.appSupportEmail} error={e.appSupportEmail} />
        <TextInput id="appSupportPhone" type="tel" label="App support phone" defaultValue={values.appSupportPhone} error={e.appSupportPhone} />
        <TextArea id="addressEn" label="Office address (English)" rows={2} required defaultValue={values.addressEn} error={e.addressEn} />
        <TextArea id="addressBn" label="Office address (বাংলা)" rows={2} lang="bn" defaultValue={values.addressBn} error={e.addressBn} />
        <TextInput
          id="mapUrl"
          type="url"
          label="Google Maps location (optional)"
          hint="In Google Maps: Share → Embed a map → copy the address inside src, or paste a share link. Empty = the map finds the office address."
          defaultValue={values.mapUrl}
          error={e.mapUrl}
        />
        <TextInput id="hoursEn" label="Office hours (English)" placeholder="Sunday–Thursday, 9:00–18:00" defaultValue={values.hoursEn} error={e.hoursEn} />
        <TextInput id="hoursBn" label="Office hours (বাংলা)" lang="bn" defaultValue={values.hoursBn} error={e.hoursBn} />
      </Group>

      <Group title="Registration and regulation" hint="Shown in the footer of every page, so visitors and regulators can verify who you are.">
        <TextArea id="registrationEn" label="Company registration (English)" rows={2} placeholder="Registered with RJSC, Bangladesh, No. …" defaultValue={values.registrationEn} error={e.registrationEn} />
        <TextArea id="registrationBn" label="Company registration (বাংলা)" rows={2} lang="bn" defaultValue={values.registrationBn} error={e.registrationBn} />
        <TextArea id="regulatoryEn" label="Regulatory note (English)" rows={3} placeholder="Technology provider to TREC holders of DSE and CSE. …" defaultValue={values.regulatoryEn} error={e.regulatoryEn} />
        <TextArea id="regulatoryBn" label="Regulatory note (বাংলা)" rows={3} lang="bn" defaultValue={values.regulatoryBn} error={e.regulatoryBn} />
      </Group>

      <Group title="Social links and alerts">
        <TextArea
          id="socialLinks"
          label="Social links"
          rows={4}
          hint='One per line: "LinkedIn | https://www.linkedin.com/company/…"'
          defaultValue={values.socialLinks}
          error={e.socialLinks}
        />
        <TextArea
          id="alertEmails"
          label="Send new leads to"
          rows={4}
          hint="Email addresses, separated by commas or new lines. Used once the demo form is live."
          defaultValue={values.alertEmails}
          error={e.alertEmails}
        />
      </Group>

      <div>
        <SubmitButton pending={pending}>Save settings</SubmitButton>
      </div>
    </form>
  );
}
