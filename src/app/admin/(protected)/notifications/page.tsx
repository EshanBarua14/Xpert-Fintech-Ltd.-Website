import { NotificationsForm } from "@/components/admin/NotificationsForm";
import { db } from "@/lib/db/client";
import { ALERT_KEYS, getMailConfig, storedMail } from "@/lib/mail/config";

export const metadata = { title: "Email & notifications" };

const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").join("\n") : "");

/** Admin → Email & notifications: who is emailed about leads and applications, and the mail server used. */
export default async function NotificationsPage() {
  const [mail, cfg, rows] = await Promise.all([
    storedMail(),
    getMailConfig(),
    db.siteSetting.findMany({ where: { key: { in: Object.values(ALERT_KEYS) } } }),
  ]);
  const get = (key: string) => rows.find((r) => r.key === key)?.value;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Email &amp; notifications</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          New demo requests, contact messages and job applications are emailed to the addresses below the moment they arrive, and show up in Leads and
          Applications without reloading.{" "}
          {cfg ? (
            <span className="text-market-up">Sending with {cfg.host} ({cfg.source === "admin" ? "set here" : "from the server's .env"}).</span>
          ) : (
            <span className="text-market-down">No mail server is set yet: emails are not being sent.</span>
          )}
        </p>
      </div>
      <NotificationsForm
        values={{
          host: mail?.host ?? "",
          port: mail ? String(mail.port) : "587",
          security: mail?.security ?? "starttls",
          user: mail?.user ?? "",
          hasPassword: Boolean(mail?.passwordEnc),
          from: mail?.from ?? "",
          leadEmails: list(get(ALERT_KEYS.leads)),
          careerEmails: list(get(ALERT_KEYS.careers)),
          source: cfg?.source ?? "none",
        }}
      />
    </div>
  );
}
