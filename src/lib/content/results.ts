/**
 * Key results of a success story (Admin → Success stories → Key results):
 * up to four figures, each with an English and a Bangla label. Typed in the
 * admin one per line as "value | English label | বাংলা label".
 */
export type StoryResult = { value: string; labelEn: string; labelBn: string };
export const MAX_RESULTS = 4;

export function readResults(v: unknown): StoryResult[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((o) => ({ value: String(o.value ?? "").trim(), labelEn: String(o.labelEn ?? "").trim(), labelBn: String(o.labelBn ?? "").trim() }))
    .filter((r) => r.value && r.labelEn)
    .slice(0, MAX_RESULTS);
}

/** "value | English | বাংলা" lines to results; lines missing a value or English label are reported. */
export function parseResultsText(text: string): { results: StoryResult[]; error?: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: StoryResult[] = [];
  for (const line of lines) {
    const [value = "", labelEn = "", labelBn = ""] = line.split("|").map((x) => x.trim());
    if (!value || !labelEn) return { results, error: `Each line needs a value and an English label: "${line.slice(0, 40)}"` };
    if (value.length > 24 || labelEn.length > 80 || labelBn.length > 80) return { results, error: "Keep values under 24 and labels under 80 characters." };
    results.push({ value, labelEn, labelBn });
  }
  if (results.length > MAX_RESULTS) return { results, error: `At most ${MAX_RESULTS} results.` };
  return { results };
}

export const resultsToText = (rs: StoryResult[]) => rs.map((r) => [r.value, r.labelEn, r.labelBn].filter((x, i) => x || i < 2).join(" | ")).join("\n");
