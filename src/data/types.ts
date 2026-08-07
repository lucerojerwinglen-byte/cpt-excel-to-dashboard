export interface DashboardMeta {
  generatedAt: string;
  totalRows: number;
  dateRange: { min: number; max: number };
  /** Calendar months ("YYYY-MM") with less than full coverage -- excluded
   * from peak/lowest-month scorecard picks, rendered faded on trend charts. */
  partialMonths: string[];
  statusCounts: { Completed: number; Cancelled: number };
  slaCounts: { "SLA Met": number; "SLA Breached": number };
  reconciliation: { mismatches: number; matchRatePct: number };
  holdStats: { rowsWithHold: number; rowsWithOverlap: number };
  blanks: {
    site: number;
    city: number;
    department: number;
    country: number;
    companyName: number;
    approvedDateByTL: number;
  };
  edgeCases: {
    cancelledWithClosedDate: number;
    completedWithCancelledDate: number;
    completedWithNoClosedDate: number;
  };
  /** Below this many completed cases, a CPT member is excluded from
   * best/worst rankings and intervention call-outs. */
  minCompletedForRanking: number;
  sourceFile: string;
}

/** Columnar case data -- index i across every array describes one case. */
export interface DashboardCols {
  /** Ticket number shown to end users ("C" + internal RequestCaseInputHeadID),
   * e.g. "C49091". Unique per row -- kept as a plain string array, not a
   * lookup index, since it doesn't repeat the way a category/department does. */
  caseNo: string[];
  cat: number[];
  dept: number[];
  status: number[];
  cpt: number[];
  /** Index into `checkers`, or null -- "Approved by cpt name" is blank on
   * ~8,800 rows, mostly cancelled cases. */
  checker: (number | null)[];
  site: number[];
  country: number[];
  reqTs: number[];
  tlApprovedTs: (number | null)[];
  assignedTs: number[];
  /** Unified closure event: Request Closed Date if Completed, Request
   * Cancelled Date if Cancelled -- source column TaskEndDate, always present. */
  endTs: number[];
  cptApprovedTs: (number | null)[];
  holdStartTs: (number | null)[];
  holdEndTs: (number | null)[];
  taskSeconds: number[];
  holdOverlapSeconds: number[];
  actualSeconds: number[];
  tatMinutes: number[];
  /** 1 = SLA Met, 0 = SLA Breached. */
  slaMet: number[];
}

export interface DashboardData {
  meta: DashboardMeta;
  departments: string[];
  categories: string[];
  /** Parallel to `categories` -- fixed SLA target in minutes per category. */
  tatMinutesByCategory: number[];
  statuses: string[];
  cptMembers: string[];
  /** Parallel to `cptMembers`. */
  cptTeam: string[];
  /** Parallel to `cptMembers`. Epoch-ms of each member's tenure start date. */
  cptStartTs: (number | null)[];
  /** Parallel to `cptMembers`. True for members whose start date was only
   * given as a multi-month cohort range, not an individual date. */
  cptTenureApprox: boolean[];
  /** Checker ("Approved by cpt name") lookup -- same roster as cptMembers,
   * kept as a separate array since not every checker also appears as an
   * assignee in every filtered view. */
  checkers: string[];
  sites: string[];
  countries: string[];
  cols: DashboardCols;
}
