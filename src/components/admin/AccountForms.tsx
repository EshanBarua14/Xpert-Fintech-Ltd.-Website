"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeOwnPassword,
  confirmTwoFactor,
  createAdmin,
  disableOwnTwoFactor,
  resetAdminPassword,
  resetAdminTwoFactor,
  setAdminActive,
  startTwoFactorSetup,
  type AccountState,
  type TwoFactorState,
} from "@/app/admin/(protected)/users/actions";
import { ConfirmButton, SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/Field";

const PASSWORD_HINT = "At least 12 characters, with letters and a number.";

export function ChangePasswordForm() {
  const [round, setRound] = useState(0);
  return <ChangePasswordInner key={round} onDone={() => setRound((r) => r + 1)} />;
}

function ChangePasswordInner({ onDone }: { onDone: () => void }) {
  const { state, pending, onSubmit } = useActionForm<AccountState>(changeOwnPassword, {});
  const [done, setDone] = useState<string | null>(null);
  const e = state.errors ?? {};
  useEffect(() => {
    if (state.savedAt && state.message) {
      setDone(state.message);
      const t = setTimeout(onDone, 4000);
      return () => clearTimeout(t);
    }
  }, [state.savedAt, state.message, onDone]);
  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4" noValidate>
      {done && <FormMessage message={done} isError={false} />}
      <TextInput id="current" type="password" label="Current password" autoComplete="current-password" required error={e.current} />
      <TextInput id="next" type="password" label="New password" autoComplete="new-password" required hint={PASSWORD_HINT} error={e.next} />
      <TextInput id="confirm" type="password" label="Repeat new password" autoComplete="new-password" required error={e.confirm} />
      <div>
        <SubmitButton pending={pending}>Change password</SubmitButton>
      </div>
    </form>
  );
}

export function CreateAdminForm() {
  const [round, setRound] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {last && <FormMessage message={last} isError={false} />}
      <CreateAdminInner
        key={round}
        onCreated={(msg) => {
          setLast(msg);
          setRound((r) => r + 1);
        }}
      />
    </div>
  );
}

function CreateAdminInner({ onCreated }: { onCreated: (message: string) => void }) {
  const { state, pending, onSubmit } = useActionForm<AccountState>(createAdmin, {});
  const e = state.errors ?? {};
  useEffect(() => {
    if (state.savedAt && state.message) onCreated(state.message);
  }, [state.savedAt, state.message, onCreated]);
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3" noValidate>
      <TextInput id="name" label="Name" required error={e.name} />
      <TextInput id="email" type="email" label="Email" required autoComplete="off" error={e.email} />
      <TextInput id="password" type="password" label="Temporary password" required autoComplete="new-password" hint={PASSWORD_HINT} error={e.password} />
      <div className="md:col-span-3">
        <SubmitButton pending={pending}>Add admin</SubmitButton>
      </div>
    </form>
  );
}

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isSelf: boolean;
  lastLogin: string;
  locked: boolean;
  twoFactor: boolean;
};

function ResetPassword({ id }: { id: string }) {
  const { state, pending, onSubmit } = useActionForm<AccountState>(resetAdminPassword, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <TextInput id={`pw-${id}`} name="password" type="password" label="New temporary password" autoComplete="new-password" hint={PASSWORD_HINT} error={state.errors?.password} />
      <SubmitButton pending={pending} variant="secondary">
        Reset password
      </SubmitButton>
      {state.message && !state.errors && <span className="text-sm text-market-up">{state.message}</span>}
    </form>
  );
}

export function AdminUsersTable({ rows }: { rows: AdminRow[] }) {
  return (
    <ul className="divide-y divide-fg/10 rounded-card border border-fg/10">
      {rows.map((u) => (
        <li key={u.id} className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">{u.name}</span>
            <span className="text-sm text-text-secondary">{u.email}</span>
            {u.isSelf && <Badge tone="brand">You</Badge>}
            {!u.isActive && <Badge tone="down">Deactivated</Badge>}
            {u.locked && <Badge>Locked for a few minutes</Badge>}
            {u.twoFactor ? <Badge tone="up">Two-factor on</Badge> : <Badge>Two-factor off</Badge>}
            <span className="ml-auto text-xs text-text-secondary">Last sign-in: {u.lastLogin}</span>
          </div>
          {!u.isSelf && (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <ResetPassword id={u.id} />
              {u.twoFactor && (
                <form action={resetAdminTwoFactor}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmButton
                    message={`Turn off two-factor sign-in for ${u.email}? Do this only if they lost their phone. They will be signed out.`}
                    className="rounded-control border border-fg/15 px-3 py-2 text-sm hover:border-brand-sky"
                  >
                    Turn off two-factor
                  </ConfirmButton>
                </form>
              )}
              <form action={setAdminActive}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value={u.isActive ? "false" : "true"} />
                {u.isActive ? (
                  <ConfirmButton message={`Deactivate ${u.email}? They are signed out immediately.`}>Deactivate</ConfirmButton>
                ) : (
                  <button type="submit" className="rounded-control border border-fg/15 px-3 py-2 text-sm hover:border-brand-sky">
                    Reactivate
                  </button>
                )}
              </form>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Your own two-factor sign-in: set up with an authenticator app, or switch off. */
export function TwoFactorPanel({ enabled, serverReady }: { enabled: boolean; serverReady: boolean }) {
  const router = useRouter();
  const start = useActionForm<TwoFactorState>(startTwoFactorSetup, {});
  const confirm = useActionForm<TwoFactorState>(confirmTwoFactor, {});
  const disable = useActionForm<TwoFactorState>(disableOwnTwoFactor, {});
  const done = confirm.state.savedAt ?? disable.state.savedAt;

  // Show the new status once it has changed on the server.
  useEffect(() => {
    if (done) router.refresh();
  }, [done, router]);

  if (enabled) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          <Badge tone="up">On</Badge> <span className="ml-2 text-text-secondary">Signing in needs your password and a code from your authenticator app.</span>
        </p>
        <FormMessage message={confirm.state.message} isError={false} />
        <form onSubmit={disable.onSubmit} className="flex flex-wrap items-end gap-3" noValidate>
          <TextInput id="tfa-password" name="password" type="password" label="Password (to switch off)" autoComplete="current-password" error={disable.state.errors?.password} />
          <SubmitButton pending={disable.pending} variant="secondary" pendingLabel="Switching off…">
            Switch off
          </SubmitButton>
        </form>
      </div>
    );
  }

  if (!serverReady) {
    return (
      <p className="rounded-control border border-brand-sky/30 bg-brand-sky/10 px-4 py-3 text-sm">
        To use two-factor sign-in, the server needs a <code>SESSION_SECRET</code> of at least 32 random characters in its <code>.env</code> file.
        Generate one with <code>openssl rand -base64 48</code>, add it, and restart the site.
      </p>
    );
  }

  const secret = start.state.secret;
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Off. Turn it on so that a stolen password alone cannot open the admin portal. You need an authenticator app such as Google Authenticator,
        Microsoft Authenticator or 1Password.
      </p>
      {disable.state.message && <FormMessage message={disable.state.message} isError={false} />}
      {!secret ? (
        <form onSubmit={start.onSubmit}>
          <FormMessage message={start.state.message} isError />
          <SubmitButton pending={start.pending} pendingLabel="Preparing…">
            Set up two-factor sign-in
          </SubmitButton>
        </form>
      ) : (
        <div className="flex flex-col gap-5 rounded-card border border-fg/10 p-5">
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            <li>
              In your authenticator app, choose <strong>Add account</strong> → <strong>Enter a setup key</strong>. Account: <em>Xpert Fintech</em>, type:{" "}
              <em>time-based</em>. Key:
              <code className="tabular mt-2 block rounded-control bg-ink-950 px-3 py-2 text-base tracking-wider select-all">
                {secret.match(/.{1,4}/g)?.join(" ")}
              </code>
              <span className="mt-1 block text-xs text-text-secondary">
                On this phone? <a href={start.state.uri} className="text-brand-sky hover:underline">Open in authenticator app</a>
              </span>
            </li>
            <li>Enter the 6-digit code the app shows:</li>
          </ol>
          <form onSubmit={confirm.onSubmit} className="flex flex-wrap items-end gap-3" noValidate>
            <TextInput
              id="tfa-code"
              name="code"
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              error={confirm.state.errors?.code}
              className="tabular tracking-[0.3em]"
            />
            <SubmitButton pending={confirm.pending} pendingLabel="Checking…">
              Turn on
            </SubmitButton>
          </form>
          <FormMessage message={confirm.state.errors ? undefined : confirm.state.message} isError />
        </div>
      )}
    </div>
  );
}
