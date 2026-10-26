/**
 * Admin → Success stories → Growth journey: the company's milestones on the
 * success stories page, each with its source. A milestone with a number (e.g.
 * brokerage houses on Xpert Fintech) is drawn as a 3D bar; one without, as a marker.
 */
export const JOURNEY_KEY = "stories.journey";
export const MAX_STEPS = 8;

export type JourneyStep = {
  /** "2021", "2026-09" or "2026-09-21" (only as precise as the source). */
  date: string;
  value: number | null;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  source: string;
  sourceUrl: string;
};
export type JourneySetting = { titleEn: string; titleBn: string; introEn: string; introBn: string; metricEn: string; metricBn: string; steps: JourneyStep[] };

export const EMPTY_JOURNEY: JourneySetting = { titleEn: "", titleBn: "", introEn: "", introBn: "", metricEn: "", metricBn: "", steps: [] };

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : "");

export function readJourney(value: unknown): JourneySetting {
  const v = obj(value);
  const steps = (Array.isArray(v.steps) ? v.steps : [])
    .map((x) => obj(x))
    .map((x) => ({
      date: /^\d{4}(-\d{2}(-\d{2})?)?$/.test(str(x.date)) ? str(x.date) : "",
      value: typeof x.value === "number" && Number.isFinite(x.value) ? x.value : null,
      titleEn: str(x.titleEn),
      titleBn: str(x.titleBn),
      bodyEn: str(x.bodyEn),
      bodyBn: str(x.bodyBn),
      source: str(x.source),
      sourceUrl: str(x.sourceUrl),
    }))
    .filter((x) => x.date && x.titleEn)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_STEPS);
  return { titleEn: str(v.titleEn), titleBn: str(v.titleBn), introEn: str(v.introEn), introBn: str(v.introBn), metricEn: str(v.metricEn), metricBn: str(v.metricBn), steps };
}
