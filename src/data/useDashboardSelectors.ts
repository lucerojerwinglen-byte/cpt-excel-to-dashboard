import { useMemo } from "react";
import { useFilters } from "../state/FilterContext";
import { useIsBroadpathScoped } from "../state/BroadpathScopeContext";
import type { Granularity } from "../lib/bucket";
import type { LocalTeam, TimeBasis } from "./selectors";
import {
  breachOutliers,
  broadpathIndices,
  cancellationByDepartment,
  categoryBreakdown,
  categoryPerformance,
  categorySlaTrend,
  checkerStats,
  completionRateTrend,
  completionTimeHeatmap,
  computeKpiDeltas,
  computeKpis,
  computeScorecard,
  countryBreakdown,
  cptDayOfWeek,
  cptMemberCategoryBreakdown,
  cptMemberStats,
  departmentBreakdown,
  getFilteredIndices,
  getFilteredIndicesAnyTeam,
  getFilteredIndicesForTeam,
  memberPeriodProduction,
  processingDurationStats,
  productionTotalsByMember,
  requestTimeHeatmap,
  siteBreakdown,
  slaMix,
  slaTrend,
  statusMix,
  teamLeaderboards,
  tlApprovalTimeHeatmap,
  volumeAndSlaTrend,
} from "./selectors";

/** Row indices matching the active filters. Every chart/KPI derives from
 * this (directly, or via useFilteredIndicesForTeam/useFilteredIndicesAnyTeam
 * below) -- restricting to Broadpath here, when BroadpathScopeProvider is
 * active, is what lets the Broadpath tab reuse every other chart component
 * unmodified. */
export function useFilteredIndices(): number[] {
  const { filters } = useFilters();
  const broadpathOnly = useIsBroadpathScoped();
  return useMemo(() => {
    const indices = getFilteredIndices(filters);
    return broadpathOnly ? broadpathIndices(indices) : indices;
  }, [filters, broadpathOnly]);
}

export function useKpis() {
  const indices = useFilteredIndices();
  return useMemo(() => computeKpis(indices), [indices]);
}

export function useKpiDeltas() {
  const indices = useFilteredIndices();
  return useMemo(() => computeKpiDeltas(indices), [indices]);
}

export function useScorecard() {
  const indices = useFilteredIndices();
  return useMemo(() => computeScorecard(indices), [indices]);
}

export function useVolumeAndSlaTrend(granularity: Granularity) {
  const indices = useFilteredIndices();
  return useMemo(() => volumeAndSlaTrend(indices, granularity), [indices, granularity]);
}

export function useStatusMix() {
  const indices = useFilteredIndices();
  return useMemo(() => statusMix(indices), [indices]);
}

export function useSlaMix() {
  const indices = useFilteredIndices();
  return useMemo(() => slaMix(indices), [indices]);
}

export function useDepartmentBreakdown(topN = 8) {
  const indices = useFilteredIndices();
  return useMemo(() => departmentBreakdown(indices, topN), [indices, topN]);
}

export function useCategoryBreakdown() {
  const indices = useFilteredIndices();
  return useMemo(() => categoryBreakdown(indices), [indices]);
}

export function useSiteBreakdown(topN = 10) {
  const indices = useFilteredIndices();
  return useMemo(() => siteBreakdown(indices, topN), [indices, topN]);
}

export function useCountryBreakdown() {
  const indices = useFilteredIndices();
  return useMemo(() => countryBreakdown(indices), [indices]);
}

export function useCategoryPerformance() {
  const indices = useFilteredIndices();
  return useMemo(() => categoryPerformance(indices), [indices]);
}

export function useCategorySlaTrend(granularity: Granularity) {
  const indices = useFilteredIndices();
  return useMemo(() => categorySlaTrend(indices, granularity), [indices, granularity]);
}

export function useSlaTrend(granularity: Granularity) {
  const indices = useFilteredIndices();
  return useMemo(() => slaTrend(indices, granularity), [indices, granularity]);
}

export function useBreachOutliers(topN = Infinity) {
  const indices = useFilteredIndices();
  return useMemo(() => breachOutliers(indices, topN), [indices, topN]);
}

export function useProcessingDurationStats() {
  const indices = useFilteredIndices();
  return useMemo(() => processingDurationStats(indices), [indices]);
}

export function useCptMemberStats() {
  const indices = useFilteredIndices();
  return useMemo(() => cptMemberStats(indices), [indices]);
}

/** Same contract as useCptMemberStats, but scoped to one explicit team
 * regardless of the sidebar's global Team filter -- used by the Top
 * Performer tab, which always shows both PH and IND side by side. */
export function useCptMemberStatsForTeam(team: LocalTeam) {
  const indices = useFilteredIndicesForTeam(team);
  return useMemo(() => cptMemberStats(indices), [indices]);
}

export function useCptMemberCategoryBreakdown() {
  const indices = useFilteredIndices();
  return useMemo(() => cptMemberCategoryBreakdown(indices), [indices]);
}

export function useCptDayOfWeek(indices: number[], basis: TimeBasis = "PHT") {
  return useMemo(() => cptDayOfWeek(indices, basis), [indices, basis]);
}

export function useCompletionRateTrend(granularity: Granularity) {
  const indices = useFilteredIndices();
  return useMemo(() => completionRateTrend(indices, granularity), [indices, granularity]);
}

export function useCancellationByDepartment() {
  const indices = useFilteredIndices();
  return useMemo(() => cancellationByDepartment(indices), [indices]);
}

export function useCheckerStats() {
  const indices = useFilteredIndices();
  return useMemo(() => checkerStats(indices), [indices]);
}

export function useTeamLeaderboards() {
  const indices = useFilteredIndices();
  return useMemo(() => teamLeaderboards(indices), [indices]);
}

export function useRequestTimeHeatmap(indices: number[], basis: TimeBasis = "PHT") {
  return useMemo(() => requestTimeHeatmap(indices, basis), [indices, basis]);
}

export function useTlApprovalTimeHeatmap(indices: number[], basis: TimeBasis = "PHT") {
  return useMemo(() => tlApprovalTimeHeatmap(indices, basis), [indices, basis]);
}

export function useCompletionTimeHeatmap(indices: number[], basis: TimeBasis = "PHT") {
  return useMemo(() => completionTimeHeatmap(indices, basis), [indices, basis]);
}

/** Indices for a chart with its own local PH/IND toggle -- ignores the
 * sidebar's global Team filter for the team dimension specifically, while
 * still respecting every other active sidebar filter. */
export function useFilteredIndicesForTeam(team: LocalTeam): number[] {
  const { filters } = useFilters();
  const broadpathOnly = useIsBroadpathScoped();
  return useMemo(() => {
    const indices = getFilteredIndicesForTeam(filters, team);
    return broadpathOnly ? broadpathIndices(indices) : indices;
  }, [filters, team, broadpathOnly]);
}

/** Same contract as useFilteredIndicesForTeam, for a local toggle's "Both"
 * state -- every team, still ignoring the sidebar's global Team filter. */
export function useFilteredIndicesAnyTeam(): number[] {
  const { filters } = useFilters();
  const broadpathOnly = useIsBroadpathScoped();
  return useMemo(() => {
    const indices = getFilteredIndicesAnyTeam(filters);
    return broadpathOnly ? broadpathIndices(indices) : indices;
  }, [filters, broadpathOnly]);
}

export function useProductionTotalsByMember() {
  const indices = useFilteredIndices();
  return useMemo(() => productionTotalsByMember(indices), [indices]);
}

export function useMemberPeriodProduction(granularity: Granularity) {
  const indices = useFilteredIndices();
  return useMemo(() => memberPeriodProduction(indices, granularity), [indices, granularity]);
}

/** Single hook for a chart-local Both/Philippines/India toggle, so the
 * component doesn't need to conditionally call two different indices hooks
 * depending on which segment is selected. */
export function useCptTeamToggleIndices(team: "Both" | LocalTeam): number[] {
  const anyTeam = useFilteredIndicesAnyTeam();
  const oneTeam = useFilteredIndicesForTeam(team === "Both" ? "Philippines" : team);
  return team === "Both" ? anyTeam : oneTeam;
}
