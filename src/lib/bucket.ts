export type Granularity = "daily" | "weekly" | "monthly";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dailyKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function weeklyKey(d: Date): string {
  const dow = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday));
  return dailyKey(monday);
}

export function monthlyKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

export function bucketKey(ts: number, granularity: Granularity): string {
  const d = new Date(ts);
  if (granularity === "daily") return dailyKey(d);
  if (granularity === "monthly") return monthlyKey(d);
  return weeklyKey(d);
}

/** "2026-03" -> "Mar 2026"; "2026-03-09" -> "Mar 9". */
export function formatBucketLabel(key: string): string {
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-");
    return `${MONTH_ABBR[Number(m) - 1]} ${y}`;
  }
  const d = new Date(`${key}T00:00:00Z`);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function formatHourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:00 ${period}`;
}

export function formatHourRange(h: number): string {
  return `${formatHourLabel(h)}–${formatHourLabel((h + 1) % 24)}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * PH calendar-day index for a cols timestamp. cols timestamps are UTC-stamped
 * PH wall-clock (see loadData.ts), so integer division by a day is exactly
 * equivalent to comparing getUTCFullYear/Month/Date -- but with no Date
 * allocation, which matters when this runs over tens of thousands of rows.
 */
export function phDayIndex(ts: number): number {
  return Math.floor(ts / MS_PER_DAY);
}

/** Exclusive end (ms) of the bucket a key names, e.g. "2026-03" -> 2026-04-01T00:00Z. */
function bucketEndMs(key: string, granularity: Granularity): number {
  if (granularity === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1);
  }
  const startMs = Date.parse(`${key}T00:00:00Z`);
  const spanDays = granularity === "weekly" ? 7 : 1;
  return startMs + spanDays * MS_PER_DAY;
}

/**
 * Dense, gap-free bucket key sequence covering [startMs, endMs]. Building a
 * series from this rather than from whichever keys the filtered rows happen
 * to produce is what keeps a filtered forecast comparable: a filter that
 * empties one month must not silently shorten the series.
 */
export function bucketRange(startMs: number, endMs: number, granularity: Granularity): string[] {
  const keys: string[] = [];
  let cursor = bucketKey(startMs, granularity);
  let cursorMs = startMs;
  // Guard against an unbounded loop if start/end are ever passed reversed.
  let iterations = 0;
  while (cursorMs <= endMs && iterations < 100_000) {
    keys.push(cursor);
    cursorMs = bucketEndMs(cursor, granularity);
    cursor = bucketKey(cursorMs, granularity);
    iterations++;
  }
  return keys;
}
