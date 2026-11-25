/* Date-only strings (YYYY-MM-DD) in Philippine time. */

const OFFSET_MS = 8 * 3_600_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The date of an instant in Philippine time. */
export const manilaToday = (now = new Date()) =>
  new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);

export function isRealDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const isSaturday = (s: string) =>
  isRealDate(s) && new Date(`${s}T00:00:00Z`).getUTCDay() === 6;

export function addDays(s: string, n: number): string {
  const dt = new Date(`${s}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** The next `count` Saturdays strictly after `from`. */
export function nextSaturdays(from: string, count: number): string[] {
  const out: string[] = [];
  let cursor = addDays(from, 1);
  while (out.length < count) {
    if (isSaturday(cursor)) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Midnight (Philippine time) at the start of a date, as an instant. */
export const manilaStart = (s: string) => new Date(`${s}T00:00:00+08:00`);