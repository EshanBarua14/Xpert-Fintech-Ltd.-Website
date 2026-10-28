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
  /** "Website" */
  website?: string;
  /** "GitHub not listed yet" */
  githubMissing?: string;
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

/** A globe icon to an organisation's website (or, with kind="portfolio", a person's own site), styled like the email and LinkedIn icons. */
export function WebsiteIcon({
  href,
  name,
  kind = "web",
  label = "Website",
  color = "var(--tone)",
  ink = "var(--tone-ink)",
  size = "size-9",
}: {
  href: string;
  name: string;
  kind?: "web" | "portfolio";
  label?: string;
  color?: string;
  ink?: string;
  size?: string;
}) {
  const external = /^https?:\/\//i.test(href);
  const text = `${label}: ${external ? href.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") : name}`;
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      aria-label={text}
      title={text}
      className={cn("contact-icon flex shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300", size)}
      style={{ "--c": color, "--ci": ink } as CSSProperties}
    >
      <SocialIcon kind={kind} className="size-4" />
    </a>
  );
}

/**
 * A code icon to a person's GitHub (or other code) profile, styled like the
 * other contact icons. With no profile on file it is muted and says so on hover, like a missing email.
 */
export function CodeIcon({
  href,
  name,
  missing = "GitHub not listed yet",
  color = "var(--tone)",
  ink = "var(--tone-ink)",
  size = "size-9",
}: {
  href: string | null;
  name: string;
  missing?: string;
  color?: string;
  ink?: string;
  size?: string;
}) {
  const cls = cn("contact-icon flex shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300", size);
  if (!href)
    return (
      <span role="img" aria-label={missing} title={missing} tabIndex={0} className={cn(cls, "contact-icon-soft cursor-default")} style={{ "--c": color, "--ci": ink } as CSSProperties}>
        <SocialIcon kind="code" className="size-4" />
      </span>
    );
  const host = /github\./i.test(href) ? "GitHub" : /gitlab\./i.test(href) ? "GitLab" : /bitbucket\./i.test(href) ? "Bitbucket" : "Code";
  const text = `${host}: ${name}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={text}
      title={text}
      className={cn("contact-icon flex shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-300", size)}
      style={{ "--c": color, "--ci": ink } as CSSProperties}
    >
      <SocialIcon kind="code" className="size-4" />
    </a>
  );
}
