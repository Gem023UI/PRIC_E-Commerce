/* Date-only strings (YYYY-MM-DD) shown the way people read them. */

const long = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const short = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortNoYear = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

const at = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

export const formatLongDate = (ymd: string) => long.format(at(ymd));
export const formatShortDate = (ymd: string) => short.format(at(ymd));

/** "Dec 1 – Dec 15, 2026", or a single date when both ends are the same day. */
export function formatSpan(start: string, end: string) {
  if (start === end) return formatShortDate(start);
  const sameYear = at(start).getUTCFullYear() === at(end).getUTCFullYear();
  return `${(sameYear ? shortNoYear : short).format(at(start))} – ${short.format(at(end))}`;
}

/** True for a YYYY-MM-DD that falls on a Saturday. */
export const isSaturdayDate = (ymd: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(ymd) && at(ymd).getUTCDay() === 6;