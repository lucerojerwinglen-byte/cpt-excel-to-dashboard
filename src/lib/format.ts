export function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

/** Compact integer for tight spaces: 4315 -> "4.3k". */
export function fmtCompactNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

export function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  const abs = Math.abs(ms);
  const mins = abs / 60_000;
  const hours = mins / 60;
  const days = hours / 24;
  if (days >= 1) {
    const d = Math.floor(days);
    const h = Math.round((days - d) * 24);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, Math.round(mins))}m`;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "04 Aug 2026". */
export function fmtDateShort(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getUTCDate())} ${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "04 Aug 2026, 06:29" -- 24-hour clock, PH wall-clock time (cols timestamps
 * are UTC-stamped PH time, see loadData.ts). */
export function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  return `${fmtDateShort(ms)}, ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

export function fmtWeekLabel(ms: number): string {
  const d = new Date(ms);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
