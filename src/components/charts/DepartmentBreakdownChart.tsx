import { Building2 } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useDepartmentBreakdown, useFilteredIndices } from "../../data/useDashboardSelectors";
import { DASHBOARD_DATA } from "../../data/loadData";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[], total: number): string {
  if (!total || !data.length) return "No departments match the current filters.";
  const top = data[0];
  const topPct = (top.count / total) * 100;
  let s = `${top.label} is the largest account by volume (${fmtNum(top.count)} cases, ${fmtPct(topPct)}). `;
  s +=
    topPct > 15
      ? `With one account this dominant, a process change or SLA shift for ${top.label} alone would move dashboard-wide numbers — worth filtering to this account in isolation before drawing conclusions about CPT performance overall.`
      : "Volume is fairly spread across accounts, so no single client relationship is currently a concentration risk.";
  return s;
}

export function DepartmentBreakdownChart() {
  const data = useDepartmentBreakdown(8);
  const total = useFilteredIndices().length;
  return (
    <BreakdownBarChart
      id="card-department"
      title="Volume by Department"
      subtitle={`Top 8 of ${DASHBOARD_DATA.departments.length}`}
      icon={Building2}
      insight={buildInsight(data, total)}
      data={data}
      dimension="dept"
    />
  );
}
