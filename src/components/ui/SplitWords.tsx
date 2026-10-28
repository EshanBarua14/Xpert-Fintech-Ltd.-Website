import { Fragment, type CSSProperties } from "react";

/** Splits a title into words, each animated in by CSS (.hero-word in globals.css). Whole words only, so Bengali conjuncts never break. */
export function SplitWords({ text }: { text: string }) {
  // Words between asterisks are the hook: set in the display italic with the brand gradient.
  let inEm = false;
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const opens = raw.startsWith("*");
      const closes = raw.replace(/[.,!?।]+$/, "").endsWith("*");
      const em = inEm || opens;
      if (opens) inEm = true;
      if (closes) inEm = false;
      return { w: raw.replace(/\*/g, ""), em, opens };
    });
  return (
    <>
      {words.map(({ w, em, opens }, i) => (
        <Fragment key={i}>
          {/* A hook after a full sentence starts on its own line ("…for themselves." / "Proven on every trade."). */}
          {opens && i > 0 && /[.!?।]$/.test(words[i - 1]!.w) && <br />}
          <span className={em ? "hero-word emph" : "hero-word"} style={{ "--w": i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
