import { Fragment, type CSSProperties } from "react";

/** Splits a title into words, each animated in by CSS (.hero-word in globals.css). Whole words only, so Bengali conjuncts never break. */
export function SplitWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="hero-word" style={{ "--w": i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
