import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { offeringOptions } from "@/lib/admin/options";
import { LeadDetailsForm } from "@/components/admin/LeadForms";

export default async function NewLeadPage() {
  await requireAdmin();
  const offerings = await offeringOptions();
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <Link href="/admin/leads" className="text-sm text-text-secondary hover:text-brand-sky">
          ← Leads
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">Add lead</h1>
        <p className="mt-1 text-sm text-text-secondary">For enquiries that came by phone, email, at an event or through a referral.</p>
      </div>
      <LeadDetailsForm
        offerings={offerings}
        values={{
          name: "",
          email: "",
          phone: "",
          organization: "",
          designation: "",
          businessType: "",
          interestedOfferingId: "",
          expectedRequirement: "",
          message: "",
          preferredContact: "ANY",
        }}
      />
    </div>
  );
}
