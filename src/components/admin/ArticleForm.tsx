"use client";

import { saveArticle, type ArticleState } from "@/app/admin/(protected)/news/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage, PublishFields } from "@/components/admin/EditorParts";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { TranslatedFieldset, type FieldSpec } from "@/components/admin/TranslatedFieldset";
import { Select, TextInput } from "@/components/ui/Field";
import type { ImageOption } from "@/lib/admin/media";

type Text = { title: string; slug: string; subtitle: string; excerpt: string; body: string };

export type ArticleFormValues = {
  id?: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: string;
  sortOrder: number;
  displayDate: string;
  authorName: string;
  coverMediaId: string;
  categoryId: string;
  tags: string;
  en: Text;
  bn: Text;
};

const FIELDS: FieldSpec[] = [
  { name: "Title", label: "Headline" },
  { name: "Subtitle", label: "Subtitle", wide: true },
  { name: "Excerpt", label: "Summary", kind: "textarea", rows: 3, hint: "Shown on news cards and in search results." },
  { name: "Body", label: "Article", kind: "textarea", rows: 16, hint: "Leave a blank line between paragraphs." },
];

export function ArticleForm({
  values,
  images,
  categories,
}: {
  values: ArticleFormValues;
  images: ImageOption[];
  categories: { value: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useActionForm<ArticleState>(saveArticle, {});
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[1fr_320px]" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="flex flex-col gap-6">
        <FormMessage message={state.message} isError={Boolean(state.errors)} />
        <TranslatedFieldset l="en" values={values.en} errors={e} fields={FIELDS} slugBase="news" />
        <TranslatedFieldset l="bn" values={values.bn} errors={e} fields={FIELDS} slugBase="news" />
      </div>
      <aside className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Publishing</legend>
          <PublishFields status={values.status} publishAt={values.publishAt} error={e.publishAt} />
          <SubmitButton pending={pending}>Save</SubmitButton>
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Details</legend>
          <TextInput id="displayDate" type="date" label="Date shown to readers" hint="Optional. Defaults to the publish date." defaultValue={values.displayDate} error={e.displayDate} />
          <TextInput id="authorName" label="Author" defaultValue={values.authorName} error={e.authorName} />
          <Select id="categoryId" label="Category" placeholder="No category" options={categories} defaultValue={values.categoryId} error={e.categoryId} />
          <TextInput id="newCategoryEn" label="…or a new category" hint="English name. Creates it on save." error={e.newCategoryEn} />
          <TextInput id="newCategoryBn" label="New category (বাংলা)" error={e.newCategoryBn} />
          <TextInput id="tags" label="Tags" hint="Separated by commas, e.g. Capital markets, RegTech" defaultValue={values.tags} error={e.tags} />
        </fieldset>
        <fieldset className="flex flex-col gap-4 rounded-card border border-fg/10 p-5">
          <legend className="px-2 text-sm font-semibold">Media</legend>
          <ImagePicker name="coverMediaId" label="Cover image" hint="Wide images (16:9) work best." options={images} defaultValue={values.coverMediaId} error={e.coverMediaId} />
          <TextInput id="sortOrder" type="number" min={0} label="Order" hint="Higher numbers appear first among articles with the same date." defaultValue={String(values.sortOrder)} error={e.sortOrder} />
        </fieldset>
      </aside>
    </form>
  );
}
