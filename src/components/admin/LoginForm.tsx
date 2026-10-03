"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, verifyLoginCode, type LoginState } from "@/app/admin/auth-actions";
import { TextInput } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-market-down/40 bg-market-down/10 px-3 py-2 text-sm">
      {message}
    </p>
  );
}

/** Step 2: the 6-digit code from the authenticator app. */
function CodeForm() {
  const [state, action] = useActionState<LoginState, FormData>(verifyLoginCode, { step: "code" });
  if (state.step === "password") {
    return (
      <div className="flex flex-col gap-5">
        <ErrorBox message={state.error} />
        {/* Full page load on purpose: it resets the two-step sign-in state. A <Link> would keep it. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/login" className={buttonClasses({ size: "lg", className: "w-full" })}>
          Sign in again
        </a>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-text-secondary">Open your authenticator app and enter the 6-digit code for Xpert Fintech.</p>
      <ErrorBox message={state.error} />
      <TextInput
        id="code"
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        required
        autoFocus
        className="tabular text-lg tracking-[0.3em]"
      />
      <Submit label="Verify" pendingLabel="Checking…" />
      {/* Full page load on purpose: it resets the two-step sign-in state. A <Link> would keep it. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/admin/login" className="text-center text-sm text-text-secondary hover:text-brand-sky">
        Use a different account
      </a>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  if (state.step === "code") return <CodeForm />;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <ErrorBox message={state.error} />
      <TextInput id="email" type="email" label="Email" autoComplete="username" required defaultValue={state.email} autoFocus />
      <TextInput id="password" type="password" label="Password" autoComplete="current-password" required />
      <Submit label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}
