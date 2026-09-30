"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/admin/auth-actions";
import { TextInput } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p role="alert" className="rounded-control border border-market-down/40 bg-market-down/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <TextInput
        id="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        defaultValue={state.email}
        autoFocus
      />
      <TextInput id="password" type="password" label="Password" autoComplete="current-password" required />
      <Submit />
    </form>
  );
}
