/**
 * Trading sessions of DSE and CSE, worked out from the clock in Dhaka.
 * Shared by the server and the browser, so the status on the page changes the
 * moment a session starts or ends, between price refreshes.
 *
 * Times are set in Admin → Market data → Trading hours (the exchanges change
 * them from time to time, e.g. in Ramadan), with exchange holidays as dates.
 * When the exchange's own page reports a halt or a closure during trading
 * hours, that wins over the clock.
 */

export type SessionPhase = "PRE_OPEN" | "OPEN" | "POST_CLOSE" | "CLOSED" | "HALTED";

export type SessionSchedule = {
  /** Trading days, 0 = Sunday … 6 = Saturday (DSE and CSE: Sunday to Thursday). */
  days: number[];
  /** "HH:MM" in Dhaka time. */
  preOpen: string;
  open: string;
  close: string;
  postClose: string;
  /** Exchange holidays, YYYY-MM-DD. */
  holidays: string[];
};

export type Sessions = { DSE: SessionSchedule; CSE: SessionSchedule };

/** Defaults until set in the admin: pre-opening 9:45, trading 10:00–14:20, post-closing to 14:30. */
export const DEFAULT_SCHEDULE: SessionSchedule = { days: [0, 1, 2, 3, 4], preOpen: "09:45", open: "10:00", close: "14:20", postClose: "14:30", holidays: [] };
export const DEFAULT_SESSIONS: Sessions = { DSE: DEFAULT_SCHEDULE, CSE: DEFAULT_SCHEDULE };

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const minutes = (t: string) => {
  const m = HHMM.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

/** A schedule from stored settings, falling back to the defaults for anything missing or invalid. */
export function readSchedule(v: unknown): SessionSchedule {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const time = (k: keyof SessionSchedule) => (typeof o[k] === "string" && HHMM.test(o[k] as string) ? (o[k] as string) : (DEFAULT_SCHEDULE[k] as string));
  const days = Array.isArray(o.days) ? o.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : DEFAULT_SCHEDULE.days;
  const holidays = Array.isArray(o.holidays) ? o.holidays.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
  return { days: days.length ? days : DEFAULT_SCHEDULE.days, preOpen: time("preOpen"), open: time("open"), close: time("close"), postClose: time("postClose"), holidays };
}

/** Dhaka (UTC+6, no daylight saving) date and minute of day. */
export function dhakaClock(at: Date = new Date()) {
  const d = new Date(at.getTime() + 6 * 3600 * 1000);
  return { date: d.toISOString().slice(0, 10), day: d.getUTCDay(), minute: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** True on a trading day (not a weekend or holiday). */
export function isTradingDay(s: SessionSchedule, at: Date = new Date()) {
  const c = dhakaClock(at);
  return s.days.includes(c.day) && !s.holidays.includes(c.date);
}

/**
 * The session now. `reported` is what the exchange's own page says, when it
 * says anything: a halt, or a closure during trading hours (an unscheduled
 * holiday), overrides the clock.
 */
export function phaseAt(s: SessionSchedule, at: Date = new Date(), reported?: SessionPhase): SessionPhase {
  if (!isTradingDay(s, at)) return "CLOSED";
  const m = dhakaClock(at).minute;
  let phase: SessionPhase = "CLOSED";
  if (m >= minutes(s.preOpen) && m < minutes(s.open)) phase = "PRE_OPEN";
  else if (m >= minutes(s.open) && m < minutes(s.close)) phase = "OPEN";
  else if (m >= minutes(s.close) && m < minutes(s.postClose)) phase = "POST_CLOSE";
  if (phase === "OPEN" && reported === "HALTED") return "HALTED";
  if (phase !== "CLOSED" && reported === "CLOSED" && m >= minutes(s.open) + 15 && m < minutes(s.close)) return "CLOSED";
  return phase;
}

/** True once today's trading has started, so the exchange's totals belong to today. */
export function tradedToday(s: SessionSchedule, at: Date = new Date()) {
  return isTradingDay(s, at) && dhakaClock(at).minute >= minutes(s.open);
}
