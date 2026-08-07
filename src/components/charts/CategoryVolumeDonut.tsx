import { BarChart2 } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useCategoryPerformance } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { CategoryPerformanceRow } from "../../data/selectors";

function buildInsight(rows: CategoryPerformanceRow[], total: number): string {
  if (!total) return "No completed cases in the current view.";
  const top = rows[0];
  return `${top.name} makes up ${fmtPct((top.volume / total) * 100)} of completed volume (${fmtNum(top.volume)} of ${fmtNum(total)} cases) -- a ranked bar reads this skew far more clearly than a donut would.`;
}

/** A ranked horizontal bar rather than a donut -- with one category at 84%+
 * of volume and the rest slivers, a donut collapses most categories into
 * unreadable slices. A bar gives every category a comparable, legible length. */
export function CategoryVolumeDonut() {
  const rows = useCategoryPerformance();
  const total = rows.reduce((s, r) => s + r.volume, 0);
  const data = rows.map((r) => ({ label: r.name, count: r.volume }));

  return (
    <BreakdownBarChart
      id="card-catvol"
      title="Volume Distribution"
      subtitle="Completed cases, by category"
      icon={BarChart2}
      insight={buildInsight(rows, total)}
      data={data}
      dimension="cat"
    />
  );
}
