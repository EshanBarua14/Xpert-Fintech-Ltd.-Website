"use client";

import { saveNotifications, sendTestEmail, type NotifyState } from "@/app/admin/(protected)/notifications/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { Select, TextArea, TextInput } from "@/components/ui/Field";

export type NotificationValues = {
  host: string;
  port: string;
  security: "starttls" | "tls";
  user: string;
  hasPassword: boolean;
  from: string;
  leadEmails: string;
  careerEmails: string;
  /** Where the mail server in use comes from right now. */
  source: "admin" | "env" | "none";
};

function Message({ state }: { state: NotifyState }) {
  if (!state.message && !state.errors) return null;
  const text = state.message ?? Object.values(state.errors ?? {})[0];
  return (
    <p
      role={state.errors ? "alert" : "status"}
      className={"rounded-control border px-4 py-2 text-sm " + (state.errors ? "border-market-down/40 bg-market-down/10" : "border-market-up/30 bg-market-up/10")}
    >
      {text}
    </p>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 rounded-card border border-fg/10 p-5 md:grid-cols-2">
      <legend className="px-2 text-sm font-semibold">{title}</legend>
      {hint && <p className="text-xs text-text-secondary md:col-span-2">{hint}</p>}
      {children}
    </fieldset>
  );
}

export function NotificationsForm({ values }: { values: NotificationValues }) {
  const save = useActionForm<NotifyState>(saveNotifications, {});
  const test = useActionForm<NotifyState>(sendTestEmail, {});
  const e = save.state.errors ?? {};
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <form onSubmit={save.onSubmit} className="flex flex-col gap-6" noValidate>
        <Message state={save.state} />
        <Group
          title="Who is emailed"
          hint="Email addresses, separated by commas or new lines; as many as you need. Each new message is emailed as soon as it arrives, and it also appears in the admin straight away."
        >
          <TextArea id="leadEmails" label="Demo requests and contact messages" rows={4} defaultValue={values.leadEmails} error={e.leadEmails} placeholder="sales@xpertfintech.com" />
          <TextArea id="careerEmails" label="Job applications" rows={4} defaultValue={values.careerEmails} error={e.careerEmails} hint="Empty: sent to the addresses on the left." placeholder="hr@xpertfintech.com" />
        </Group>

        <Group
          title="Mail server (SMTP)"
          hint={
            values.source === "env"
              ? "Mail is now sent with the server's .env settings. Fill this in to send with these settings instead; leave the server name empty to keep using .env."
              : "The account the emails are sent from, e.g. Microsoft 365 (smtp.office365.com, 587, STARTTLS) or Google Workspace (smtp.gmail.com, 587, STARTTLS, with an app password)."
          }
        >
          <TextInput id="host" label="Server name" placeholder="smtp.office365.com" defaultValue={values.host} error={e.host} />
          <div className="grid grid-cols-2 gap-4">
            <TextInput id="port" type="number" label="Port" defaultValue={values.port || "587"} error={e.port} />
            <Select
              id="security"
              label="Security"
              defaultValue={values.security}
              options={[
                { value: "starttls", label: "STARTTLS (587)" },
                { value: "tls", label: "TLS / SSL (465)" },
              ]}
            />
          </div>
          <TextInput id="user" label="Username" autoComplete="off" placeholder="no-reply@xpertfintech.com" defaultValue={values.user} error={e.user} />
          <div className="flex flex-col gap-2">
            <TextInput
              id="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              hint={values.hasPassword ? "A password is saved (encrypted). Leave empty to keep it." : "Stored encrypted."}
              error={e.password}
            />
            {values.hasPassword && (
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" name="clearPassword" value="1" className="accent-brand-royal" /> Remove the saved password
              </label>
            )}
          </div>
          <TextInput id="from" label="Send as" placeholder="Xpert Fintech <no-reply@xpertfintech.com>" defaultValue={values.from} error={e.from} className="md:col-span-2" />
        </Group>

        <div>
          <SubmitButton pending={save.pending}>Save</SubmitButton>
        </div>
      </form>

      <form onSubmit={test.onSubmit} className="flex flex-col gap-4 rounded-card border border-fg/10 p-5" noValidate>
        <h2 className="text-sm font-semibold">Send a test email</h2>
        <Message state={test.state} />
        <TextInput id="testTo" type="email" label="Send to" hint="Empty: the demo request addresses above (save first)." error={test.state.errors?.testTo} />
        <div>
          <SubmitButton pending={test.pending} pendingLabel="Sending…" variant="secondary">
            Send test email
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
