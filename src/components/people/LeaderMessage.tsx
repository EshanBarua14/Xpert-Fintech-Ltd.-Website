import { focusStyle } from "@/lib/media/focal";
import Image from "next/image";
import type { LeaderMessage as Message } from "@/lib/content/leaders";
import { cn } from "@/lib/utils/cn";
import { ContactIcon, type ContactLabels } from "./ContactIcon";

function initials(name: string | null) {
  return (name ?? "")
    .replace(/^(md|mohd|mohammad|muhammad)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * The Chairman's or Managing Director's message, set as a signed letter:
 * portrait and signature on one side, the text on the other with the opening
 * paragraph as a larger lead. Text and signatory come from Admin → Messages
 * and Admin → People.
 */
export function LeaderMessage({ message, heading, compact = false, contact }: { message: Message; heading: string; compact?: boolean; contact?: ContactLabels }) {
  const [lead, ...rest] = message.paragraphs;
  const id = `leader-${message.key}`;
  return (
    <article aria-labelledby={id} className="grid gap-10 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-14 lg:gap-20">
      <figure data-reveal className="flex flex-row items-center gap-5 md:flex-col md:items-stretch md:gap-5">
        <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-2xl bg-navy-800 md:w-full">
          {message.photo ? (
            <Image src={message.photo.url} alt={message.name ?? ""} fill sizes="(min-width: 768px) 15rem, 7rem" quality={90} className="object-cover" style={focusStyle(message.photo, 0.8)} />
          ) : (
            <span aria-hidden="true" className="flex h-full items-center justify-center bg-brand-royal font-display text-4xl text-white">
              {initials(message.name)}
            </span>
          )}
        </div>
        {message.name && (
          <figcaption className="flex flex-col gap-1">
            <span className="font-display text-xl leading-tight text-text-primary">{message.name}</span>
            {message.title && <span className="text-sm text-text-secondary">{message.title}</span>}
            {contact && (
              <span className="mt-3 flex items-center gap-2">
                <ContactIcon kind="linkedin" value={message.linkedin} name={message.name} org="Xpert Fintech" labels={contact} color="var(--color-gold)" ink="var(--color-gold)" size="size-9" />
                <ContactIcon kind="email" value={message.email} name={message.name} labels={contact} color="var(--color-gold)" ink="var(--color-gold)" size="size-9" />
              </span>
            )}
          </figcaption>
        )}
      </figure>

      <div className="flex min-w-0 flex-col gap-6">
        {message.draft && (
          <p className="self-start rounded-md border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
            Draft preview: not on the live site until it is approved and published in Admin → Messages.
          </p>
        )}
        <h2 id={id} data-reveal className="font-display text-3xl leading-tight tracking-[-0.015em] text-balance md:text-4xl">
          {heading}
        </h2>
        {lead && (
          <p data-reveal className={cn("max-w-[38em] border-l-2 border-gold/70 pl-6 font-display leading-snug text-text-primary", compact ? "text-xl" : "text-xl md:text-2xl")}>
            {lead}
          </p>
        )}
        {rest.map((p, i) => (
          <p key={i} data-reveal className="max-w-[36em] pl-[calc(1.5rem+2px)] text-base leading-[1.75] text-text-secondary md:text-[1.0625rem]">
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
