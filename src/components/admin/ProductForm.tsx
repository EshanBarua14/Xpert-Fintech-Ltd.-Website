"use client";

import { useState } from "react";
import { saveOffering, type FormState } from "@/app/admin/(protected)/products/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { OFFERING_TYPES } from "@/lib/validation/offering";
import { slugify } from "@/lib/validation/common";

type Translation = {
  name: string;
  slug: string;
  tagline: string;
  summary: string;
  problem: string;
  solution: string;
  targetCustomers: string;
  ctaLabel: string;
};

export type ProductFormValues = {
  id?: string;
  type: (typeof OFFERING_TYPES)[number];
  parentId: string;
  isFeatured: boolean;
  hasOwnPage: boolean;
  showDemoCta: boolean;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  en: Translation;
  bn: Translation;
};

const TYPE_LABELS: Record<(typeof OFFERING_TYPES)[number], string> = {
  PRODUCT: "Product",
  PLATFORM: "Platform",
  MODULE: "Module (part of a platform)",
  CAPABILITY: "Capability",
  SERVICE: "Service",
  INTEGRATION: "Integration",
};

function LanguageFields({
  locale,
  values,
  errors,
}: {
  locale: "en" | "bn";
  values: Translation;
  errors: Record<string, string>;
}) {
  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));
  const p = (f: string) => `${locale}.${f}`;
  const isEn = locale === "en";

  return (
    <fieldset className="flex flex-col gap-5 rounded-card border border-white/10 p-5" lang={locale}>
      <legend className="px-2 text-sm font-semibold">{isEn ? "English" : "বাংলা — optional"}</legend>
      {!isEn && (
        <p className="text-xs text-text-secondary">
          Leave the name empty to have no Bangla version yet; the Bangla page stays hidden until it exists.
        </p>
      )}
      <TextInput
        id={p("name")}
        label="Name"
        required={isEn}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (isEn && !slugTouched) setSlug(slugify(e.target.value));
        }}
        error={errors[p("name")]}
      />
      <TextInput
        id={p("slug")}
        label="URL slug"
        hint={isEn ? "Shown in the address: /en/products/your-slug" : "Leave empty to reuse the English slug."}
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setSlugTouched(true);
        }}
        error={errors[p("slug")]}
      />
      <TextInput
        id={p("tagline")}
        label="One-line value proposition"
        hint="Shown on product cards."
        defaultValue={values.tagline}
        error={errors[p("tagline")]}
      />
      <TextArea id={p("summary")} label="Summary" rows={3} defaultValue={values.summary} error={errors[p("summary")]} />
      <TextArea id={p("problem")} label="Problem it solves" rows={4} defaultValue={values.problem} error={errors[p("problem")]} />
      <TextArea id={p("solution")} label="How it solves it" rows={4} defaultValue={values.solution} error={errors[p("solution")]} />
      <TextInput
        id={p("targetCustomers")}
        label="Who it is for"
        defaultValue={values.targetCustomers}
        error={errors[p("targetCustomers")]}
      />
      <TextInput
        id={p("ctaLabel")}
        label="Button label"
        hint={isEn ? 'Defaults to "Request a demo".' : undefined}
        defaultValue={values.ctaLabel}
        error={errors[p("ctaLabel")]}
      />
    </fieldset>
  );
}

function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-brand-royal" />
      <span>
        {label}
        {hint && <span className="block text-xs text-text-secondary">{hint}</span>}
      </span>
    </label>
  );
}

export function ProductForm({
  values,
  parentOptions,
}: {
  values: ProductFormValues;
  parentOptions: { value: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useActionForm<FormState>(saveOffering, {});
  const errors = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="flex flex-col gap-6">
        {state.message && (
          <p role="alert" className="rounded-control border border-market-down/40 bg-market-down/10 px-4 py-2 text-sm">
            {state.message}
          </p>
        )}
        <LanguageFields locale="en" values={values.en} errors={errors} />
        <LanguageFields locale="bn" values={values.bn} errors={errors} />
      </div>

      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <div className="flex flex-col gap-2 text-sm" role="radiogroup" aria-label="Status">
            {(["DRAFT", "PUBLISHED"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="status" value={s} defaultChecked={values.status === s} className="accent-brand-royal" />
                {s === "DRAFT" ? "Draft — hidden from visitors" : "Published — visible on the website"}
              </label>
            ))}
          </div>
          <TextInput
            id="publishAt"
            type="datetime-local"
            label="Publish at (Dhaka time)"
            hint="Optional. A published product appears from this moment."
            defaultValue={values.publishAt}
            error={errors.publishAt}
          />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-card border border-white/10 p-5">
          <legend className="px-2 text-sm font-semibold">Settings</legend>
          <Select
            id="type"
            label="Type"
            defaultValue={values.type}
            options={OFFERING_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
            error={errors.type}
          />
          <Select
            id="parentId"
            label="Part of"
            hint="For modules inside a platform."
            defaultValue={values.parentId}
            options={[{ value: "", label: "— None —" }, ...parentOptions]}
            error={errors.parentId}
          />
          <TextInput
            id="sortOrder"
            type="number"
            min={0}
            label="Order"
            hint="Lower numbers appear first."
            defaultValue={String(values.sortOrder)}
            error={errors.sortOrder}
          />
          <Checkbox name="isFeatured" label="Featured" hint="Highlighted on the homepage." defaultChecked={values.isFeatured} />
          <Checkbox name="hasOwnPage" label="Has its own page" defaultChecked={values.hasOwnPage} />
          <Checkbox name="showDemoCta" label='Show "Request a demo"' defaultChecked={values.showDemoCta} />
        </fieldset>
      </aside>
    </form>
  );
}
