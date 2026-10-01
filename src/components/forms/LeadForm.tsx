"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { submitLead } from "@/app/[locale]/lead-actions";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { BUSINESS_TYPES } from "@/lib/validation/lead-constants";
import type { LeadFormState } from "@/lib/validation/lead";
import { useActionForm } from "./useActionForm";

type Props = {
  mode: "demo" | "contact";
  locale: AppLocale;
  t: Messages;
  offerings: { id: string; name: string }[];
  defaultOfferingId?: string | null;
  turnstileSiteKey: string | null;
};

const initial: LeadFormState = { status: "idle" };
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

const BUSINESS_TYPE_KEYS: Record<(typeof BUSINESS_TYPES)[number], keyof Messages> = {
  brokerage: "btBrokerage",
  merchantBank: "btMerchantBank",
  assetManager: "btAssetManager",
  bank: "btBank",
  other: "btOther",
};

/** Demo-request and contact form. Saves to Admin → Leads. */
export function LeadForm({ mode, locale, t, offerings, defaultOfferingId, turnstileSiteKey }: Props) {
  const { state, pending, onSubmit } = useActionForm(submitLead, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Filled in the browser: when the form appeared, which page, and any campaign tags.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const set = (name: string, value: string) => {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = value;
    };
    set("started_at", String(Date.now()));
    set("page_path", window.location.pathname + window.location.search);
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) set(key, params.get(key) ?? "");
  }, []);

  useEffect(() => {
    if (state.status === "success") thanksRef.current?.focus();
    else if (state.status === "error") {
      // A Turnstile token works once; get a fresh one for the next attempt.
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      const firstInvalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]");
      (firstInvalid ?? errorRef.current)?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-8" role="status">
        <h2 ref={thanksRef} tabIndex={-1} className="font-display text-2xl font-semibold focus:outline-none">
          {t.thanksTitle}
        </h2>
        <p className="text-text-secondary">{mode === "demo" ? t.thanksDemo : t.thanksContact}</p>
      </div>
    );
  }

  const e = state.errors ?? {};
  const err = (field: string) => {
    const code = e[field];
    if (!code) return undefined;
    const map: Record<string, string> = {
      required: t.errRequired,
      email: t.errEmail,
      phone: t.errPhone,
      tooLong: t.errTooLong,
      consent: t.errConsent,
    };
    return map[code] ?? t.errRequired;
  };
  const formError =
    state.message === "rateLimited"
      ? t.errRateLimited
      : state.message === "captcha"
        ? t.errCaptcha
        : state.message === "generic"
          ? t.errGeneric
          : state.message === "fix"
            ? t.errFix
            : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-busy={pending}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="started_at" defaultValue="" />
      <input type="hidden" name="page_path" defaultValue="" />
      {UTM_KEYS.map((k) => (
        <input key={k} type="hidden" name={k} defaultValue="" />
      ))}
      {/* Honeypot: invisible to people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="company_website">Website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-text-secondary">{t.formRequiredNote}</p>

      {formError && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-control border border-market-down/40 bg-market-down/10 px-4 py-3 text-sm">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput id="name" label={t.formName} required autoComplete="name" maxLength={120} error={err("name")} />
        <TextInput id="email" type="email" label={t.formEmail} required autoComplete="email" maxLength={200} error={err("email")} />
        <TextInput id="phone" type="tel" label={t.formPhone} autoComplete="tel" maxLength={30} error={err("phone")} />
        <TextInput
          id="organization"
          label={t.formOrganization}
          required={mode === "demo"}
          autoComplete="organization"
          maxLength={200}
          error={err("organization")}
        />
        {mode === "demo" && (
          <>
            <TextInput id="designation" label={t.formDesignation} autoComplete="organization-title" maxLength={120} error={err("designation")} />
            <Select
              id="businessType"
              label={t.formBusinessType}
              defaultValue=""
              options={[{ value: "", label: t.formChoose }, ...BUSINESS_TYPES.map((b) => ({ value: b, label: t[BUSINESS_TYPE_KEYS[b]] }))]}
            />
            {offerings.length > 0 && (
              <Select
                id="interestedOfferingId"
                label={t.formProduct}
                defaultValue={defaultOfferingId ?? ""}
                options={[{ value: "", label: t.formProductAny }, ...offerings.map((o) => ({ value: o.id, label: o.name }))]}
              />
            )}
          </>
        )}
        <Select
          id="preferredContact"
          label={t.formPreferredContact}
          defaultValue="ANY"
          options={[
            { value: "ANY", label: t.cmAny },
            { value: "EMAIL", label: t.cmEmail },
            { value: "PHONE", label: t.cmPhone },
            { value: "WHATSAPP", label: t.cmWhatsapp },
          ]}
        />
      </div>

      {mode === "demo" && (
        <TextArea
          id="expectedRequirement"
          label={t.formRequirement}
          hint={t.formRequirementHint}
          rows={4}
          maxLength={3000}
          error={err("expectedRequirement")}
        />
      )}
      <TextArea id="message" label={t.formMessage} required={mode === "contact"} rows={mode === "contact" ? 6 : 3} maxLength={5000} error={err("message")} />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={e.consent ? true : undefined}
            aria-describedby={e.consent ? "consent-error" : undefined}
            className="mt-1 size-4 shrink-0 accent-brand-royal"
          />
          <label htmlFor="consent" className="text-sm text-text-secondary">
            {t.formConsent}
            <span className="text-brand-sky" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
        </div>
        {e.consent && (
          <p id="consent-error" className="text-xs text-market-down" role="alert">
            {err("consent")}
          </p>
        )}
      </div>

      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" data-language={locale} aria-label={t.securityCheck} />
        </>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-glow inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? t.formSending : mode === "demo" ? t.formSubmitDemo : t.formSubmitContact}
        </button>
      </div>
    </form>
  );
}
