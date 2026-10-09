import { requireAdmin } from "@/lib/auth/session";
import { FiguresForm } from "@/components/admin/FiguresForm";
import { getFigures, MAX_FIGURES } from "@/lib/content/figures";

export default async function FiguresPage() {
  await requireAdmin();
  const figures = await getFigures();
  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Figures</h1>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          Numbers the home page shows as &ldquo;In numbers&rdquo; — for example orders a day, years live, members on the platform. Enter only figures you can
          show the source for; the source and date appear under each one. Leave every row empty to hide the section.
        </p>
      </div>
      <FiguresForm rows={figures.map((f) => ({ ...f, asOf: f.asOf ?? "" }))} max={MAX_FIGURES} />
    </div>
  );
}
