import Image from "next/image";
import Link from "next/link";
import type { OrganizationKind, PersonGroup } from "@prisma/client";
import { ProductCard } from "@/components/products/ProductCard";
import { getEvents, getOfferings, getOrganizations, getPeople, mediaMap } from "@/lib/public/content";
import { formatEventDate, pick } from "@/lib/public/text";
import { cn } from "@/lib/utils/cn";
import { BlockHeading, CARD, gridCols, revealDelay } from "./Shared";
import { num, str, type BlockContext, type BlockData } from "./types";

export async function ProductGridBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const offerings = await getOfferings({ featuredOnly: str(block.props.source) === "featured", limit: num(block.props.limit, 8) });
  if (!offerings.length) return null;
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <ul className={cn("grid gap-4", gridCols[str(block.props.columns, "3")])}>
        {offerings.map((o, i) => (
          <li key={o.id} data-reveal style={revealDelay(i)}>
            <ProductCard offering={o} locale={ctx.locale} t={ctx.t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function LogoCloudBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const kind = (str(block.props.kind, "CONSORTIUM_MEMBER") as OrganizationKind) ?? "CONSORTIUM_MEMBER";
  const orgs = await getOrganizations(kind);
  if (!orgs.length) return null;
  // Logos appear only when written permission is recorded; otherwise the name is shown.
  const logos = await mediaMap(orgs.filter((o) => o.logoPermission).map((o) => o.logoMediaId), ctx.locale);
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {orgs.map((o, i) => {
          const name = pick(o.translations, ctx.locale)?.name ?? "";
          const logo = o.logoPermission ? logos.get(o.logoMediaId ?? "") : undefined;
          return (
            <li key={o.id} data-reveal style={revealDelay(i, 4)} className="spotlight glass flex min-h-28 items-center justify-center rounded-2xl p-5 text-center">
              {logo ? (
                <Image src={logo.url} alt={name} width={logo.width ?? 240} height={logo.height ?? 96} className="h-12 w-auto object-contain" />
              ) : (
                <span className="text-sm font-medium text-text-primary">{name}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function PeopleListBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const group = str(block.props.group, "MANAGEMENT") as PersonGroup;
  const people = await getPeople(group);
  if (!people.length) return null;
  const photos = await mediaMap(people.map((p) => p.photoMediaId), ctx.locale);
  return (
    <div className="flex flex-col gap-12">
      <BlockHeading text={block.text} />
      <PeopleGrid people={people} photos={photos} locale={ctx.locale} />
    </div>
  );
}

type PersonRow = Awaited<ReturnType<typeof getPeople>>[number];

export function PeopleGrid({
  people,
  photos,
  locale,
}: {
  people: PersonRow[];
  photos: Awaited<ReturnType<typeof mediaMap>>;
  locale: BlockContext["locale"];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p, i) => {
        const name = pick(p.translations, locale)?.name ?? "";
        const bio = pick(p.translations, locale)?.bio;
        const title = pick(p.roles[0]?.translations ?? [], locale)?.title;
        const photo = photos.get(p.photoMediaId ?? "");
        return (
          <li key={p.id} data-reveal style={revealDelay(i)} className={cn(CARD, "flex flex-col gap-4")}>
            {photo && (
              <Image src={photo.url} alt={name} width={photo.width ?? 400} height={photo.height ?? 400} className="aspect-square w-24 rounded-2xl object-cover ring-1 ring-fg/15" />
            )}
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">{name}</h3>
              {title && <p className="mt-1 text-sm text-cyan-300">{title}</p>}
            </div>
            {bio && <p className="text-sm whitespace-pre-line text-text-secondary">{bio}</p>}
            {p.linkedinUrl && (
              <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-auto text-sm text-text-secondary hover:text-brand-sky">
                LinkedIn ↗
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export async function EventListBlock({ block, ctx }: { block: BlockData; ctx: BlockContext }) {
  const events = await getEvents(num(block.props.limit, 3));
  if (!events.length) return null;
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BlockHeading text={block.text} />
        <Link href={`/${ctx.locale}/events`} className="text-sm font-semibold text-brand-sky hover:text-fg">
          {ctx.t.allEvents}
        </Link>
      </div>
      <EventCards events={events} locale={ctx.locale} />
    </div>
  );
}

type EventRow = Awaited<ReturnType<typeof getEvents>>[number];

export function EventCards({ events, locale }: { events: EventRow[]; locale: BlockContext["locale"] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((e, i) => {
        const tr = pick(e.translations, locale);
        const own = e.translations.find((x) => x.locale === locale);
        if (!tr) return null;
        const date = formatEventDate(e.startsAt, e.dateIsApprox, locale);
        return (
          <li key={e.id} data-reveal style={revealDelay(i)}>
            <Link
              href={`/${own ? locale : "en"}/events/${(own ?? tr).slug}`}
              className={cn(CARD, "group flex h-full min-h-56 flex-col gap-3 transition-transform duration-500 hover:-translate-y-1")}
            >
              {date && <time className="font-mono text-xs text-cyan-300">{date}</time>}
              <h3 className="font-display text-xl font-semibold tracking-tight text-balance">{tr.title}</h3>
              {tr.summary && <p className="line-clamp-3 text-sm text-text-secondary">{tr.summary}</p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
