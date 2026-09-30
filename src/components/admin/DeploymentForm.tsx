"use client";

import { saveDeployment, type DeploymentState } from "@/app/admin/(protected)/deployments/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { Select, TextArea, TextInput } from "@/components/ui/Field";

export type DeploymentFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  appName: string;
  organizationId: string;
  offeringId: string;
  androidPackage: string;
  playStoreUrl: string;
  appStoreUrl: string;
  webUrl: string;
  launchedAt: string;
  linksCheckedAt: string;
  enSummary: string;
  bnSummary: string;
};

type Option = { value: string; label: string };

export function DeploymentForm({
  values,
  organizations,
  offerings,
}: {
  values: DeploymentFormValues;
  organizations: Option[];
  offerings: Option[];
}) {
  const { state, pending, onSubmit } = useActionForm<DeploymentState>(saveDeployment, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <fieldset className="grid gap-5 rounded-card border border-white/10 p-5 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">App</legend>
          <TextInput id="appName" label="App name" required defaultValue={values.appName} error={e.appName} />
          <TextInput
            id="androidPackage"
            label="Android package"
            placeholder="com.xfltrade.one"
            defaultValue={values.androidPackage}
            error={e.androidPackage}
          />
          <Select
            id="organizationId"
            label="Brokerage / organization"
            defaultValue={values.organizationId}
            options={[{ value: "", label: "— Not linked —" }, ...organizations]}
            error={e.organizationId}
          />
          <Select
            id="offeringId"
            label="Runs on"
            defaultValue={values.offeringId}
            options={[{ value: "", label: "— Not linked —" }, ...offerings]}
            error={e.offeringId}
          />
          <TextArea id="enSummary" label="Summary (English)" rows={3} defaultValue={values.enSummary} error={e.enSummary} />
          <TextArea id="bnSummary" label="Summary (বাংলা)" rows={3} lang="bn" defaultValue={values.bnSummary} error={e.bnSummary} />
        </fieldset>
        <fieldset className="grid gap-5 rounded-card border border-white/10 p-5 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">Links</legend>
          <TextInput id="playStoreUrl" type="url" label="Google Play" placeholder="https://play.google.com/…" defaultValue={values.playStoreUrl} error={e.playStoreUrl} />
          <TextInput id="appStoreUrl" type="url" label="Apple App Store" placeholder="https://apps.apple.com/…" defaultValue={values.appStoreUrl} error={e.appStoreUrl} />
          <TextInput id="webUrl" type="url" label="Web trading" placeholder="https://" defaultValue={values.webUrl} error={e.webUrl} />
          <TextInput
            id="linksCheckedAt"
            type="date"
            label="Links last checked"
            hint="Update after confirming the links still open."
            defaultValue={values.linksCheckedAt}
            error={e.linksCheckedAt}
          />
        </fieldset>
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <p className="text-xs text-text-secondary">Publish only after the brokerage has agreed to be named on the website.</p>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <TextInput id="launchedAt" type="date" label="Launched" defaultValue={values.launchedAt} error={e.launchedAt} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
