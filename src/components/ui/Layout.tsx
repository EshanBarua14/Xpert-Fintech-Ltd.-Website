import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Page-width wrapper: 16 px gutters on phones, max 1280 px content. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-8", className)} {...props} />;
}

/** Surface for grouped content. `interactive` adds the controlled hover lift. */
export function Card({
  as: Tag = "div",
  interactive = false,
  className,
  children,
}: {
  as?: ElementType;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-white/10 bg-navy-900/60 p-6",
        interactive &&
          "transition-[border-color,transform] duration-(--duration-slow) ease-(--ease-ui) hover:-translate-y-0.5 hover:border-brand-sky/40",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Eyebrow + heading + intro used at the top of every section. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Heading = "h2",
  align = "left",
  className,
}: {
  eyebrow?: string | null;
  title: string;
  intro?: string | null;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-3", align === "center" && "mx-auto items-center text-center", className)}>
      {eyebrow && <p className="tabular text-xs tracking-[0.2em] text-brand-sky uppercase">{eyebrow}</p>}
      <Heading
        className={cn(
          "font-display font-semibold tracking-tight text-balance",
          Heading === "h1" ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl",
        )}
      >
        {title}
      </Heading>
      {intro && <p className="text-lg text-pretty text-text-secondary">{intro}</p>}
    </div>
  );
}
