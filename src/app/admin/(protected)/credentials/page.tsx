import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { CredentialsForm } from "@/components/admin/CredentialsForm";
import { CREDENTIALS_KEY, MAX_CREDENTIALS, orgRef, readCredentials } from "@/lib/content/credentials";

export default async function CredentialsPage() {
  await requireAdmin();
  const [row, orgs] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: CREDENTIALS_KEY } }),
    db.organization.findMany({ where: { deletedAt: null }, include: { translations: { where: { locale: "en" } } } }),
  ]);
  const v = readCredentials(row?.value);
  const options = orgs
    .filter((o) => o.translations[0]?.name)
    .map((o) => ({ value: orgRef(o), label: o.translations[0]!.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Credentials</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Memberships and exchange certifications, shown under the client logos on the home page and in the footer of every page. Each one takes its logo,
          name and website link from Admin → Organizations; the logo appears only when its logo permission is ticked there. To add a body that is not listed, add it in
          Admin → Organizations first.
        </p>
      </div>
      <CredentialsForm items={v.items} published={v.published} orgs={options} max={MAX_CREDENTIALS} />
    </div>
  );
}
