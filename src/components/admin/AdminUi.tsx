"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

/** Sidebar entries. Only sections that exist are listed — no dead links. */
const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/market", label: "Market data" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/ecosystem", label: "Ecosystem" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/albums", label: "Photo albums" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/careers", label: "Careers" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/case-studies", label: "Case studies" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/deployments", label: "App deployments" },
  { href: "/admin/navigation", label: "Navigation" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Admins" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-control px-3 py-2 text-sm transition-colors",
              active ? "bg-brand-royal/25 text-text-primary" : "text-text-secondary hover:bg-fg/5 hover:text-text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Submit button that disables itself while the server action runs.
 * Pass `pending` when the form submits through `useActionForm` (which does
 * not use the form's action attribute, so useFormStatus cannot see it).
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  name,
  value,
  pending: pendingProp,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  name?: string;
  value?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={buttonClasses({ variant })}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Asks for confirmation before submitting a destructive form. */
export function ConfirmButton({ children, message, className }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? buttonClasses({ variant: "ghost", className: "text-market-down hover:bg-market-down/10" })}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function StatusBadge({
  status,
  publishAt,
  deletedAt,
}: {
  status: "DRAFT" | "PUBLISHED";
  publishAt?: Date | string | null;
  deletedAt?: Date | string | null;
}) {
  if (deletedAt) return <Badge tone="down">In trash</Badge>;
  if (status === "DRAFT") return <Badge>Draft</Badge>;
  if (publishAt && new Date(publishAt) > new Date()) return <Badge tone="brand">Scheduled</Badge>;
  return <Badge tone="up">Published</Badge>;
}

export { useActionForm } from "@/components/forms/useActionForm";
