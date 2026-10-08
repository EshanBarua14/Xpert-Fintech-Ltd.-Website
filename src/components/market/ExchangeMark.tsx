import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type ExchangeLogo = { url: string; width: number | null; height: number | null };
/** DSE and CSE logos, when uploaded with permission in Admin → Organizations (keys dse, cse). */
export type ExchangeLogos = Partial<Record<"DSE" | "CSE", ExchangeLogo>>;

/** An exchange's logo on a small white plate (logos are drawn for light backgrounds); nothing without one. */
export function ExchangeMark({ logo, className }: { logo?: ExchangeLogo; className?: string }) {
  if (!logo) return null;
  return (
    <span aria-hidden="true" className={cn("inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-black/5", className)}>
      <Image src={logo.url} alt="" width={logo.width ?? 64} height={logo.height ?? 64} className="size-full object-contain" />
    </span>
  );
}

/** The exchange logos from the institution logos (keys dse, cse). */
export function exchangeLogos(parties: Partial<Record<string, ExchangeLogo>> | undefined): ExchangeLogos {
  return { DSE: parties?.dse, CSE: parties?.cse };
}
