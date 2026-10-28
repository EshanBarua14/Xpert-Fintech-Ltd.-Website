"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Sidebar entries, in groups. Only sections that exist are listed — no dead links. */
const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "chart", exact: true },
      { href: "/admin/leads", label: "Leads", icon: "mail" },
      { href: "/admin/applications", label: "Applications", icon: "id" },
      { href: "/admin/market", label: "Market data", icon: "exchange" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: "document" },
      { href: "/admin/products", label: "Products", icon: "bolt" },
      { href: "/admin/ecosystem", label: "Ecosystem", icon: "network" },
      { href: "/admin/news", label: "News", icon: "newspaper" },
      { href: "/admin/events", label: "Events", icon: "calendar" },
      { href: "/admin/albums", label: "Albums (photos and videos)", icon: "image" },
      { href: "/admin/videos", label: "Videos", icon: "video" },
      { href: "/admin/careers", label: "Careers", icon: "briefcase" },
      { href: "/admin/resources", label: "Resources", icon: "book" },
      { href: "/admin/case-studies", label: "Success stories", icon: "award" },
      { href: "/admin/media", label: "Media", icon: "cloud" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/admin/people", label: "People", icon: "users" },
      { href: "/admin/organizations", label: "Organizations", icon: "building" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "check" },
      { href: "/admin/figures", label: "Figures", icon: "chart" },
      { href: "/admin/messages", label: "Messages", icon: "mail" },
      { href: "/admin/credentials", label: "Credentials", icon: "landmark" },
      { href: "/admin/deployments", label: "App deployments", icon: "phone" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/highlights", label: "Home highlights", icon: "award" },
      { href: "/admin/design", label: "Design", icon: "image" },
      { href: "/admin/site-text", label: "Site text", icon: "document" },
      { href: "/admin/navigation", label: "Navigation", icon: "globe" },
      { href: "/admin/redirects", label: "Redirects", icon: "exchange" },
      { href: "/admin/settings", label: "Settings", icon: "building" },
      { href: "/admin/notifications", label: "Email & notifications", icon: "mail" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/users", label: "Users and roles", icon: "lock" },
      { href: "/admin/history", label: "History & undo", icon: "book" },
      { href: "/admin/backups", label: "Backups", icon: "shield" },
      { href: "/admin/audit", label: "Activity log", icon: "check" },
    ],
  },
] as const;

type Inbox = {
  leads: number;
  applications: number;
  latestLead: { id: string; name: string; organization: string | null } | null;
  latestApplication: { id: string; name: string } | null;
};

/**
 * New leads and job applications, live: checks every 20 seconds while the tab is
 * open, refreshes the page's data when something new arrives (lists update by
 * themselves) and shows a short notice with a link to it.
 */
function useInbox() {
  const router = useRouter();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [notice, setNotice] = useState<{ text: string; href: string } | null>(null);
  const last = useRef<{ lead?: string; app?: string } | null>(null);
  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/inbox", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Inbox;
        if (stop) return;
        const seen = last.current;
        const lead = data.latestLead?.id;
        const app = data.latestApplication?.id;
        if (seen && lead && lead !== seen.lead) {
          setNotice({ text: `New lead: ${data.latestLead!.organization || data.latestLead!.name}`, href: `/admin/leads/${lead}` });
          router.refresh();
        } else if (seen && app && app !== seen.app) {
          setNotice({ text: `New job application: ${data.latestApplication!.name}`, href: `/admin/applications/${app}` });
          router.refresh();
        }
        last.current = { lead, app };
        setInbox(data);
        const n = data.leads + data.applications;
        document.title = document.title.replace(/^\(\d+\) /, "");
        if (n) document.title = `(${n}) ${document.title}`;
      } catch {
        /* offline for a moment: try again next time */
      }
    };
    void check();
    const t = setInterval(check, 20_000);
    const onShow = () => void check();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [router]);
  return { inbox, notice, dismiss: () => setNotice(null) };
}

export function AdminNav() {
  const pathname = usePathname();
  const { inbox, notice, dismiss } = useInbox();
  const count = (href: string) => (href === "/admin/leads" ? inbox?.leads : href === "/admin/applications" ? inbox?.applications : undefined) ?? 0;
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
      {notice && (
        <div role="status" className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-card border border-brand-sky/40 bg-ink-950 px-4 py-3 text-sm shadow-lg">
          <Link href={notice.href} onClick={dismiss} className="font-medium text-brand-sky hover:underline">
            {notice.text}
          </Link>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="ml-auto text-text-secondary hover:text-text-primary">
            ×
          </button>
        </div>
      )}
      {NAV_GROUPS.map((g) => (
        <div key={g.title} className="flex flex-col gap-0.5">
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-text-secondary/70 uppercase">{g.title}</p>
          {g.items.map((item) => {
            const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
            const n = count(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "admin-nav-link flex items-center gap-2.5 rounded-control px-3 py-2 text-sm transition-colors",
                  active ? "bg-linear-to-r from-brand-royal/35 to-brand-royal/5 text-text-primary" : "text-text-secondary hover:bg-fg/5 hover:text-text-primary",
                )}
              >
                <Icon name={item.icon} className={cn("size-4 shrink-0", active ? "text-brand-sky" : "")} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {n > 0 && (
                  <span className="rounded-full bg-brand-sky px-2 py-0.5 text-[11px] font-semibold text-ink-950 shadow-[0_0_12px_rgb(34_188_235/0.7)]" aria-label={`${n} new`}>
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

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
