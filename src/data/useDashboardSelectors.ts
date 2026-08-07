import { useMemo } from "react";
import { useFilters } from "../state/FilterContext";
import type { Granularity } from "../lib/bucket";
import type { LocalTeam, TimeBasis } from "./selectors";
import {
  breachDrivers,
  breachOutliers,
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
  cptWorkload,
  departmentBreakdown,
  getFilteredIndices,
  getFilteredIndicesForTeam,
  processingDurationStats,
  requestTimeHeatmap,
  siteBreakdown,
  slaMix,
  slaTrend,
  statusMix,
  teamLeaderboards,
  tlApprovalTimeHeatmap,
  volumeAndSlaTrend,
} from "./selectors";

/** Row indices matching the active filters. Every chart/KPI derives from this. */
export function useFilteredIndices(): number[] {
  const { filters } = useFilters();
  return useMemo(() => getFilteredIndices(filters), [filters]);
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

export function useCptWorkload(topN = 17) {
  const indices = useFilteredIndices();
  return useMemo(() => cptWorkload(indices, topN), [indices, topN]);
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

export function useBreachDrivers() {
  const indices = useFilteredIndices();
  return useMemo(() => breachDrivers(indices), [indices]);
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
  return useMemo(() => getFilteredIndicesForTeam(filters, team), [filters, team]);
}
