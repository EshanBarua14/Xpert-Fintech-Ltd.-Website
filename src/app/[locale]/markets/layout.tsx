import type { ReactNode } from "react";

/** The market pages carry the ticker marker, so the header leaves room for the DSE · CSE ticker here (Admin → Design). */
export default function MarketsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <span data-ticker-page hidden />
      {children}
    </>
  );
}
