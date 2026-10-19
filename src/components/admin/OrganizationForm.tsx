"use client";

import { saveOrganization, type OrgState } from "@/app/admin/(protected)/organizations/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";
import { ORGANIZATION_KIND_LABELS, ORGANIZATION_KINDS, type OrganizationKindKey } from "@/lib/validation/organizations";

export type OrgFormValues = {
  id?: string;
  kind: OrganizationKindKey;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  websiteUrl: string;
  dseTrec: string;
  dseRank: string;
  cseRank: string;
  rankAsOf: string;
  rankSource: string;
  cseTrec: string;
  parentType: string;
  parentName: string;
  parentNameBn: string;
  logoMediaId: string;
  logoPermission: boolean;
  en: { name: string; shortName: string; description: string };
  bn: { name: string; shortName: string; description: string };
};

export function OrganizationForm({ values, images }: { values: OrgFormValues; images: ImageOption[] }) {
  const { state, pending, onSubmit } = useActionForm<OrgState>(saveOrganization, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        {(["en", "bn"] as const).map((l) => (
          <fieldset key={l} lang={l} className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
            <legend className="px-2 text-sm font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
            <TextInput id={`${l}Name`} label="Name" required={l === "en"} defaultValue={values[l].name} error={e[`${l}Name`]} />
            <TextInput
              id={`${l}ShortName`}
              label="Short name"
              hint="e.g. DSE"
              defaultValue={values[l].shortName}
              error={e[`${l}ShortName`]}
            />
            <div className="md:col-span-2">
              <TextArea
                id={`${l}Description`}
                label="Description"
                rows={3}
                defaultValue={values[l].description}
                error={e[`${l}Description`]}
              />
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
          <Select
            id="kind"
            label="Type"
            defaultValue={values.kind}
            options={ORGANIZATION_KINDS.map((k) => ({ value: k, label: ORGANIZATION_KIND_LABELS[k] }))}
            error={e.kind}
          />
          <TextInput id="websiteUrl" type="url" label="Website" placeholder="https://" defaultValue={values.websiteUrl} error={e.websiteUrl} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="dseTrec" label="DSE TREC no." placeholder="026" hint="Brokerages only." defaultValue={values.dseTrec} error={e.dseTrec} />
            <TextInput id="cseTrec" label="CSE TREC no." placeholder="021" defaultValue={values.cseTrec} error={e.cseTrec} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="dseRank" inputMode="numeric" label="DSE ranking" placeholder="1" hint="Position among DSE brokers. Empty hides it." defaultValue={values.dseRank} error={e.dseRank} />
            <TextInput id="cseRank" inputMode="numeric" label="CSE ranking" placeholder="3" defaultValue={values.cseRank} error={e.cseRank} />
            <TextInput id="rankAsOf" label="Ranking as of" placeholder="September 2026" defaultValue={values.rankAsOf} error={e.rankAsOf} />
            <TextInput id="rankSource" label="Ranking source" placeholder="DSE monthly top 20 TREC holders" defaultValue={values.rankSource} error={e.rankSource} />
          </div>
          <Select
            id="parentType"
            label="Owned by (consortium members)"
            defaultValue={values.parentType}
            options={[
              { value: "", label: "Not stated" },
              { value: "BANK", label: "A bank" },
              { value: "INSURANCE", label: "An insurance company" },
              { value: "CORPORATE", label: "A corporate group" },
              { value: "INDEPENDENT", label: "Independent" },
            ]}
            error={e.parentType}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="parentName" label="Parent institution" placeholder="Bank Asia PLC" defaultValue={values.parentName} error={e.parentName} />
            <TextInput id="parentNameBn" label="Parent (বাংলা)" lang="bn" defaultValue={values.parentNameBn} error={e.parentNameBn} />
          </div>
          <p className="-mt-2 text-xs text-text-secondary">Counts and names on the home page's &ldquo;Who owns Xpert&rdquo; come from these fields.</p>
          <ImagePicker name="logoMediaId" label="Logo" options={images} defaultValue={values.logoMediaId} error={e.logoMediaId} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="logoPermission" defaultChecked={values.logoPermission} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Written permission to show the logo is on file
              <span className="block text-xs text-text-secondary">Without this, the website shows the name only.</span>
            </span>
          </label>
          <TextInput id="sortOrder" type="number" min={0} label="Order" defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
