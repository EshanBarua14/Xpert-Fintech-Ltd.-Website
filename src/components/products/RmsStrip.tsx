import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** One line on RMS, the OMS's built-in risk check, with a link to the checks. */
export function RmsStrip({ body, link, href }: { body: string; link: string; href: string }) {
  return (
    <div data-reveal className="glass flex flex-col gap-3 rounded-2xl border border-brand-sky/20 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-sky/30 bg-brand-sky/10 text-brand-sky">
        <Icon name="shield" className="size-5" />
      </span>
      <p className="flex-1 text-sm leading-relaxed text-text-primary">{body}</p>
      <Link href={href} className="shrink-0 text-sm font-semibold text-brand-sky underline-offset-4 hover:underline">
        {link}
      </Link>
    </div>
  );
}
