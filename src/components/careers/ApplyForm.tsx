"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { applyForJob, type ApplyState } from "@/app/[locale]/career-actions";
import { useActionForm } from "@/components/forms/useActionForm";
import { TextArea, TextInput } from "@/components/ui/Field";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

/** Application form: name, email, phone, CV (PDF), cover letter, consent. */
export function ApplyForm({ careerId, t, locale, turnstileSiteKey }: { careerId: string; t: Messages; locale: AppLocale; turnstileSiteKey: string | null }) {
  const { state, pending, onSubmit } = useActionForm<ApplyState>(applyForJob, {});
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  useEffect(() => {
    if (state.status === "error") (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
  }, [state]);

  const msg: Record<string, string> = {
    required: t.errRequired, email: t.errEmail, tooLong: t.errTooLong, cvType: t.cvType, cvSize: t.cvSize, consent: t.errConsent,
  };
  const err = (k: string) => (state.errors?.[k] ? msg[state.errors[k]!] : undefined);
  const formMessage: Record<string, string> = {
    rateLimited: t.errRateLimited, captcha: t.errCaptcha, generic: t.errGeneric, fix: t.errFix, closed: t.jobClosedBody,
  };

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl border border-market-up/30 bg-market-up/10 p-6">
        <p className="font-display text-xl font-semibold">{t.applyThanksTitle}</p>
        <p className="text-sm text-text-secondary">{t.applyThanksBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate encType="multipart/form-data">
      <input type="hidden" name="careerId" value={careerId} />
      <input ref={startedRef} type="hidden" name="started_at" defaultValue="" />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message && (
        <p role="alert" className="rounded-xl border border-market-down/40 bg-market-down/10 px-4 py-3 text-sm">
          {formMessage[state.message]}
        </p>
      )}
      <TextInput id="name" label={t.formName} required autoComplete="name" error={err("name")} />
      <TextInput id="email" type="email" label={t.applyEmail} required autoComplete="email" error={err("email")} />
      <TextInput id="phone" type="tel" label={t.formPhone} autoComplete="tel" error={err("phone")} />
      <TextInput id="cv" type="file" accept="application/pdf,.pdf" label={t.cvLabel} hint={t.cvHint} required error={err("cv")} className="pt-3 file:mr-3 file:rounded-full file:border-0 file:bg-brand-royal file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
      <TextArea id="coverLetter" label={t.coverLetter} rows={5} error={err("coverLetter")} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-brand-royal" />
        <span>
          {t.applyConsent}
          {err("consent") && <span className="mt-1 block text-xs text-market-down">{err("consent")}</span>}
        </span>
      </label>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" data-language={locale} aria-label={t.securityCheck} />
        </>
      )}
      <button type="submit" disabled={pending} className="btn-glow inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.formSending : t.submitApplication}
      </button>
    </form>
  );
}
