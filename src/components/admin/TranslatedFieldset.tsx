"use client";

import { useState } from "react";
import { TextArea, TextInput } from "@/components/ui/Field";
import { slugify } from "@/lib/validation/common";

/**
 * One language's fields in an editor (English or Bangla). The first field is
 * the title; the URL slug follows it until an editor types their own. Field
 * names are prefixed with the locale: enTitle, bnSummary…
 */
export type FieldSpec = {
  name: string; // "Title", "Summary"… (without the locale prefix)
  label: string;
  kind?: "input" | "textarea";
  rows?: number;
  hint?: string;
  wide?: boolean;
};

export function TranslatedFieldset({
  l,
  values,
  errors,
  fields,
  slugBase,
}: {
  l: "en" | "bn";
  values: Record<string, string>;
  errors: Record<string, string>;
  fields: FieldSpec[];
  /** Address shown in the slug hint, e.g. "news" → /en/news/your-slug. Omit for items without their own page. */
  slugBase?: string;
}) {
  const [slug, setSlug] = useState(values.slug ?? "");
  const [touched, setTouched] = useState(Boolean(values.slug));
  const k = (f: string) => `${l}${f}`;
  const [title, ...rest] = fields;
  return (
    <fieldset lang={l} className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">{l === "en" ? "English" : "বাংলা — optional"}</legend>
      {title && (
        <TextInput
          id={k(title.name)}
          label={title.label}
          required={l === "en"}
          defaultValue={values[title.name.toLowerCase()] ?? ""}
          onChange={(e) => l === "en" && !touched && setSlug(slugify(e.target.value))}
          error={errors[k(title.name)]}
        />
      )}
      {slugBase !== undefined && <TextInput
        id={k("Slug")}
        label="URL slug"
        hint={l === "en" ? `Shown in the address: /en/${slugBase}/your-slug` : "Leave empty to reuse the English slug."}
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setTouched(true);
        }}
        error={errors[k("Slug")]}
      />}
      {rest.map((f) => {
        const value = values[f.name.charAt(0).toLowerCase() + f.name.slice(1)] ?? "";
        return (
          <div key={f.name} className={f.wide || f.kind === "textarea" ? "md:col-span-2" : undefined}>
            {f.kind === "textarea" ? (
              <TextArea id={k(f.name)} label={f.label} rows={f.rows ?? 4} hint={f.hint} defaultValue={value} error={errors[k(f.name)]} />
            ) : (
              <TextInput id={k(f.name)} label={f.label} hint={f.hint} defaultValue={value} error={errors[k(f.name)]} />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
