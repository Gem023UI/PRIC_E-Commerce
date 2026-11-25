/* Date ranges and chart buckets in Philippine time (Asia/Manila is UTC+8, no daylight saving). */

export const RANGE_KEYS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisYear",
] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export type Granularity = "hour" | "day" | "month";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  thisYear: "This year",
};

export const MONGO_TZ = "Asia/Manila";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const OFFSET = 8 * HOUR;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Manila wall-clock parts of an instant. */
function parts(ms: number) {
  const d = new Date(ms + OFFSET);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours() };
}

const startOfDay = (ms: number) => {
  const p = parts(ms);
  return Date.UTC(p.y, p.m, p.d) - OFFSET;
};
const startOfMonth = (ms: number, delta = 0) => {
  const p = parts(ms);
  return Date.UTC(p.y, p.m + delta, 1) - OFFSET;
};
const startOfYear = (ms: number, delta = 0) => {
  const p = parts(ms);
  return Date.UTC(p.y + delta, 0, 1) - OFFSET;
};

export type DateRange = {
  key: RangeKey;
  label: string;
  granularity: Granularity;
  /** Nominal range: start inclusive, end exclusive. */
  start: Date;
  end: Date;
  /** Like-for-like comparison window (same elapsed length in the previous period). */
  prevStart: Date;
  prevEnd: Date;
};

export function resolveRange(key: RangeKey, now = new Date()): DateRange {
  const t = now.getTime();
  const sod = startOfDay(t);

  const make = (
    start: number,
    end: number,
    prevStart: number,
    prevNominalEnd: number,
    granularity: Granularity = "day",
  ): DateRange => {
    const elapsed = Math.max(0, Math.min(end, t) - start);
    const prevEnd = Math.min(prevNominalEnd, prevStart + elapsed);
    return {
      key,
      label: RANGE_LABELS[key],
      granularity,
      start: new Date(start),
      end: new Date(end),
      prevStart: new Date(prevStart),
      prevEnd: new Date(prevEnd),
    };
  };

  switch (key) {
    case "today":
      return make(sod, sod + DAY, sod - DAY, sod, "hour");
    case "yesterday":
      return make(sod - DAY, sod, sod - 2 * DAY, sod - DAY, "hour");
    case "last7":
      return make(sod - 6 * DAY, sod + DAY, sod - 13 * DAY, sod - 6 * DAY);
    case "last30":
      return make(sod - 29 * DAY, sod + DAY, sod - 59 * DAY, sod - 29 * DAY);
    case "thisMonth":
      return make(startOfMonth(t), startOfMonth(t, 1), startOfMonth(t, -1), startOfMonth(t));
    case "lastMonth":
      return make(startOfMonth(t, -1), startOfMonth(t), startOfMonth(t, -2), startOfMonth(t, -1));
    case "thisYear":
      return make(startOfYear(t), startOfYear(t, 1), startOfYear(t, -1), startOfYear(t), "month");
  }
}

export const describeRange = (r: DateRange) => ({
  key: r.key,
  label: r.label,
  granularity: r.granularity,
  start: r.start.toISOString(),
  end: r.end.toISOString(),
  comparedTo: { start: r.prevStart.toISOString(), end: r.prevEnd.toISOString() },
});

/* ------------------------------- chart buckets ------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

/** The MongoDB $dateToString format that produces the same keys as bucketKey(). */
export const bucketFormat = (g: Granularity) =>
  g === "hour" ? "%Y-%m-%dT%H" : g === "day" ? "%Y-%m-%d" : "%Y-%m";

export type Bucket = { key: string; label: string; start: Date; future: boolean };

function bucketOf(ms: number, g: Granularity, now: number): Bucket {
  const p = parts(ms);
  const day = `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
  const key = g === "hour" ? `${day}T${pad(p.h)}` : g === "day" ? day : `${p.y}-${pad(p.m + 1)}`;
  const label =
    g === "hour"
      ? `${p.h % 12 || 12} ${p.h < 12 ? "AM" : "PM"}`
      : g === "day"
        ? `${MONTHS[p.m]} ${p.d}`
        : (MONTHS[p.m] ?? "");
  return { key, label, start: new Date(ms), future: ms > now };
}

/** Every bucket of the range in order, so charts have no gaps. */
export function buildBuckets(range: DateRange, now = Date.now()): Bucket[] {
  const out: Bucket[] = [];
  const end = range.end.getTime();
  let t = range.start.getTime();
  const g = range.granularity;

  while (t < end) {
    out.push(bucketOf(t, g, now));
    if (g === "hour") t += HOUR;
    else if (g === "day") t += DAY;
    else {
      const p = parts(t);
      t = Date.UTC(p.y, p.m + 1, 1) - OFFSET;
    }
  }
  return out;
}