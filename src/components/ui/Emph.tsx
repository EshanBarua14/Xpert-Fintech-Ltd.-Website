import { Fragment } from "react";

/**
 * Headlines can mark their hook words with asterisks ("Not a roadmap. *Already live.*"):
 * those words are set in the display italic with the brand gradient. Editors use the
 * same asterisks in Admin → Site text.
 */
export function Emph({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <em key={i} className="emph">
            {p}
          </em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** The same text without the asterisks (for page titles, labels and alt text). */
export const plain = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
