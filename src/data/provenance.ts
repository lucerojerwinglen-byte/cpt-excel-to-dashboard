import type { DashboardData } from "./types";

/**
 * Describes the DATASET, not the current filtered view -- deliberately not a
 * selector over useFilteredIndices(). Provenance numbers are meant to build
 * credibility ("here's my work"); if they moved every time someone applied a
 * filter, that would be backwards.
 */
export interface DatasetProvenance {
  totalRows: number;
  coverageStartMs: number;
  coverageEndMs: number;
  generatedAtMs: number;
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
  siteCount: number;
  departmentCount: number;
  cptMemberCount: number;
  minCompletedForRanking: number;
  sourceFile: string;
}

function computeProvenance(data: DashboardData): DatasetProvenance {
  const { meta, sites, departments, cptMembers } = data;
  return {
    totalRows: meta.totalRows,
    coverageStartMs: meta.dateRange.min,
    coverageEndMs: meta.dateRange.max,
    generatedAtMs: Date.parse(meta.generatedAt + "Z"),
    partialMonths: meta.partialMonths,
    statusCounts: meta.statusCounts,
    slaCounts: meta.slaCounts,
    reconciliation: meta.reconciliation,
    holdStats: meta.holdStats,
    blanks: meta.blanks,
    edgeCases: meta.edgeCases,
    siteCount: sites.length,
    departmentCount: departments.length,
    cptMemberCount: cptMembers.length,
    minCompletedForRanking: meta.minCompletedForRanking,
    sourceFile: meta.sourceFile,
  };
}

// Populated by setProvenanceData() -- called from loadData.ts's
// setDashboardData(), once per upload, before the dashboard UI mounts.
export let PROVENANCE: DatasetProvenance = {
  totalRows: 0,
  coverageStartMs: 0,
  coverageEndMs: 0,
  generatedAtMs: 0,
  partialMonths: [],
  statusCounts: { Completed: 0, Cancelled: 0 },
  slaCounts: { "SLA Met": 0, "SLA Breached": 0 },
  reconciliation: { mismatches: 0, matchRatePct: 0 },
  holdStats: { rowsWithHold: 0, rowsWithOverlap: 0 },
  blanks: { site: 0, city: 0, department: 0, country: 0, companyName: 0, approvedDateByTL: 0 },
  edgeCases: { cancelledWithClosedDate: 0, completedWithCancelledDate: 0, completedWithNoClosedDate: 0 },
  siteCount: 0,
  departmentCount: 0,
  cptMemberCount: 0,
  minCompletedForRanking: 0,
  sourceFile: "",
};

export function setProvenanceData(data: DashboardData): void {
  PROVENANCE = computeProvenance(data);
}
