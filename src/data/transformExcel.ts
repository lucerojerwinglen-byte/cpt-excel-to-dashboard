import * as XLSX from "xlsx";
import type { DashboardData } from "./types";
import { ROSTER, APPROX_TENURE_MEMBERS, UNRECOGNIZED_TEAM, MIN_COMPLETED_FOR_RANKING } from "./roster";

// Client-side port of cpt-performance-dashboard/build_dashboard.py. Runs
// entirely in the browser on the uploaded workbook -- see that script's own
// header comment for the full rationale behind the +8h UTC->PHT shift below;
// this file reproduces its logic column-for-column, not just its output shape.

export const REQUIRED_SHEET = "Raw Data";

/** Every column build_dashboard.py's transform actually reads. Used both
 * here and by validateWorkbook.ts, so the two can't drift apart. */
export const REQUIRED_COLUMNS = [
  "CaseNo",
  "Category",
  "Status",
  "DEPARTMENT",
  "BUILDING_FACILITY_NAME",
  "COUNTRY",
  "CITY",
  "COMPANY_NAME",
  "Assigned to cpt name",
  "Approved by cpt name",
  "Request Raised Date",
  "Approved Date By TL",
  "Request Assigned Date",
  "Request Closed Date",
  "Request Cancelled Date",
  "Approved by cpt time",
  "Hold Date time",
  "TaskEndDate",
  "HoldStartDate",
  "HoldEndDate",
  "TaskSeconds",
  "HoldOverlapSeconds",
  "ActualSeconds",
  "TATInMinutes",
  "SLAStatus",
  "Actual Completion Minutes",
] as const;

const UNKNOWN = "Unknown";
const PH_SHIFT_MS = 8 * 60 * 60 * 1000;

type RawRow = Record<string, unknown>;

export interface TransformResult {
  data: DashboardData;
  /** Case-assignee names found in the sheet but absent from ROSTER --
   * defaulted to UNRECOGNIZED_TEAM with no tenure, surfaced as a visible
   * warning by the upload flow rather than silently misattributed. */
  unrecognizedMembers: string[];
}

/** pandas.read_excel silently converts a fixed set of sentinel strings
 * (its default na_values) to NaN on read -- this export uses the literal
 * text "NULL" for blank cells (verified empirically: e.g. every non-hold
 * row's "Hold Date time" cell literally contains the string "NULL", and
 * BUILDING_FACILITY_NAME/CITY/etc. use it for their handful of true blanks
 * too). SheetJS has no equivalent auto-conversion, so every raw presence
 * check here needs to treat "" and these sentinels as missing too, or this
 * transform silently diverges from build_dashboard.py's pandas-based one. */
const NA_SENTINELS = new Set(["null", "na", "n/a", "nan", "none", "#n/a"]);
function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || NA_SENTINELS.has(s.toLowerCase());
}

function cleanStr(v: unknown): string {
  return isBlank(v) ? UNKNOWN : String(v).trim();
}

/** Excel date cells are read as raw serial numbers (NOT via XLSX.read's
 * cellDates option -- that option decodes serials using the host machine's
 * local timezone, verified empirically: on a UTC+8 machine it silently
 * produced timestamps 8h off from the host-independent value. Since this
 * transform runs in the uploader's own browser, "host machine" means
 * whoever's laptop opens the app -- cellDates would make every timestamp
 * depend on the viewer's OS timezone, wrong for anyone not in UTC+8).
 * SSF.parse_date_code decodes a serial into plain Y/M/D/H/M/S fields with no
 * timezone involved, and Date.UTC() of those fields reproduces exactly what
 * pandas' read_excel returns (a naive, tz-less timestamp) -- matching
 * build_dashboard.py's own before-any-shift starting point. Adding
 * PH_SHIFT_MS then does what its UTC_DATETIME_COLUMNS loop + epoch_ms()
 * helper do together: shift the wall-clock fields +8h and store the result
 * the same "treat as UTC" way the rest of this app reads it. */
function shiftedEpochMs(v: unknown): number | null {
  if (isBlank(v)) return null;
  const serial = typeof v === "number" ? v : Number(v);
  if (Number.isFinite(serial)) {
    const d = XLSX.SSF.parse_date_code(serial);
    if (!d) return null;
    return Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, Math.round(d.S)) + PH_SHIFT_MS;
  }
  // Fallback for cells that arrived as text rather than a real date serial.
  const parsed = new Date(String(v));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime() + PH_SHIFT_MS;
}

function toInt(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Mirrors build_lookup_sorted_by_volume: values ordered by descending
 * frequency, ties broken by first-seen order (pandas' value_counts doesn't
 * strictly guarantee tie order either -- this only affects cosmetic chart
 * ordering, never which items exist or their totals). */
function sortedByVolume(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** Mirrors compute_partial_months: a month with less than full calendar
 * coverage (data starts after its 1st, or ends before its last day) gets
 * excluded from peak/lowest-month scorecard picks and marked "partial" on
 * trend charts. */
function computePartialMonths(reqDatesMs: number[]): string[] {
  if (reqDatesMs.length === 0) return [];
  const key = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  let lo = reqDatesMs[0];
  let hi = reqDatesMs[0];
  for (const ms of reqDatesMs) {
    if (ms < lo) lo = ms;
    if (ms > hi) hi = ms;
  }
  const loKey = key(lo);
  const hiKey = key(hi);
  const partial: string[] = [];

  const loDays = reqDatesMs.filter((ms) => key(ms) === loKey).map((ms) => new Date(ms).getUTCDate());
  const firstDayOfLo = Math.min(...loDays);
  if (firstDayOfLo > 1) partial.push(loKey);

  const hiDays = reqDatesMs.filter((ms) => key(ms) === hiKey).map((ms) => new Date(ms).getUTCDate());
  const lastDaySeen = Math.max(...hiDays);
  const hiDate = new Date(hi);
  const daysInHi = daysInMonth(hiDate.getUTCFullYear(), hiDate.getUTCMonth() + 1);
  if (lastDaySeen < daysInHi && !partial.includes(hiKey)) partial.push(hiKey);

  return partial;
}

export async function transformWorkbook(file: File): Promise<TransformResult> {
  const buffer = await file.arrayBuffer();
  // No cellDates here -- see shiftedEpochMs's comment for why. Date cells
  // come through sheet_to_json as raw numeric serials instead.
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[REQUIRED_SHEET];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
  const n = rows.length;

  const deptClean = rows.map((r) => cleanStr(r["DEPARTMENT"]));
  const siteClean = rows.map((r) => cleanStr(r["BUILDING_FACILITY_NAME"]));
  const countryClean = rows.map((r) => cleanStr(r["COUNTRY"]));
  const cptClean = rows.map((r) => cleanStr(r["Assigned to cpt name"]));
  const checkerClean = rows.map((r) => cleanStr(r["Approved by cpt name"]));

  const departments = sortedByVolume(deptClean);
  const sites = sortedByVolume(siteClean);
  const countries = [...new Set(countryClean)].sort();
  const categories = [...new Set(rows.map((r) => r["Category"] as string).filter((v) => !isBlank(v)))].sort();
  const statuses = ["Completed", "Cancelled"];
  const cptMembers = [...new Set(cptClean)].sort();
  const checkers = sortedByVolume(checkerClean);

  const deptIndex = new Map(departments.map((v, i) => [v, i]));
  const siteIndex = new Map(sites.map((v, i) => [v, i]));
  const countryIndex = new Map(countries.map((v, i) => [v, i]));
  const catIndex = new Map(categories.map((v, i) => [v, i]));
  const statusIndex = new Map(statuses.map((v, i) => [v, i]));
  const cptIndex = new Map(cptMembers.map((v, i) => [v, i]));
  const checkerIndex = new Map(checkers.map((v, i) => [v, i]));

  // TAT benchmark is fixed per category -- first row's value wins, matching
  // groupby("Category")["TATInMinutes"].first().
  const tatFirstSeen = new Map<string, number>();
  for (const r of rows) {
    const cat = r["Category"] as string | null;
    if (cat != null && !tatFirstSeen.has(cat)) tatFirstSeen.set(cat, toInt(r["TATInMinutes"]));
  }
  const tatMinutesByCategory = categories.map((c) => tatFirstSeen.get(c) ?? 0);

  const unrecognizedMembers: string[] = [];
  const cptTeam: string[] = [];
  const cptStartTs: (number | null)[] = [];
  const cptTenureApprox: boolean[] = [];
  for (const name of cptMembers) {
    const entry = ROSTER[name];
    if (entry) {
      const [team, startDate] = entry;
      cptTeam.push(team);
      // Roster dates are plain calendar dates (e.g. "2025-07-01") meant to
      // represent PH wall-clock midnight -- same "treat naive wall-clock as
      // UTC" convention as epoch_ms() in build_dashboard.py, no +8h shift
      // needed since this never went through the raw-export UTC reading.
      cptStartTs.push(Date.parse(startDate + "T00:00:00Z"));
      cptTenureApprox.push(APPROX_TENURE_MEMBERS.has(name));
    } else {
      unrecognizedMembers.push(name);
      cptTeam.push(UNRECOGNIZED_TEAM);
      cptStartTs.push(null);
      cptTenureApprox.push(false);
    }
  }

  const catCol = rows.map((r) => (!isBlank(r["Category"]) ? (catIndex.get(r["Category"] as string) ?? null) : null));
  const deptCol = deptClean.map((v) => deptIndex.get(v)!);
  const statusCol = rows.map((r) => statusIndex.get(r["Status"] as string) ?? null);
  const cptCol = cptClean.map((v) => cptIndex.get(v)!);
  const siteCol = siteClean.map((v) => siteIndex.get(v)!);
  const countryCol = countryClean.map((v) => countryIndex.get(v)!);
  const checkerCol = rows.map((r, i) => (!isBlank(r["Approved by cpt name"]) ? checkerIndex.get(checkerClean[i])! : null));
  const caseNoCol = rows.map((r) => cleanStr(r["CaseNo"]));

  const reqTs = rows.map((r) => shiftedEpochMs(r["Request Raised Date"]));
  const tlApprovedTs = rows.map((r) => shiftedEpochMs(r["Approved Date By TL"]));
  const assignedTs = rows.map((r) => shiftedEpochMs(r["Request Assigned Date"]));
  const endTs = rows.map((r) => shiftedEpochMs(r["TaskEndDate"]));
  const cptApprovedTs = rows.map((r) => shiftedEpochMs(r["Approved by cpt time"]));

  // HoldEndDate carries a meaningless (always-populated) value on rows with
  // no hold at all -- only trust it where Hold Date time is actually set.
  const hasHold = rows.map((r) => !isBlank(r["Hold Date time"]));
  const holdStartTs = rows.map((r, i) => (hasHold[i] ? shiftedEpochMs(r["HoldStartDate"]) : null));
  const holdEndTs = rows.map((r, i) => (hasHold[i] ? shiftedEpochMs(r["HoldEndDate"]) : null));

  const taskSeconds = rows.map((r) => toInt(r["TaskSeconds"]));
  const holdOverlapSeconds = rows.map((r) => toInt(r["HoldOverlapSeconds"]));
  const actualSeconds = rows.map((r) => toInt(r["ActualSeconds"]));
  const tatMinutes = rows.map((r) => toInt(r["TATInMinutes"]));
  const slaMet = rows.map((r) => (r["SLAStatus"] === "SLA Met" ? 1 : 0));

  // ---- meta / provenance ----
  let mismatches = 0;
  for (const r of rows) {
    // Raw (non-truncated) comparison, matching Python's
    // df["Actual Completion Minutes"] <= df["TATInMinutes"] -- truncating
    // first would flip results for rows where Actual Completion Minutes
    // has a fractional value sitting right at the TAT boundary.
    const predictedMet = Number(r["Actual Completion Minutes"]) <= Number(r["TATInMinutes"]);
    const actualMet = r["SLAStatus"] === "SLA Met";
    if (predictedMet !== actualMet) mismatches++;
  }

  const nowPh = new Date(Date.now() + PH_SHIFT_MS);
  const generatedAt = nowPh.toISOString().slice(0, 19);

  const validReqTs = reqTs.filter((v): v is number => v !== null);
  const partialMonths = computePartialMonths(validReqTs);

  const completedCount = statusCol.filter((s) => s === statusIndex.get("Completed")).length;
  const cancelledCount = statusCol.filter((s) => s === statusIndex.get("Cancelled")).length;
  const slaMetCount = slaMet.filter((v) => v === 1).length;

  const meta: DashboardData["meta"] = {
    generatedAt,
    totalRows: n,
    dateRange: {
      min: validReqTs.length ? Math.min(...validReqTs) : 0,
      max: validReqTs.length ? Math.max(...validReqTs) : 0,
    },
    partialMonths,
    statusCounts: { Completed: completedCount, Cancelled: cancelledCount },
    slaCounts: { "SLA Met": slaMetCount, "SLA Breached": n - slaMetCount },
    reconciliation: {
      mismatches,
      matchRatePct: n ? Math.round((1 - mismatches / n) * 10000) / 100 : 0,
    },
    holdStats: {
      rowsWithHold: hasHold.filter(Boolean).length,
      rowsWithOverlap: holdOverlapSeconds.filter((v) => v > 0).length,
    },
    blanks: {
      site: rows.filter((r) => isBlank(r["BUILDING_FACILITY_NAME"])).length,
      city: rows.filter((r) => isBlank(r["CITY"])).length,
      department: rows.filter((r) => isBlank(r["DEPARTMENT"])).length,
      country: rows.filter((r) => isBlank(r["COUNTRY"])).length,
      companyName: rows.filter((r) => isBlank(r["COMPANY_NAME"])).length,
      approvedDateByTL: rows.filter((r) => isBlank(r["Approved Date By TL"])).length,
    },
    edgeCases: {
      cancelledWithClosedDate: rows.filter((r) => r["Status"] === "Cancelled" && !isBlank(r["Request Closed Date"])).length,
      completedWithCancelledDate: rows.filter((r) => r["Status"] === "Completed" && !isBlank(r["Request Cancelled Date"])).length,
      completedWithNoClosedDate: rows.filter((r) => r["Status"] === "Completed" && isBlank(r["Request Closed Date"])).length,
    },
    minCompletedForRanking: MIN_COMPLETED_FOR_RANKING,
    sourceFile: file.name,
  };

  const data: DashboardData = {
    meta,
    departments,
    categories,
    tatMinutesByCategory,
    statuses,
    cptMembers,
    cptTeam,
    cptStartTs,
    cptTenureApprox,
    checkers,
    sites,
    countries,
    cols: {
      caseNo: caseNoCol,
      cat: catCol as number[],
      dept: deptCol,
      status: statusCol as number[],
      cpt: cptCol,
      checker: checkerCol,
      site: siteCol,
      country: countryCol,
      reqTs: reqTs as number[],
      tlApprovedTs,
      assignedTs: assignedTs as number[],
      endTs: endTs as number[],
      cptApprovedTs,
      holdStartTs,
      holdEndTs,
      taskSeconds,
      holdOverlapSeconds,
      actualSeconds,
      tatMinutes,
      slaMet,
    },
  };

  return { data, unrecognizedMembers };
}
