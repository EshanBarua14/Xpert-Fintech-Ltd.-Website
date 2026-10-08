import type { CSSProperties } from "react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils/cn";

export type ContactLabels = {
  /** "Email {name}" */
  email: string;
  linkedin: string;
  /** "Find {name} on LinkedIn" */
  linkedinSearch: string;
  /** "Email not listed yet" */
  emailMissing: string;
};

/**
 * Email or LinkedIn on a person's card, in the card's own colour (--tone on
 * profile cards, --dept on team cards): outlined, filled on hover and focus.
 * Every icon behaves the same: with no LinkedIn on file it searches LinkedIn
 * for the person and their organization; with no email it says so on hover.
 */
export function ContactIcon({
  kind,
  value,
  name,
  org,
  labels,
  color = "var(--tone)",
  ink = "var(--tone-ink)",
  size = "size-9",
}: {
  kind: "email" | "linkedin";
  value: string | null;
  name: string;
  org?: string | null;
  labels: ContactLabels;
  color?: string;
  ink?: string;
  size?: string;
}) {
  const cls = cn(
    "contact-icon flex shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300",
    size,
  );
  const style = { "--c": color, "--ci": ink } as CSSProperties;
  if (kind === "email") {
    if (value)
      return (
        <a href={`mailto:${value}`} aria-label={labels.email.replace("{name}", name)} title={value} className={cls} style={style}>
          <SocialIcon kind="email" className="size-4" />
        </a>
      );
    return (
      <span role="img" aria-label={labels.emailMissing} title={labels.emailMissing} tabIndex={0} className={cn(cls, "contact-icon-soft cursor-default")} style={style}>
        <SocialIcon kind="email" className="size-4" />
      </span>
    );
  }
  const href = value ?? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([name, org].filter(Boolean).join(" "))}`;
  const label = value ? `${labels.linkedin}: ${name}` : labels.linkedinSearch.replace("{name}", name);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={cn(cls, !value && "contact-icon-soft")} style={style}>
      <SocialIcon kind="linkedin" className="size-4" />
    </a>
  );
}
