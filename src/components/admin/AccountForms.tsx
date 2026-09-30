"use client";

import { useEffect, useState } from "react";
import {
  changeOwnPassword,
  createAdmin,
  resetAdminPassword,
  setAdminActive,
  type AccountState,
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

export type AdminRow = { id: string; name: string; email: string; isActive: boolean; isSelf: boolean; lastLogin: string; locked: boolean };

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
    <ul className="divide-y divide-white/10 rounded-card border border-white/10">
      {rows.map((u) => (
        <li key={u.id} className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium">{u.name}</span>
            <span className="text-sm text-text-secondary">{u.email}</span>
            {u.isSelf && <Badge tone="brand">You</Badge>}
            {!u.isActive && <Badge tone="down">Deactivated</Badge>}
            {u.locked && <Badge>Locked for a few minutes</Badge>}
            <span className="ml-auto text-xs text-text-secondary">Last sign-in: {u.lastLogin}</span>
          </div>
          {!u.isSelf && (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <ResetPassword id={u.id} />
              <form action={setAdminActive}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value={u.isActive ? "false" : "true"} />
                {u.isActive ? (
                  <ConfirmButton message={`Deactivate ${u.email}? They are signed out immediately.`}>Deactivate</ConfirmButton>
                ) : (
                  <button type="submit" className="rounded-control border border-white/15 px-3 py-2 text-sm hover:border-brand-sky">
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
