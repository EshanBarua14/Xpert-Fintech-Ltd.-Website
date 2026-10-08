import Image from "next/image";
import type { CSSProperties } from "react";
import type { Credential } from "@/lib/content/credentials";
import { cn } from "@/lib/utils/cn";

function monogram(c: Credential) {
  return (c.shortName ?? c.name.split(/\s+/).map((w) => w[0]).join("")).slice(0, 5).toUpperCase();
}

function Plate({ c, size }: { c: Credential; size: "lg" | "sm" }) {
  const box = size === "lg" ? "h-16 w-24" : "h-11 w-16";
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-black/5", box)}>
      {c.logo ? (
        <Image src={c.logo.url} alt="" width={c.logo.width ?? 160} height={c.logo.height ?? 80} className="h-full w-full object-contain" />
      ) : (
        <span className="font-mono text-xs font-semibold text-[#0b3a66]">{monogram(c)}</span>
      )}
    </span>
  );
}

/**
 * XFL's memberships and exchange certifications (Admin → Credentials): the
 * organization's logo, what XFL holds (e.g. "FIX & ITCH certified") and who
 * granted it, linked to that organization's website.
 * `variant="band"` is the home-page strip; `variant="footer"` the compact row in the footer.
 */
export function CredentialsBand({ items, title, by, variant = "band" }: { items: Credential[]; title: string; /** "by {org}" */ by: string; variant?: "band" | "footer" }) {
  if (!items.length) return null;
  const footer = variant === "footer";
  return (
    <section aria-label={title} className={cn(!footer && "flex flex-col gap-6")}>
      {footer ? <h2 className="sr-only">{title}</h2> : <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>}
      <ul className={cn("grid gap-px overflow-hidden", footer ? "gap-4 sm:grid-cols-3" : "rounded-2xl border border-fg/10 bg-fg/10 md:grid-cols-3")}>
        {items.map((c, i) => {
          const body = (
            <>
              <Plate c={c} size={footer ? "sm" : "lg"} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("font-semibold leading-snug text-text-primary", footer ? "text-sm" : "text-base")}>{c.title}</span>
                <span className={cn("leading-snug text-text-secondary", footer ? "text-xs" : "text-sm")}>
                  {by.replace("{org}", c.name)}
                  {c.websiteUrl && <span aria-hidden="true"> ↗</span>}
                </span>
              </span>
            </>
          );
          const cls = cn("flex h-full items-center gap-4", !footer && "bg-navy-900 p-5 md:p-6", c.websiteUrl && "group transition-colors", c.websiteUrl && !footer && "hover:bg-navy-800");
          return (
            <li key={`${c.name}-${i}`} data-reveal={footer ? undefined : true} style={footer ? undefined : ({ "--d": i } as CSSProperties)}>
              {c.websiteUrl ? (
                <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className={cls}>
                  {body}
                </a>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The hero's one-line version: small logo, what XFL holds, and the body's short name. */
export function CredentialsInline({ items, label }: { items: Credential[]; label: string }) {
  if (!items.length) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-x-5 gap-y-3">
      {items.map((c, i) => {
        const inner = (
          <>
            <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-black/5">
              {c.logo ? (
                <Image src={c.logo.url} alt="" width={c.logo.width ?? 56} height={c.logo.height ?? 56} className="h-full w-full object-contain" />
              ) : (
                <span className="font-mono text-[9px] font-semibold text-[#0b3a66]">{monogram(c)}</span>
              )}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[max(12px,0.8125rem)] font-semibold text-text-primary">{c.title}</span>
              <span className="text-[max(11px,0.75rem)] text-text-secondary">{c.shortName ?? c.name}</span>
            </span>
          </>
        );
        return (
          <li key={`${c.orgKey}-${i}`}>
            {c.websiteUrl ? (
              <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" title={c.name} className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80">
                {inner}
              </a>
            ) : (
              <span className="flex items-center gap-2.5">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
