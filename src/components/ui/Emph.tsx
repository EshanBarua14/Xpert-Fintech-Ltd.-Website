import { Fragment } from "react";

/**
 * Headlines can mark their hook words with asterisks ("Not a roadmap. *Already live.*"):
 * those words are set in the display italic with the brand gradient. Editors use the
 * same asterisks in Admin → Site text. A hook that follows a full sentence starts on a new line.
 */
export function Emph({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => {
        // A hook after a full sentence starts on its own line ("Not a roadmap." / "Already live.").
        const afterSentence = (k: number) => k > 0 && /[.!?।]\s*$/.test(parts[k - 1]!) && parts[k - 1]!.trim() !== "";
        return i % 2 ? (
          <Fragment key={i}>
            {afterSentence(i) && <br />}
            <em className="emph">{p}</em>
          </Fragment>
        ) : (
          <Fragment key={i}>{i + 1 < parts.length && afterSentence(i + 1) ? p.replace(/\s+$/, "") : p}</Fragment>
        );
      })}
    </>
  );
}

/** The same text without the asterisks (for page titles, labels and alt text). */
export const plain = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
