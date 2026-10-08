import Image from "next/image";
import { CapabilityVisual, type VisualKind } from "@/components/flagship/Visuals";
import { cn } from "@/lib/utils/cn";
import { ProductMark, productStyle, productVars, type MarkLogo, type ProductLook } from "./ProductMark";

export type DeviceShot = { url: string; alt: string; width: number | null; height: number | null };

/** What a device screen shows: the product's own screenshot, else its illustration under its name bar. */
function Screen({ shot, name, productKey, logo, visual, compact, look }: { shot?: DeviceShot; name: string; productKey: string | null; logo?: MarkLogo | null; visual: VisualKind; compact?: boolean; look?: ProductLook | null }) {
  if (shot) {
    return <Image src={shot.url} alt={shot.alt || name} fill sizes={compact ? "12rem" : "36rem"} className="object-cover object-top" />;
  }
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col bg-[#081426]">
      <div className={cn("flex items-center gap-2 border-b border-white/10 bg-white/[0.04]", compact ? "px-2.5 py-2" : "px-4 py-2.5")}>
        <ProductMark productKey={productKey} logo={logo} look={look} size="sm" className={compact ? "size-6 rounded-lg [&_svg]:size-3.5" : "size-7 rounded-lg [&_svg]:size-4"} />
        <span className={cn("truncate font-semibold text-white/90", compact ? "text-[9px]" : "text-[11px]")}>{name}</span>
        {!compact && (
          <span className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-6 rounded-full bg-white/10" />
            ))}
          </span>
        )}
      </div>
      {compact ? (
        <div className="relative flex flex-1 flex-col gap-2 p-2">
          <div className="rounded-md bg-gradient-to-br from-[var(--p-from)] to-[var(--p-to)] p-2 opacity-90">
            <span className="block h-1.5 w-1/2 rounded-full bg-white/70" />
            <span className="mt-1.5 block h-2.5 w-3/4 rounded-full bg-white/90" />
          </div>
          <div className="relative flex-1">
            <CapabilityVisual kind={visual} />
          </div>
        </div>
      ) : (
        <div className="relative grid flex-1 grid-cols-[18%_1fr] gap-3 p-3">
          <div className="flex flex-col gap-2 rounded-lg bg-white/[0.03] p-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("h-2 rounded-full", i === 0 ? "bg-[var(--p-to)]/80" : "bg-white/10")} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
                  <span className="block h-1.5 w-1/2 rounded-full bg-white/15" />
                  <span className="mt-2 block h-2.5 w-3/4 rounded-full" style={{ background: i === 0 ? "var(--p-to)" : "rgb(255 255 255 / 0.25)" }} />
                </div>
              ))}
            </div>
            <div className="relative flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <CapabilityVisual kind={visual} />
            </div>
          </div>
        </div>
      )}
      {compact && (
        <div className="flex justify-around border-t border-white/10 py-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("size-1.5 rounded-full", i === 0 ? "bg-[var(--p-to)]" : "bg-white/20")} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The product on web, tablet and phone at once, set in perspective: a browser
 * window behind, a tablet and a phone in front, each gently floating. Screens
 * show the product's screenshots (Admin → Products → screenshots: first for
 * web, second for tablet, third for phone) and, until those are added, its
 * illustration under its name. Motion stops for reduced-motion users.
 */
export function DeviceShowcase({
  name,
  productKey,
  logo,
  visual,
  shots = [],
  className,
  size = "lg",
  look,
}: {
  name: string;
  productKey: string | null;
  logo?: MarkLogo | null;
  visual: VisualKind;
  shots?: DeviceShot[];
  className?: string;
  size?: "md" | "lg";
  look?: ProductLook | null;
}) {
  const st = productStyle(productKey, look);
  const web = shots[0];
  const tab = shots[1] ?? shots[0];
  const phone = shots[2] ?? shots[1] ?? shots[0];
  return (
    <div style={productVars(productKey, look)} className={cn("device-stage relative w-full", size === "lg" ? "aspect-[16/12]" : "aspect-[16/11]", className)}>
      {/* Colour glow behind the devices */}
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full opacity-60 blur-3xl"
        style={{ backgroundImage: `radial-gradient(circle at 40% 45%, ${st.to}55, transparent 60%), radial-gradient(circle at 70% 70%, ${st.from}66, transparent 65%)` }}
      />
      <div className="device-scene absolute inset-0">
        {/* Web: a browser window */}
        <div className="device device-web absolute top-[4%] left-[6%] w-[78%]">
          <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b1626] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.85)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#101d31] px-3 py-2">
              <span className="size-2 rounded-full bg-[#ff5f57]" />
              <span className="size-2 rounded-full bg-[#febc2e]" />
              <span className="size-2 rounded-full bg-[#28c840]" />
              <span className="ml-3 h-3.5 flex-1 rounded-md bg-white/[0.06]" />
            </div>
            <div className="relative aspect-[16/10]">
              <Screen shot={web} name={name} productKey={productKey} logo={logo} visual={visual} look={look} />
            </div>
          </div>
        </div>
        {/* Tablet */}
        <div className="device device-tab absolute bottom-[4%] left-0 w-[34%]">
          <div className="rounded-[1.1rem] border border-white/20 bg-[#05080f] p-[5%] shadow-[0_30px_70px_-25px_rgb(0_0_0/0.9)]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[0.6rem]">
              <Screen shot={tab} name={name} productKey={productKey} logo={logo} visual={visual} compact look={look} />
            </div>
          </div>
        </div>
        {/* Phone */}
        <div className="device device-phone absolute right-[2%] bottom-0 w-[20%]">
          <div className="rounded-[1.3rem] border border-white/25 bg-[#05080f] p-[6%] shadow-[0_30px_70px_-20px_rgb(0_0_0/0.95)]">
            <div className="relative aspect-[9/19] overflow-hidden rounded-[0.9rem]">
              <span aria-hidden="true" className="absolute top-1.5 left-1/2 z-10 h-1.5 w-1/3 -translate-x-1/2 rounded-full bg-black/80" />
              <Screen shot={phone} name={name} productKey={productKey} logo={logo} visual={visual} compact look={look} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
