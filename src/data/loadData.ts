import type { DashboardData } from "./types";
import { setProvenanceData } from "./provenance";

// Unlike cpt-performance-dashboard (which bundles dashboard_data.json at
// build time), this app has no data until the user uploads a workbook --
// these start as empty placeholders and are populated once by
// setDashboardData() after upload. Every consumer (selectors.ts, chart
// components) reads these via live ESM bindings inside function bodies that
// only run post-upload (gated by App.tsx), so reassigning them here after
// the fact is enough for every importer to see the real values -- no other
// file needs to change.
export let DASHBOARD_DATA: DashboardData = null as unknown as DashboardData;

export let STATUS = { COMPLETED: -1, CANCELLED: -1 };

export let ROW_COUNT = 0;

export let REPORT_NOW_MS = 0;

export let DATE_COVERAGE_START_MS = 0;
export let DATE_COVERAGE_END_MS = 0;

/** Calendar months ("YYYY-MM") with less than a full month of coverage. */
export let PARTIAL_MONTHS = new Set<string>();

/** Below this many completed cases, a CPT member is excluded from best/worst
 * rankings and intervention call-outs (still gets a full profile card,
 * tagged "Ramping" in the UI). */
export let MIN_COMPLETED_FOR_RANKING = 0;

/** checkers[] is a separately-indexed lookup (same roster, keyed by
 * "Approved by cpt name" instead of "Assigned to cpt name"), plus one
 * placeholder entry, "Unknown", for blank/unrecognized approvals -- so
 * there's no shared index space with cptMembers/cptTeam. */
export let CHECKER_TEAM: (string | null)[] = [];

/** Parallel to `checkers`, same name-lookup as CHECKER_TEAM -- an approver's
 * tenure is their tenure as a CPT member (roster.ts has no separate approver
 * roster), so charts that show tenure per approver reuse this rather than
 * re-deriving it. Null for a checker with no matching cptMembers entry. */
export let CHECKER_START_TS: (number | null)[] = [];
export let CHECKER_TENURE_APPROX: boolean[] = [];

/** Populates every export above from a freshly-parsed workbook. Called once,
 * right after the in-browser Excel transform completes and before the
 * dashboard UI is allowed to mount (see App.tsx's upload gate). */
export function setDashboardData(data: DashboardData): void {
  DASHBOARD_DATA = data;

  STATUS = {
    COMPLETED: data.statuses.indexOf("Completed"),
    CANCELLED: data.statuses.indexOf("Cancelled"),
  };

  ROW_COUNT = data.cols.status.length;

  // "Now" for any time-relative calculation is the report's generation time,
  // not the viewer's clock -- meta.generatedAt is a naive PH wall-clock string;
  // appending "Z" is what makes it parse the same way cols timestamps are
  // stamped (UTC that actually reads as PH wall-clock via getUTC* accessors).
  REPORT_NOW_MS = Date.parse(data.meta.generatedAt + "Z");

  DATE_COVERAGE_START_MS = data.meta.dateRange.min;
  DATE_COVERAGE_END_MS = data.meta.dateRange.max;

  PARTIAL_MONTHS = new Set(data.meta.partialMonths);

  MIN_COMPLETED_FOR_RANKING = data.meta.minCompletedForRanking;

  CHECKER_TEAM = data.checkers.map((name) => {
    const m = data.cptMembers.indexOf(name);
    return m === -1 ? null : data.cptTeam[m];
  });
  CHECKER_START_TS = data.checkers.map((name) => {
    const m = data.cptMembers.indexOf(name);
    return m === -1 ? null : data.cptStartTs[m];
  });
  CHECKER_TENURE_APPROX = data.checkers.map((name) => {
    const m = data.cptMembers.indexOf(name);
    return m === -1 ? false : data.cptTenureApprox[m];
  });

  setProvenanceData(data);
}

/** Row indices where cols.status === STATUS.COMPLETED -- the dictionary's own
 * guidance is to filter to Completed before reporting on throughput,
 * productivity, or SLA, since Cancelled rows still carry timing/SLA values
 * that don't represent real completed work. */
export function onlyCompleted(indices: number[]): number[] {
  const { status } = DASHBOARD_DATA.cols;
  return indices.filter((i) => status[i] === STATUS.COMPLETED);
}
