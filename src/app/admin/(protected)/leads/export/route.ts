import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { getCurrentAdmin } from "@/lib/auth/session";
import { csvCell, LEAD_SOURCES, LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/validation/lead";

export const dynamic = "force-dynamic";

/** Leads as a CSV file (opens in Excel), using the same filters as the list. */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Not signed in", { status: 401 });

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "";
  const sourceParam = url.searchParams.get("source") ?? "";
  const status = (LEAD_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as (typeof LEAD_STATUSES)[number]) : undefined;
  const source = (LEAD_SOURCES as readonly string[]).includes(sourceParam) ? (sourceParam as (typeof LEAD_SOURCES)[number]) : undefined;
  const q = url.searchParams.get("q")?.trim().slice(0, 100) ?? "";

  const where: Prisma.LeadWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { organization: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  };

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: {
      owner: { select: { name: true } },
      interestedOffering: { select: { translations: { where: { locale: "en" }, select: { name: true } } } },
    },
  });

  const header = [
    "Received",
    "Name",
    "Email",
    "Phone",
    "Organization",
    "Designation",
    "Type of organization",
    "Product",
    "Requirement",
    "Message",
    "Preferred contact",
    "Source",
    "Status",
    "Owner",
    "Follow up",
    "Language",
    "Page",
  ];
  const rows = leads.map((l) =>
    [
      l.createdAt,
      l.name,
      l.email,
      l.phone,
      l.organization,
      l.designation,
      l.businessType,
      l.interestedOffering?.translations[0]?.name,
      l.expectedRequirement,
      l.message,
      l.preferredContact,
      SOURCE_LABELS[l.source],
      STATUS_LABELS[l.status],
      l.owner?.name,
      l.followUpAt,
      l.locale,
      l.pageUrl,
    ]
      .map(csvCell)
      .join(","),
  );

  // Byte-order mark so Excel reads Bangla text correctly.
  const body = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="xpert-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
