import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { PersonForm } from "@/components/admin/PersonForm";
import { imageOptions } from "@/lib/admin/media";
import { emptyPerson } from "@/lib/admin/people";

export default async function NewPersonPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/people" className="text-sm text-text-secondary hover:text-brand-sky">
          ← People
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">New person</h1>
      </div>
      <PersonForm values={emptyPerson} images={await imageOptions()} />
    </div>
  );
}
