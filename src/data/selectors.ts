import { CHECKER_START_TS, CHECKER_TEAM, CHECKER_TENURE_APPROX, DASHBOARD_DATA, MIN_COMPLETED_FOR_RANKING, PARTIAL_MONTHS, REPORT_NOW_MS, ROW_COUNT, STATUS, onlyCompleted } from "./loadData";
import type { FilterState } from "../state/FilterContext";
import { bucketKey, type Granularity } from "../lib/bucket";
import { statsOf, type RangeStats } from "../lib/stats";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function matchesFiltersExceptTeam(i: number, filters: FilterState): boolean {
  const { departments, categories, statuses, cptMembers, sites, countries, cols } = DASHBOARD_DATA;

  if (filters.dept.size > 0 && !filters.dept.has(departments[cols.dept[i]])) return false;
  if (filters.cat.size > 0 && !filters.cat.has(categories[cols.cat[i]])) return false;
  if (filters.status.size > 0 && !filters.status.has(statuses[cols.status[i]])) return false;
  if (filters.cpt.size > 0 && !filters.cpt.has(cptMembers[cols.cpt[i]])) return false;
  if (filters.site.size > 0 && !filters.site.has(sites[cols.site[i]])) return false;
  if (filters.country.size > 0 && !filters.country.has(countries[cols.country[i]])) return false;

  const ts = cols.reqTs[i];
  const { start, end } = filters.dateRange;
  if (start !== null && ts < start) return false;
  if (end !== null && ts > end) return false;

  return true;
}

function matchesFilters(i: number, filters: FilterState): boolean {
  const { cptTeam, cols } = DASHBOARD_DATA;
  if (filters.team.size > 0 && !filters.team.has(cptTeam[cols.cpt[i]])) return false;
  return matchesFiltersExceptTeam(i, filters);
}

/** Row indices matching the current filter selection, across the whole dataset. */
export function getFilteredIndices(filters: FilterState): number[] {
  const out: number[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    if (matchesFilters(i, filters)) out.push(i);
  }
  return out;
}

export type LocalTeam = "Philippines" | "India";

/** Row indices matching every active sidebar filter EXCEPT Team, further
 * restricted to one explicit team -- used by charts with their own local
 * PH/IND toggle (timing heatmaps, day-of-week) so the chart's own toggle
 * fully owns team scope instead of being silently constrained (or emptied
 * out) by whatever the sidebar's global Team filter happens to be set to. */
export function getFilteredIndicesForTeam(filters: FilterState, team: LocalTeam): number[] {
  const { cptTeam, cols } = DASHBOARD_DATA;
  const out: number[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    if (cptTeam[cols.cpt[i]] !== team) continue;
    if (matchesFiltersExceptTeam(i, filters)) out.push(i);
  }
  return out;
}

/** Same "local toggle owns team scope" contract as getFilteredIndicesForTeam,
 * for a chart's own toggle's "Both" state -- every row regardless of team
 * (including Unrecognized-team members), still ignoring the sidebar's global
 * Team filter so switching the chart's toggle to "Both" reliably shows
 * everyone rather than whatever the sidebar happened to be left on. */
export function getFilteredIndicesAnyTeam(filters: FilterState): number[] {
  const out: number[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    if (matchesFiltersExceptTeam(i, filters)) out.push(i);
  }
  return out;
}

/* ---------- KPIs ---------- */

export interface KpiSummary {
  totalCases: number;
  completedCases: number;
  cancelledCases: number;
  /** Completed / Total. Every case is Completed or Cancelled in this data
   * source -- no Pending/Rejected states -- so the denominator is simply the
   * full count in view. Null when there are no cases in view. */
  completionRate: number | null;
  /** SLA Met / Completed, restricted to Completed cases per the data
   * dictionary's guidance (Cancelled rows carry SLA values that don't
   * represent real completed work). Null when there are no completed cases. */
  slaAchievementRate: number | null;
  slaMetCount: number;
  slaBreachedCount: number;
  /** Mean ActualSeconds (hold-excluded) in minutes, Completed only -- the
   * same measure SLAStatus itself is judged on. Arithmetic mean, matching
   * how this figure is already reported to leadership; see
   * medianProcessingMinutes for the skew-resistant secondary figure. */
  avgProcessingMinutes: number | null;
  /** Median of the same distribution -- shown as a secondary figure since a
   * handful of very long outlier cases can pull the mean well above what a
   * "typical" case looks like. */
  medianProcessingMinutes: number | null;
}

export function computeKpis(indices: number[]): KpiSummary {
  const { cols } = DASHBOARD_DATA;
  let completed = 0;
  let cancelled = 0;
  let slaMet = 0;
  let slaBreached = 0;
  const actualMinutes: number[] = [];

  for (const i of indices) {
    if (cols.status[i] === STATUS.COMPLETED) {
      completed++;
      if (cols.slaMet[i]) slaMet++;
      else slaBreached++;
      actualMinutes.push(cols.actualSeconds[i] / 60);
    } else {
      cancelled++;
    }
  }

  const total = indices.length;
  const stats = statsOf(actualMinutes);

  return {
    totalCases: total,
    completedCases: completed,
    cancelledCases: cancelled,
    completionRate: total > 0 ? (completed / total) * 100 : null,
    slaAchievementRate: completed > 0 ? (slaMet / completed) * 100 : null,
    slaMetCount: slaMet,
    slaBreachedCount: slaBreached,
    avgProcessingMinutes: stats?.mean ?? null,
    medianProcessingMinutes: stats?.median ?? null,
  };
}

/* ---------- month-over-month KPI deltas ---------- */

export interface MonthlyKpiPoint {
  key: string;
  kpis: KpiSummary;
}

/** One KpiSummary per calendar month of Request Raised date, in view. */
export function monthlyKpiSeries(indices: number[]): MonthlyKpiPoint[] {
  const { cols } = DASHBOARD_DATA;
  const byMonth = new Map<string, number[]>();
  for (const i of indices) {
    const key = bucketKey(cols.reqTs[i], "monthly");
    let arr = byMonth.get(key);
    if (!arr) {
      arr = [];
      byMonth.set(key, arr);
    }
    arr.push(i);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, idxs]) => ({ key, kpis: computeKpis(idxs) }));
}

export interface KpiDeltas {
  currentKey: string | null;
  previousKey: string | null;
  current: KpiSummary | null;
  totalCasesDeltaPct: number | null;
  completionRateDeltaPts: number | null;
  slaAchievementDeltaPts: number | null;
  avgProcessingMinutesDeltaPct: number | null;
  slaBreachedDeltaPct: number | null;
}

const EMPTY_DELTAS: KpiDeltas = {
  currentKey: null,
  previousKey: null,
  current: null,
  totalCasesDeltaPct: null,
  completionRateDeltaPts: null,
  slaAchievementDeltaPts: null,
  avgProcessingMinutesDeltaPct: null,
  slaBreachedDeltaPct: null,
};

function pctDelta(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function ptsDelta(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null) return null;
  return curr - prev;
}

/** Compares the latest COMPLETE calendar month against the one before it --
 * both restricted to complete months (see PARTIAL_MONTHS) so a 1-day partial
 * month at either end of the data never produces a misleading swing. */
export function computeKpiDeltas(indices: number[]): KpiDeltas {
  const series = monthlyKpiSeries(indices).filter((p) => !PARTIAL_MONTHS.has(p.key));
  if (series.length < 2) return EMPTY_DELTAS;
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  return {
    currentKey: current.key,
    previousKey: previous.key,
    current: current.kpis,
    totalCasesDeltaPct: pctDelta(current.kpis.totalCases, previous.kpis.totalCases),
    completionRateDeltaPts: ptsDelta(current.kpis.completionRate, previous.kpis.completionRate),
    slaAchievementDeltaPts: ptsDelta(current.kpis.slaAchievementRate, previous.kpis.slaAchievementRate),
    avgProcessingMinutesDeltaPct: pctDelta(current.kpis.avgProcessingMinutes, previous.kpis.avgProcessingMinutes),
    slaBreachedDeltaPct: pctDelta(current.kpis.slaBreachedCount, previous.kpis.slaBreachedCount),
  };
}

/* ---------- breakdowns (volume, all statuses unless noted) ---------- */

export interface BreakdownItem {
  label: string;
  count: number;
}

function collapseToTopN(items: BreakdownItem[], topN: number): BreakdownItem[] {
  if (items.length <= topN) return items;
  const top = items.slice(0, topN);
  const restCount = items.slice(topN).reduce((sum, it) => sum + it.count, 0);
  return [...top, { label: "Other", count: restCount }];
}

function countBy(indices: number[], keyOf: (i: number) => string): BreakdownItem[] {
  const counts = new Map<string, number>();
  for (const i of indices) {
    const label = keyOf(i);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function departmentBreakdown(indices: number[], topN = 8): BreakdownItem[] {
  const { departments, cols } = DASHBOARD_DATA;
  const full = countBy(indices, (i) => departments[cols.dept[i]]);
  return collapseToTopN(full, topN);
}

export function categoryBreakdown(indices: number[]): BreakdownItem[] {
  const { categories, cols } = DASHBOARD_DATA;
  return countBy(indices, (i) => categories[cols.cat[i]]);
}

export function siteBreakdown(indices: number[], topN = 10): BreakdownItem[] {
  const { sites, cols } = DASHBOARD_DATA;
  const full = countBy(indices, (i) => sites[cols.site[i]]);
  return collapseToTopN(full, topN);
}

export function countryBreakdown(indices: number[]): BreakdownItem[] {
  const { countries, cols } = DASHBOARD_DATA;
  return countBy(indices, (i) => countries[cols.country[i]]);
}

/** Fixed order (Completed, Cancelled) so legend/series order stays stable across filters. */
export function statusMix(indices: number[]): BreakdownItem[] {
  const { statuses, cols } = DASHBOARD_DATA;
  const counts = new Map<string, number>(statuses.map((s) => [s, 0]));
  for (const i of indices) {
    const label = statuses[cols.status[i]];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return statuses.map((label) => ({ label, count: counts.get(label) ?? 0 }));
}

/** SLA Met vs SLA Breached, Completed cases only. */
export function slaMix(indices: number[]): BreakdownItem[] {
  const completed = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  let met = 0;
  let breached = 0;
  for (const i of completed) {
    if (cols.slaMet[i]) met++;
    else breached++;
  }
  return [
    { label: "SLA Met", count: met },
    { label: "SLA Breached", count: breached },
  ];
}

export function cptWorkload(indices: number[], topN = 17): BreakdownItem[] {
  const completed = onlyCompleted(indices);
  const { cptMembers, cols } = DASHBOARD_DATA;
  const full = countBy(completed, (i) => cptMembers[cols.cpt[i]]);
  return collapseToTopN(full, topN);
}

/* ---------- monthly volume & SLA achievement trend ---------- */

export interface VolumeSlaPoint {
  key: string;
  volume: number;
  completed: number;
  cancelled: number;
  slaPct: number | null;
  /** True when this bucket is a partial calendar month (only meaningful at
   * monthly granularity) -- rendered faded/hatched on trend charts and
   * excluded from peak/lowest-month scorecard picks. */
  isPartial: boolean;
}

/** Bucketed by Request Raised Date -- the field with full coverage and no
 * blanks, representing when the workload actually appeared. Volume counts
 * every case (Completed + Cancelled); SLA% is computed from the Completed
 * subset of each bucket only, per the dictionary's guidance. */
export function volumeAndSlaTrend(indices: number[], granularity: Granularity): VolumeSlaPoint[] {
  const { cols } = DASHBOARD_DATA;
  const buckets = new Map<string, { completed: number; cancelled: number; slaMet: number }>();

  for (const i of indices) {
    const key = bucketKey(cols.reqTs[i], granularity);
    let b = buckets.get(key);
    if (!b) {
      b = { completed: 0, cancelled: 0, slaMet: 0 };
      buckets.set(key, b);
    }
    if (cols.status[i] === STATUS.COMPLETED) {
      b.completed++;
      if (cols.slaMet[i]) b.slaMet++;
    } else {
      b.cancelled++;
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, b]) => ({
      key,
      volume: b.completed + b.cancelled,
      completed: b.completed,
      cancelled: b.cancelled,
      slaPct: b.completed > 0 ? (b.slaMet / b.completed) * 100 : null,
      isPartial: granularity === "monthly" && PARTIAL_MONTHS.has(key),
    }));
}

/* ---------- category performance ---------- */

export interface CategoryPerformanceRow {
  name: string;
  volume: number;
  slaMetCount: number;
  slaPct: number | null;
  /** Arithmetic mean of Actual Completion Minutes -- matches how "Avg TAT" is
   * reported to leadership. */
  avgActualMinutes: number | null;
  /** Median of the same distribution -- secondary, skew-resistant figure. */
  medianActualMinutes: number | null;
  tatMinutes: number;
  /** % by which avgActualMinutes sits under the TAT benchmark. Negative means over. */
  efficiencyPct: number | null;
}

/** Completed-only throughout -- this is a performance view, not a volume
 * view (see Volume & Demand tab for total volume including Cancelled). */
export function categoryPerformance(indices: number[]): CategoryPerformanceRow[] {
  const completed = onlyCompleted(indices);
  const { categories, tatMinutesByCategory, cols } = DASHBOARD_DATA;
  const byCat = categories.map(() => ({ n: 0, slaMet: 0, minutes: [] as number[] }));

  for (const i of completed) {
    const c = cols.cat[i];
    byCat[c].n++;
    if (cols.slaMet[i]) byCat[c].slaMet++;
    byCat[c].minutes.push(cols.actualSeconds[i] / 60);
  }

  return categories
    .map((name, i) => {
      const b = byCat[i];
      const stats = statsOf(b.minutes);
      const tat = tatMinutesByCategory[i];
      return {
        name,
        volume: b.n,
        slaMetCount: b.slaMet,
        slaPct: b.n > 0 ? (b.slaMet / b.n) * 100 : null,
        avgActualMinutes: stats?.mean ?? null,
        medianActualMinutes: stats?.median ?? null,
        tatMinutes: tat,
        efficiencyPct: stats ? ((tat - stats.mean) / tat) * 100 : null,
      };
    })
    .filter((r) => r.volume > 0)
    .sort((a, b) => b.volume - a.volume);
}

export interface CategorySlaTrendSeries {
  category: string;
  points: { key: string; slaPct: number | null }[];
}

/** One SLA% line per category over time, Completed-only. */
export function categorySlaTrend(indices: number[], granularity: Granularity): CategorySlaTrendSeries[] {
  const completed = onlyCompleted(indices);
  const { categories, cols } = DASHBOARD_DATA;
  const keys = new Set<string>();
  const byCat = categories.map(() => new Map<string, { n: number; met: number }>());

  for (const i of completed) {
    const key = bucketKey(cols.reqTs[i], granularity);
    keys.add(key);
    const c = cols.cat[i];
    let b = byCat[c].get(key);
    if (!b) {
      b = { n: 0, met: 0 };
      byCat[c].set(key, b);
    }
    b.n++;
    if (cols.slaMet[i]) b.met++;
  }

  const sortedKeys = [...keys].sort();
  return categories.map((name, ci) => ({
    category: name,
    points: sortedKeys.map((key) => {
      const b = byCat[ci].get(key);
      return { key, slaPct: b && b.n > 0 ? (b.met / b.n) * 100 : null };
    }),
  }));
}

/* ---------- SLA performance tab ---------- */

export interface SlaTrendPoint {
  key: string;
  n: number;
  slaMetCount: number;
  slaPct: number | null;
  isPartial: boolean;
}

export function slaTrend(indices: number[], granularity: Granularity): SlaTrendPoint[] {
  const completed = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  const buckets = new Map<string, { n: number; met: number }>();

  for (const i of completed) {
    const key = bucketKey(cols.reqTs[i], granularity);
    let b = buckets.get(key);
    if (!b) {
      b = { n: 0, met: 0 };
      buckets.set(key, b);
    }
    b.n++;
    if (cols.slaMet[i]) b.met++;
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, b]) => ({
      key,
      n: b.n,
      slaMetCount: b.met,
      slaPct: b.n > 0 ? (b.met / b.n) * 100 : null,
      isPartial: granularity === "monthly" && PARTIAL_MONTHS.has(key),
    }));
}

export interface BreachDriverStats {
  withHold: { n: number; breached: number; breachRate: number | null };
  withoutHold: { n: number; breached: number; breachRate: number | null };
}

/** Compares SLA breach rate for Completed cases that had a hold applied vs.
 * those that didn't -- a hold's whole purpose is stopping the SLA clock, so
 * this tests whether holds are actually protecting the cases that use them. */
export function breachDrivers(indices: number[]): BreachDriverStats {
  const completed = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  let withHoldN = 0;
  let withHoldBreached = 0;
  let withoutHoldN = 0;
  let withoutHoldBreached = 0;

  for (const i of completed) {
    const hadHold = cols.holdOverlapSeconds[i] > 0;
    if (hadHold) {
      withHoldN++;
      if (!cols.slaMet[i]) withHoldBreached++;
    } else {
      withoutHoldN++;
      if (!cols.slaMet[i]) withoutHoldBreached++;
    }
  }

  return {
    withHold: { n: withHoldN, breached: withHoldBreached, breachRate: withHoldN > 0 ? (withHoldBreached / withHoldN) * 100 : null },
    withoutHold: {
      n: withoutHoldN,
      breached: withoutHoldBreached,
      breachRate: withoutHoldN > 0 ? (withoutHoldBreached / withoutHoldN) * 100 : null,
    },
  };
}

export interface HoldImpactStats {
  casesWithHold: number;
  avgHoldMinutes: number | null;
  /** Completed cases where raw TaskSeconds would have breached SLA, but
   * subtracting hold time (ActualSeconds) brought them back under the
   * benchmark -- i.e. the hold literally saved the case from an SLA breach. */
  casesSavedByHold: number;
}

export function holdImpact(indices: number[]): HoldImpactStats {
  const completed = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  let casesWithHold = 0;
  let savedByHold = 0;
  const holdMinutes: number[] = [];

  for (const i of completed) {
    if (cols.holdOverlapSeconds[i] <= 0) continue;
    casesWithHold++;
    holdMinutes.push(cols.holdOverlapSeconds[i] / 60);
    const tatSeconds = cols.tatMinutes[i] * 60;
    const wouldHaveBreached = cols.taskSeconds[i] > tatSeconds;
    const actuallyMet = cols.actualSeconds[i] <= tatSeconds;
    if (wouldHaveBreached && actuallyMet) savedByHold++;
  }

  const stats = statsOf(holdMinutes);
  return { casesWithHold, avgHoldMinutes: stats?.mean ?? null, casesSavedByHold: savedByHold };
}

export interface BreachOutlier {
  caseNo: string;
  category: string;
  cptMember: string;
  dateMs: number;
  actualMinutes: number;
  tatMinutes: number;
  overMinutes: number;
}

/** Every Completed SLA breach, worst overage first. Uncapped by default
 * (topN = Infinity) -- BreachOutliersTable renders the full list with
 * client-side search; topN stays available for callers that want a bounded
 * slice (worstBreachCluster passes 15 explicitly). */
export function breachOutliers(indices: number[], topN = Infinity): BreachOutlier[] {
  const completed = onlyCompleted(indices);
  const { categories, cptMembers, cols } = DASHBOARD_DATA;
  const rows: BreachOutlier[] = [];

  for (const i of completed) {
    if (cols.slaMet[i]) continue;
    const actualMinutes = cols.actualSeconds[i] / 60;
    const tat = cols.tatMinutes[i];
    rows.push({
      caseNo: cols.caseNo[i],
      category: categories[cols.cat[i]],
      cptMember: cptMembers[cols.cpt[i]],
      dateMs: cols.endTs[i],
      actualMinutes,
      tatMinutes: tat,
      overMinutes: actualMinutes - tat,
    });
  }

  return rows.sort((a, b) => b.overMinutes - a.overMinutes).slice(0, topN);
}

/* ---------- CPT member insights ---------- */

export interface CptMemberStats {
  name: string;
  team: string;
  startTs: number | null;
  tenureApprox: boolean;
  tenureDays: number | null;
  totalCompleted: number;
  totalAssigned: number;
  slaMetCount: number;
  slaPct: number | null;
  avgActualMinutes: number | null;
  medianActualMinutes: number | null;
  /** Completed cases per day of tenure -- lets a 3-month member be compared
   * fairly against a 13-month veteran instead of losing on raw lifetime volume. */
  casesPerDay: number | null;
  /** Below MIN_COMPLETED_FOR_RANKING completed cases -- excluded from
   * best/worst rankings and intervention call-outs, still gets a full
   * profile card tagged "Ramping". */
  lowSample: boolean;
}

export function cptMemberStats(indices: number[]): CptMemberStats[] {
  const { cptMembers, cptTeam, cptStartTs, cptTenureApprox, cols } = DASHBOARD_DATA;
  const assigned = new Array(cptMembers.length).fill(0);
  const completed = new Array(cptMembers.length).fill(0);
  const slaMet = new Array(cptMembers.length).fill(0);
  const minutes: number[][] = cptMembers.map(() => []);

  for (const i of indices) {
    const m = cols.cpt[i];
    assigned[m]++;
    if (cols.status[i] === STATUS.COMPLETED) {
      completed[m]++;
      if (cols.slaMet[i]) slaMet[m]++;
      minutes[m].push(cols.actualSeconds[i] / 60);
    }
  }

  return cptMembers.map((name, i) => {
    const startTs = cptStartTs[i];
    const tenureDays = startTs !== null ? Math.max(1, (REPORT_NOW_MS - startTs) / MS_PER_DAY) : null;
    const stats = statsOf(minutes[i]);
    return {
      name,
      team: cptTeam[i],
      startTs,
      tenureApprox: cptTenureApprox[i],
      tenureDays,
      totalCompleted: completed[i],
      totalAssigned: assigned[i],
      slaMetCount: slaMet[i],
      slaPct: completed[i] > 0 ? (slaMet[i] / completed[i]) * 100 : null,
      avgActualMinutes: stats?.mean ?? null,
      medianActualMinutes: stats?.median ?? null,
      casesPerDay: tenureDays !== null && completed[i] > 0 ? completed[i] / tenureDays : null,
      lowSample: completed[i] < MIN_COMPLETED_FOR_RANKING,
    };
  });
}

export interface CptCategoryRow {
  category: string;
  volume: number;
  slaPct: number | null;
  avgActualMinutes: number | null;
}

/** Per-member x per-category breakdown, Completed-only -- powers each
 * individual profile card's category table. Computed once over all members
 * rather than per-card, since every card needs it. */
export function cptMemberCategoryBreakdown(indices: number[]): Map<string, CptCategoryRow[]> {
  const completed = onlyCompleted(indices);
  const { cptMembers, categories, cols } = DASHBOARD_DATA;
  const grid = cptMembers.map(() => categories.map(() => ({ n: 0, met: 0, minutes: [] as number[] })));

  for (const i of completed) {
    const m = cols.cpt[i];
    const c = cols.cat[i];
    const cell = grid[m][c];
    cell.n++;
    if (cols.slaMet[i]) cell.met++;
    cell.minutes.push(cols.actualSeconds[i] / 60);
  }

  const out = new Map<string, CptCategoryRow[]>();
  cptMembers.forEach((name, m) => {
    const rows = categories
      .map((cat, c) => {
        const cell = grid[m][c];
        const stats = statsOf(cell.minutes);
        return {
          category: cat,
          volume: cell.n,
          slaPct: cell.n > 0 ? (cell.met / cell.n) * 100 : null,
          avgActualMinutes: stats?.mean ?? null,
        };
      })
      .filter((r) => r.volume > 0)
      .sort((a, b) => b.volume - a.volume);
    out.set(name, rows);
  });
  return out;
}

/* ---------- maker-checker / QC ---------- */

export interface CheckerStatsRow {
  name: string;
  /** The approver's own team, via CHECKER_TEAM (same roster as cptMembers,
   * looked up by name). Null when the name has no roster match -- the
   * "Unknown" blank-approval placeholder, or someone (e.g. a Team Lead) who
   * approves cases without being a case-processing CPT member. */
  team: string | null;
  startTs: number | null;
  tenureDays: number | null;
  tenureApprox: boolean;
  volumeChecked: number;
  breachedUnderChecker: number;
  breachRatePct: number | null;
}

/** How often Completed cases breach SLA, grouped by who checked/approved the
 * output ("Approved by cpt name") rather than who processed it -- surfaces
 * whether sign-off quality correlates with outcomes. Correlational only:
 * confounded by category mix and by who did the underlying work, so this is
 * a starting point for a conversation, not a verdict on any one checker. */
export function checkerStats(indices: number[]): CheckerStatsRow[] {
  const completed = onlyCompleted(indices);
  const { checkers, cols } = DASHBOARD_DATA;
  const n = new Array(checkers.length).fill(0);
  const breached = new Array(checkers.length).fill(0);

  for (const i of completed) {
    const c = cols.checker[i];
    if (c === null) continue;
    n[c]++;
    if (!cols.slaMet[i]) breached[c]++;
  }

  return checkers
    .map((name, i) => {
      const startTs = CHECKER_START_TS[i] ?? null;
      return {
        name,
        team: CHECKER_TEAM[i] ?? null,
        startTs,
        tenureDays: startTs !== null ? Math.max(1, (REPORT_NOW_MS - startTs) / MS_PER_DAY) : null,
        tenureApprox: CHECKER_TENURE_APPROX[i] ?? false,
        volumeChecked: n[i],
        breachedUnderChecker: breached[i],
        breachRatePct: n[i] > 0 ? (breached[i] / n[i]) * 100 : null,
      };
    })
    .filter((r) => r.volumeChecked > 0)
    .sort((a, b) => b.volumeChecked - a.volumeChecked);
}

export interface TeamLeaderboardEntry {
  name: string;
  value: number;
}

export interface TeamLeaderboard {
  topSla: TeamLeaderboardEntry | null;
  fastestTat: TeamLeaderboardEntry | null;
  highestVolume: TeamLeaderboardEntry | null;
  topApprover: TeamLeaderboardEntry | null;
}

/** Per-team leaderboard (Philippines vs. India ranked separately, never
 * cross-team) -- backs both the CPT Member Insights KPI strip and the
 * individual member-card role badges, so the two can't disagree with each
 * other the way a single global ranking could (e.g. crowning a hidden
 * India-team member "Top SLA Achiever" while the page defaults to showing
 * Philippines cards only). SLA/TAT respect the same lowSample threshold
 * cptMemberStats already applies; Highest Volume and Top Approver stay
 * threshold-free, matching how "Highest Volume" has always worked. */
export function teamLeaderboards(indices: number[]): Record<LocalTeam, TeamLeaderboard> {
  const members = cptMemberStats(indices);
  const approvers = checkerStats(indices);
  const { checkers } = DASHBOARD_DATA;

  function forTeam(team: LocalTeam): TeamLeaderboard {
    const teamMembers = members.filter((m) => m.team === team);
    const rankable = teamMembers.filter((m) => !m.lowSample && m.slaPct !== null);
    const withTat = rankable.filter((m) => m.avgActualMinutes !== null);
    const withVolume = teamMembers.filter((m) => m.totalCompleted > 0);
    const teamApprovers = approvers.filter((a) => {
      const idx = checkers.indexOf(a.name);
      return idx !== -1 && CHECKER_TEAM[idx] === team;
    }); // already sorted by volume descending

    const topSla = rankable.length ? rankable.reduce((b, m) => (m.slaPct! > b.slaPct! ? m : b), rankable[0]) : null;
    const fastestTat = withTat.length
      ? withTat.reduce((b, m) => (m.avgActualMinutes! < b.avgActualMinutes! ? m : b), withTat[0])
      : null;
    const highestVolume = withVolume.length
      ? withVolume.reduce((b, m) => (m.totalCompleted > b.totalCompleted ? m : b), withVolume[0])
      : null;
    const topApprover = teamApprovers[0] ?? null;

    return {
      topSla: topSla ? { name: topSla.name, value: topSla.slaPct! } : null,
      fastestTat: fastestTat ? { name: fastestTat.name, value: fastestTat.avgActualMinutes! } : null,
      highestVolume: highestVolume ? { name: highestVolume.name, value: highestVolume.totalCompleted } : null,
      topApprover: topApprover ? { name: topApprover.name, value: topApprover.volumeChecked } : null,
    };
  }

  return { Philippines: forTeam("Philippines"), India: forTeam("India") };
}

/* ---------- executive scorecard ---------- */

export interface ScorecardData {
  peakSlaMonth: { key: string; slaPct: number } | null;
  lowestSlaMonth: { key: string; slaPct: number } | null;
  peakVolumeMonth: { key: string; volume: number } | null;
  maxTatRecordedMinutes: number | null;
  completedCases: number;
  completedCasesPct: number | null;
  bestCptSla: { name: string; slaPct: number } | null;
}

/** Month picks (peak/lowest SLA, peak volume) are restricted to complete
 * calendar months so a 1-day partial month at either end of the data can
 * never win or lose a scorecard cell. Best CPT SLA is restricted to members
 * at/above MIN_COMPLETED_FOR_RANKING for the same fairness reason members
 * are excluded from CPT-level rankings elsewhere. */
export function computeScorecard(indices: number[]): ScorecardData {
  const trend = volumeAndSlaTrend(indices, "monthly").filter((p) => !p.isPartial);
  const withSla = trend.filter((t) => t.slaPct !== null);
  const peakSla = withSla.length ? withSla.reduce((b, t) => (t.slaPct! > b.slaPct! ? t : b), withSla[0]) : null;
  const lowestSla = withSla.length ? withSla.reduce((b, t) => (t.slaPct! < b.slaPct! ? t : b), withSla[0]) : null;
  const peakVolume = trend.length ? trend.reduce((b, t) => (t.volume > b.volume ? t : b), trend[0]) : null;

  const completedIdx = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  let maxTat: number | null = null;
  for (const i of completedIdx) {
    const m = cols.actualSeconds[i] / 60;
    if (maxTat === null || m > maxTat) maxTat = m;
  }

  const kpis = computeKpis(indices);
  const members = cptMemberStats(indices).filter((m) => !m.lowSample && m.slaPct !== null);
  const bestCpt = members.length ? members.reduce((b, m) => (m.slaPct! > b.slaPct! ? m : b), members[0]) : null;

  return {
    peakSlaMonth: peakSla ? { key: peakSla.key, slaPct: peakSla.slaPct! } : null,
    lowestSlaMonth: lowestSla ? { key: lowestSla.key, slaPct: lowestSla.slaPct! } : null,
    peakVolumeMonth: peakVolume ? { key: peakVolume.key, volume: peakVolume.volume } : null,
    maxTatRecordedMinutes: maxTat,
    completedCases: kpis.completedCases,
    completedCasesPct: kpis.completionRate,
    bestCptSla: bestCpt ? { name: bestCpt.name, slaPct: bestCpt.slaPct! } : null,
  };
}

/* ---------- CPT day-of-week activity ---------- */

export const DOW_LABELS_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0]; // Date#getUTCDay(): 0 = Sunday

export interface CptDowRow {
  name: string;
  total: number;
  raw: number[];
  pct: number[];
}

/** Row-normalized per member: each row sums to that member's own 100%, so a
 * light vs. heavy caseload member are equally readable on the same color scale.
 * basis shifts endTs before bucketing -- under IST, a case closed just after
 * midnight PHT can land on the previous calendar day; that's correct, not a bug. */
export function cptDayOfWeek(indices: number[], basis: TimeBasis = "PHT"): CptDowRow[] {
  const completed = onlyCompleted(indices);
  const { cptMembers, cols } = DASHBOARD_DATA;
  const raw = cptMembers.map(() => new Array(7).fill(0));
  const total = new Array(cptMembers.length).fill(0);

  for (const i of completed) {
    const dow = new Date(shiftForBasis(cols.endTs[i], basis)).getUTCDay();
    const m = cols.cpt[i];
    raw[m][dow]++;
    total[m]++;
  }

  return cptMembers
    .map((name, i) => {
      const t = total[i];
      const rawOrdered = DOW_ORDER_MON_FIRST.map((d) => raw[i][d]);
      const pctOrdered = t > 0 ? rawOrdered.map((c) => (c / t) * 100) : rawOrdered.map(() => 0);
      return { name, total: t, raw: rawOrdered, pct: pctOrdered };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

/* ---------- Quality & Outcomes ---------- */

export interface CompletionRateTrendPoint {
  key: string;
  total: number;
  completed: number;
  completionRate: number | null;
  isPartial: boolean;
}

export function completionRateTrend(indices: number[], granularity: Granularity): CompletionRateTrendPoint[] {
  const { cols } = DASHBOARD_DATA;
  const buckets = new Map<string, { total: number; completed: number }>();

  for (const i of indices) {
    const key = bucketKey(cols.reqTs[i], granularity);
    let b = buckets.get(key);
    if (!b) {
      b = { total: 0, completed: 0 };
      buckets.set(key, b);
    }
    b.total++;
    if (cols.status[i] === STATUS.COMPLETED) b.completed++;
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, b]) => ({
      key,
      total: b.total,
      completed: b.completed,
      completionRate: b.total > 0 ? (b.completed / b.total) * 100 : null,
      isPartial: granularity === "monthly" && PARTIAL_MONTHS.has(key),
    }));
}

export interface RateRow {
  name: string;
  total: number;
  numerator: number;
  rate: number | null;
}

/** Cancellation rate, restricted to the top-15 departments by volume in the
 * current view -- so a one-off tiny department can't dominate the ranking. */
export function cancellationByDepartment(indices: number[]): RateRow[] {
  const { departments, cols } = DASHBOARD_DATA;
  const top15 = new Set(departmentBreakdown(indices, Infinity).slice(0, 15).map((it) => it.label));
  const total = new Map<string, number>();
  const cancelled = new Map<string, number>();

  for (const i of indices) {
    const name = departments[cols.dept[i]];
    if (!top15.has(name)) continue;
    total.set(name, (total.get(name) ?? 0) + 1);
    if (cols.status[i] === STATUS.CANCELLED) cancelled.set(name, (cancelled.get(name) ?? 0) + 1);
  }

  return [...total.entries()]
    .map(([name, t]) => ({
      name,
      total: t,
      numerator: cancelled.get(name) ?? 0,
      rate: t > 0 ? ((cancelled.get(name) ?? 0) / t) * 100 : null,
    }))
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
}

/* ---------- turnaround / duration distribution ---------- */

export interface DurationStats {
  actual: RangeStats | null;
  raw: RangeStats | null;
}

/** ActualSeconds (hold-excluded, SLA clock) vs. raw TaskSeconds, Completed only --
 * shows how much of the raw elapsed time is genuinely CPT working time. */
export function processingDurationStats(indices: number[]): DurationStats {
  const completed = onlyCompleted(indices);
  const { cols } = DASHBOARD_DATA;
  const actual: number[] = [];
  const raw: number[] = [];
  for (const i of completed) {
    actual.push(cols.actualSeconds[i] / 60);
    raw.push(cols.taskSeconds[i] / 60);
  }
  return { actual: statsOf(actual), raw: statsOf(raw) };
}

/* ---------- timing heatmaps ---------- */

export interface HeatResult {
  /** [day 0=Mon..6=Sun][hour 0-23] */
  matrix: number[][];
  total: number;
  busiestHourIdx: number;
  busiestHourCount: number;
}

function buildHeatmap(timestamps: number[]): HeatResult {
  const raw = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let total = 0;
  for (const ts of timestamps) {
    const d = new Date(ts);
    raw[d.getUTCDay()][d.getUTCHours()]++;
    total++;
  }
  const matrix = DOW_ORDER_MON_FIRST.map((d) => raw[d].slice());
  const hourTotals = new Array(24).fill(0);
  matrix.forEach((row) => row.forEach((c, h) => (hourTotals[h] += c)));
  const busiestHourIdx = hourTotals.reduce((best, c, h) => (c > hourTotals[best] ? h : best), 0);
  return { matrix, total, busiestHourIdx, busiestHourCount: hourTotals[busiestHourIdx] };
}

export type TimeBasis = "PHT" | "IST";

/** cols timestamps are PH-wall-clock values stored as a uniform +8h shift off
 * raw UTC (see build_dashboard.py's UTC_DATETIME_COLUMNS shift). IST is
 * UTC+5:30, reachable by one more linear shift of -(8:00 - 5:30) = -2h30m off
 * the already-shifted PHT value -- no need to retain the discarded raw-UTC
 * value. If build_dashboard.py's shift ever stops being a uniform +8h across
 * all UTC_DATETIME_COLUMNS, this arithmetic breaks silently. */
const PHT_TO_IST_OFFSET_MS = 150 * 60 * 1000;

export const TIME_BASIS_LABEL: Record<TimeBasis, string> = {
  PHT: "Philippine Standard Time (UTC+8)",
  IST: "India Standard Time (UTC+5:30)",
};

function shiftForBasis(ts: number, basis: TimeBasis): number {
  return basis === "IST" ? ts - PHT_TO_IST_OFFSET_MS : ts;
}

/** When requests are raised -- demand-side timing, independent of status. */
export function requestTimeHeatmap(indices: number[], basis: TimeBasis = "PHT"): HeatResult {
  const { cols } = DASHBOARD_DATA;
  return buildHeatmap(indices.map((i) => shiftForBasis(cols.reqTs[i], basis)));
}

/** When cases enter CPT's queue (TL approval) -- independent of status. */
export function tlApprovalTimeHeatmap(indices: number[], basis: TimeBasis = "PHT"): HeatResult {
  const { cols } = DASHBOARD_DATA;
  const ts: number[] = [];
  for (const i of indices) {
    const t = cols.tlApprovedTs[i];
    if (t !== null) ts.push(shiftForBasis(t, basis));
  }
  return buildHeatmap(ts);
}

/** When CPT actually finishes work -- Completed and Cancelled, since closing
 * out a Cancelled case is still CPT's work. endTs is Request Closed Date for
 * Completed rows, Request Cancelled Date for Cancelled rows. */
export function completionTimeHeatmap(indices: number[], basis: TimeBasis = "PHT"): HeatResult {
  const { cols } = DASHBOARD_DATA;
  return buildHeatmap(indices.map((i) => shiftForBasis(cols.endTs[i], basis)));
}
