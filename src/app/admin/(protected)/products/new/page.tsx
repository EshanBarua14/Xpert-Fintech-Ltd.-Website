import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/ProductForm";
import { newProductValues, parentOptions } from "@/lib/admin/products";
import { imageOptions } from "@/lib/admin/media";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-sm text-text-secondary hover:text-brand-sky">
          ← Products
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">New product</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Save as a draft first; add capabilities, workflow steps and FAQs after saving.
        </p>
      </div>
      <ProductForm values={newProductValues} parentOptions={await parentOptions()} images={await imageOptions()} />
    </div>
  );
}
