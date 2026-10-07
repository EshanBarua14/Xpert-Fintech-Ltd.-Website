import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { ContactsForm, type ContactRow } from "@/components/admin/ContactsForm";
import { PERSON_GROUP_LABELS, PERSON_GROUPS } from "@/lib/validation/people";

/** Everyone's email, LinkedIn and outside position in one table: Board first, then Management, then the team. */
export default async function PeopleContactsPage() {
  await requireAdmin();
  const people = await db.person.findMany({
    where: { deletedAt: null, isPlaceholder: false },
    include: { translations: { where: { locale: "en" } }, roles: { include: { translations: { where: { locale: "en" } } } } },
  });
  const rank = (p: (typeof people)[number]) => {
    const g = Math.min(...p.roles.map((r) => PERSON_GROUPS.indexOf(r.group)), 9);
    const order = p.roles.find((r) => PERSON_GROUPS.indexOf(r.group) === g)?.sortOrder ?? 0;
    return g * 10000 + order;
  };
  const rows: ContactRow[] = people
    .filter((p) => p.translations[0]?.name)
    .sort((a, b) => rank(a) - rank(b))
    .map((p) => {
      const role = [...p.roles].sort((a, b) => PERSON_GROUPS.indexOf(a.group) - PERSON_GROUPS.indexOf(b.group))[0];
      return {
        id: p.id,
        name: p.translations[0]!.name,
        role: role ? `${role.translations[0]?.title || "(no title)"} · ${PERSON_GROUP_LABELS[role.group]}` : "",
        email: p.email ?? "",
        linkedin: p.linkedinUrl ?? "",
        affiliation: p.translations[0]?.affiliation ?? "",
      };
    });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/people" className="text-sm text-text-secondary hover:text-brand-sky">
          ← People
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">Contact details</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Fill in everyone at once. Email and LinkedIn show as icons on each card and in the profile; the position at their organisation shows under the title (for
          example, a director&rsquo;s role at their brokerage). Leave a box empty to hide it.
        </p>
      </div>
      <ContactsForm rows={rows} />
    </div>
  );
}
