"use client";

import { saveContacts, type ContactsState } from "@/app/admin/(protected)/people/contacts/actions";
import { SubmitButton, useActionForm } from "@/components/admin/AdminUi";
import { FormMessage } from "@/components/admin/EditorParts";

export type ContactRow = { id: string; name: string; role: string; email: string; linkedin: string; affiliation: string };

const input = "h-10 w-full rounded-control border bg-fg/[0.03] px-3 text-sm outline-none focus-visible:border-brand-sky";

/** One table to fill in everyone's email, LinkedIn and position at their organisation. */
export function ContactsForm({ rows }: { rows: ContactRow[] }) {
  const { state, pending, onSubmit } = useActionForm<ContactsState>(saveContacts, {});
  const e = state.errors ?? {};
  const field = (key: string, row: ContactRow, value: string, type: string, placeholder: string, label: string) => (
    <td className="px-2 py-2 align-top">
      <input
        name={`${key}.${row.id}`}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        aria-label={`${label}: ${row.name}`}
        aria-invalid={e[`${key}.${row.id}`] ? true : undefined}
        className={input + (e[`${key}.${row.id}`] ? " border-market-down" : " border-fg/15")}
      />
      {e[`${key}.${row.id}`] && <p className="mt-1 text-xs text-market-down">{e[`${key}.${row.id}`]}</p>}
    </td>
  );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} isError={Boolean(state.errors)} />
      <div className="overflow-x-auto rounded-card border border-fg/10">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-fg/10 text-xs text-text-secondary">
            <tr>
              <th className="px-3 py-3 font-medium">Person</th>
              <th className="px-2 py-3 font-medium">Work email</th>
              <th className="px-2 py-3 font-medium">LinkedIn</th>
              <th className="px-2 py-3 font-medium">Position at their organisation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fg/10">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-3 align-top">
                  <input type="hidden" name="id" value={r.id} />
                  <span className="block font-medium">{r.name}</span>
                  <span className="text-xs text-text-secondary">{r.role}</span>
                </td>
                {field("email", r, r.email, "email", "name@xpertfintech.com", "Work email")}
                {field("linkedin", r, r.linkedin, "url", "https://www.linkedin.com/in/…", "LinkedIn")}
                {field("affiliation", r, r.affiliation, "text", "Managing Director, Apex Investments Ltd.", "Position at their organisation")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <SubmitButton pending={pending}>Save contact details</SubmitButton>
      </div>
    </form>
  );
}
