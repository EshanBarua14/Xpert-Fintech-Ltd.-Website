"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * After a save on an item's page ("Saved."), a link to that item's earlier
 * versions in Admin → History, where any of them can be put back.
 */
export function UndoHint() {
  const pathname = usePathname();
  const id = pathname.split("/").pop() ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    return (
      <Link href="/admin/history" className="ml-2 font-semibold text-brand-sky hover:underline">
        Undo a change
      </Link>
    );
  }
  return (
    <Link href={`/admin/history?id=${id}`} className="ml-2 font-semibold text-brand-sky hover:underline">
      Undo (earlier versions)
    </Link>
  );
}
