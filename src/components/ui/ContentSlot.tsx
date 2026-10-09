import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type SlotKind = "feature" | "screen" | "caseStudy" | "review" | "figure" | "phone";

const TEXT: Record<SlotKind, { en: [string, string]; bn: [string, string] }> = {
  feature: { en: ["Key feature", "Add a feature with a short line on what it does."], bn: ["মূল বৈশিষ্ট্য", "বৈশিষ্ট্য ও এক লাইনে এর কাজ যোগ করুন।"] },
  screen: { en: ["Screenshot", "Upload a web, tablet or phone screen of the live product."], bn: ["স্ক্রিনশট", "চালু পণ্যের ওয়েব, ট্যাবলেট বা ফোনের স্ক্রিন আপলোড করুন।"] },
  phone: { en: ["Phone screenshot", "A tall screen of the mobile app."], bn: ["ফোনের স্ক্রিনশট", "মোবাইল অ্যাপের লম্বা স্ক্রিন।"] },
  caseStudy: { en: ["Case study", "Client name, the challenge, what changed and one real figure, with the client's approval."], bn: ["কেস স্টাডি", "গ্রাহকের নাম, চ্যালেঞ্জ, কী বদলেছে ও একটি প্রকৃত সংখ্যা — গ্রাহকের অনুমোদনসহ।"] },
  review: { en: ["Client review", "A quote from a member chief, with their approval and rating."], bn: ["গ্রাহকের মতামত", "সদস্য প্রতিষ্ঠানের প্রধানের উক্তি, অনুমোদন ও রেটিংসহ।"] },
  figure: { en: ["Figure", "A number you can show the source for, e.g. daily orders."], bn: ["সংখ্যা", "যে সংখ্যার উৎস দেখানো যায়, যেমন দৈনিক অর্ডার।"] },
};

/**
 * Where content still to come will go: a dashed frame with what belongs there
 * and a link to the admin page that adds it. Only rendered outside the live
 * site (see contentSlots()); the live site shows nothing in its place.
 */
export function ContentSlot({
  kind,
  locale,
  adminHref,
  title,
  className,
  aspect,
}: {
  kind: SlotKind;
  locale: "en" | "bn";
  adminHref: string;
  /** Overrides the default heading, e.g. "Daily orders". */
  title?: string;
  className?: string;
  /** e.g. "aspect-[16/10]" for a screenshot tile. */
  aspect?: string;
}) {
  const [head, hint] = TEXT[kind][locale];
  return (
    <Link
      href={adminHref}
      className={cn(
        "content-slot group flex h-full min-h-32 flex-col justify-center gap-1.5 rounded-2xl border border-dashed border-gold/50 bg-gold/[0.04] p-5 text-left transition-colors hover:border-gold hover:bg-gold/[0.08]",
        aspect,
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-gold">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.8]">
          <path d="M8 3v10M3 8h10" />
        </svg>
        {title ?? head}
      </span>
      <span className="text-sm leading-snug text-text-secondary">{hint}</span>
      <span className="mt-1 text-xs font-medium text-text-secondary/80">{locale === "bn" ? "শুধু লাইভ সাইটের বাইরে দেখা যায়" : "Only visible outside the live site"}</span>
    </Link>
  );
}
