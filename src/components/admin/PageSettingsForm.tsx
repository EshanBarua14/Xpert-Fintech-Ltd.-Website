"use client";

import { savePage, type PageState } from "@/app/admin/(protected)/pages/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";

type Lang = { title: string; path: string; intro: string; seoTitle: string; seoDescription: string };

export type PageFormValues = {
  id?: string;
  isHome: boolean;
  template: "default" | "landing" | "legal";
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  showInSearch: boolean;
  ogImageId: string;
  en: Lang;
  bn: Lang;
};

export function PageSettingsForm({ values, images }: { values: PageFormValues; images: ImageOption[] }) {
  const { state, pending, onSubmit } = useActionForm<PageState>(savePage, {});
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        {(["en", "bn"] as const).map((l) => {
          const k = (f: string) => `${l}${f}`;
          const v = values[l];
          return (
            <fieldset key={l} lang={l} className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
              <legend className="px-2 text-sm font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
              <TextInput id={k("Title")} label="Page title" required={l === "en"} defaultValue={v.title} error={e[k("Title")]} />
              {values.isHome ? (
                <p className="self-end text-sm text-text-secondary">Home page address: /{l}</p>
              ) : (
                <TextInput
                  id={k("Path")}
                  label="Address"
                  hint={l === "en" ? "After /en/, e.g. company/about" : "Leave empty to reuse the English address."}
                  defaultValue={v.path}
                  error={e[k("Path")]}
                />
              )}
              <div className="md:col-span-2">
                <TextArea id={k("Intro")} label="Intro (optional)" rows={2} defaultValue={v.intro} error={e[k("Intro")]} />
              </div>
              <TextInput
                id={k("SeoTitle")}
                label="Search title"
                hint="Up to 70 characters. Defaults to the page title."
                defaultValue={v.seoTitle}
                error={e[k("SeoTitle")]}
              />
              <TextArea
                id={k("SeoDescription")}
                label="Search description"
                rows={2}
                hint="Up to 170 characters, shown under the title in Google."
                defaultValue={v.seoDescription}
                error={e[k("SeoDescription")]}
              />
            </fieldset>
          );
        })}
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>{values.id ? "Save page settings" : "Create page"}</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <Select
            id="template"
            label="Layout"
            defaultValue={values.template}
            options={[
              { value: "default", label: "Standard page" },
              { value: "landing", label: "Landing page (full-width sections)" },
              { value: "legal", label: "Legal / long text" },
            ]}
          />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="showInSearch" defaultChecked={values.showInSearch} className="mt-0.5 h-4 w-4 accent-brand-royal" />
            <span>
              Include in site search and sitemap
              <span className="block text-xs text-text-secondary">Turn off for thank-you or utility pages.</span>
            </span>
          </label>
          <ImagePicker
            name="ogImageId"
            label="Sharing image"
            hint="Shown when the page is shared on LinkedIn or WhatsApp. 1200×630 works best."
            options={images}
            defaultValue={values.ogImageId}
            error={e.ogImageId}
          />
        </fieldset>
      </aside>
    </form>
  );
}
