"use client";

import { useState } from "react";
import { saveDesign, type DesignState } from "@/app/admin/(protected)/design/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Icon } from "@/components/ui/Icon";

type Field = { key: string; label: string; value: string; placeholder: string };
export type DesignFormValues = {
  colors: Field[];
  tones: Field[];
  products: { key: string; name: string; from: string; to: string; icon: string; defaults: { from: string; to: string; icon: string } }[];
  nav: { path: string; label: string; depth: number; icon: string; auto: string }[];
  home: { key: string; label: string; shown: boolean }[];
  icons: string[];
};

function ColorField({ name, label, value, placeholder, error }: { name: string; label: string; value: string; placeholder: string; error?: string }) {
  const [v, setV] = useState(value);
  const shown = /^#?[0-9a-f]{6}$/i.test(v) ? (v.startsWith("#") ? v : `#${v}`) : placeholder;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: pick`}
          value={shown}
          onChange={(e) => setV(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-fg/15 bg-transparent p-1"
        />
        <input
          name={name}
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full min-w-0 rounded-control border border-fg/15 bg-navy-900 px-3 font-mono text-sm"
        />
        {v && (
          <button type="button" onClick={() => setV("")} className="shrink-0 text-xs text-text-secondary hover:text-fg">
            Default
          </button>
        )}
      </span>
      {error && <span className="text-xs text-market-down">{error}</span>}
    </label>
  );
}

function IconSelect({ name, value, icons, auto, label }: { name: string; value: string; icons: string[]; auto: string; label: string }) {
  const [v, setV] = useState(value);
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-fg/10 text-brand-sky">
        <Icon name={v || auto} className="size-[18px]" />
      </span>
      <select name={name} value={v} onChange={(e) => setV(e.target.value)} aria-label={label} className="field-select h-9 min-w-0 flex-1 rounded-control border border-fg/15 bg-navy-900 px-2 text-sm">
        <option value="">Automatic ({auto})</option>
        {icons.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Admin → Design: site colours, group colours, product colours and symbols, menu icons, home sections. */
export function DesignForm({ values }: { values: DesignFormValues }) {
  const { state, pending, onSubmit } = useActionForm<DesignState>(saveDesign, {});
  const e = state.errors ?? {};
  const box = "flex flex-col gap-5 rounded-card border border-fg/10 p-6";
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      <FormMessage message={state.message} isError={!state.ok && Boolean(state.errors)} />

      <section className={box}>
        <div>
          <h2 className="font-display text-xl font-semibold">Site colours</h2>
          <p className="mt-1 text-sm text-text-secondary">Buttons, links, highlights and focus rings. Leave a field empty to keep the built-in colour (shown greyed).</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {values.colors.map((c) => (
            <ColorField key={c.key} name={`color.${c.key}`} label={c.label} value={c.value} placeholder={c.placeholder} error={e[`color.${c.key}`]} />
          ))}
        </div>
      </section>

      <section className={box}>
        <div>
          <h2 className="font-display text-xl font-semibold">People card colours</h2>
          <p className="mt-1 text-sm text-text-secondary">The accent of the profile cards and profiles on each people page.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {values.tones.map((c) => (
            <ColorField key={c.key} name={`tone.${c.key}`} label={c.label} value={c.value} placeholder={c.placeholder} error={e[`tone.${c.key}`]} />
          ))}
        </div>
      </section>

      <section className={box}>
        <div>
          <h2 className="font-display text-xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Each product&rsquo;s colours and symbol, used for its mark (until a logo is uploaded in Admin → Products), its device display and its automation flow.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {values.products.map((p) => (
            <li key={p.key} className="grid gap-4 rounded-xl border border-fg/[0.08] p-4 lg:grid-cols-[12rem_1fr_1fr_1fr] lg:items-end">
              <input type="hidden" name="productKey" value={p.key} />
              <span className="font-semibold">{p.name}</span>
              <ColorField name={`product.${p.key}.from`} label="Colour 1" value={p.from} placeholder={p.defaults.from} error={e[`product.${p.key}.from`]} />
              <ColorField name={`product.${p.key}.to`} label="Colour 2" value={p.to} placeholder={p.defaults.to} error={e[`product.${p.key}.to`]} />
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Symbol</span>
                <IconSelect name={`product.${p.key}.icon`} value={p.icon} icons={values.icons} auto={p.defaults.icon} label={`${p.name}: symbol`} />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <div>
          <h2 className="font-display text-xl font-semibold">Menu icons</h2>
          <p className="mt-1 text-sm text-text-secondary">The icon beside each link in the main menu&rsquo;s dropdowns and the phone menu. Link names and order are in Admin → Navigation.</p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {values.nav.map((n) => (
            <li key={n.path} className="flex flex-col gap-1.5" style={{ paddingLeft: `${n.depth * 1.25}rem` }}>
              <input type="hidden" name="navPath" value={n.path} />
              <span className="text-sm font-medium">
                {n.label} <span className="font-mono text-xs text-text-secondary">/{n.path}</span>
              </span>
              <IconSelect name={`nav.${n.path}`} value={n.icon} icons={values.icons} auto={n.auto} label={`${n.label}: icon`} />
            </li>
          ))}
        </ul>
      </section>

      <section className={box}>
        <div>
          <h2 className="font-display text-xl font-semibold">Home page sections</h2>
          <p className="mt-1 text-sm text-text-secondary">Untick a section to hide it. Its content stays in the admin.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {values.home.map((h) => (
            <li key={h.key}>
              <label className="flex items-center gap-3 rounded-xl border border-fg/[0.08] px-4 py-3 text-sm">
                <input type="checkbox" name={`home.${h.key}`} defaultChecked={h.shown} className="h-4 w-4 accent-brand-royal" />
                {h.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton pending={pending}>Save design</SubmitButton>
      </div>
    </form>
  );
}
