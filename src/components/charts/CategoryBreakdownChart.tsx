import { Tags } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useCategoryBreakdown } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[]): string {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return "No cases match the current filters.";
  const top = data[0];
  const topPct = (top.count / total) * 100;
  let s = `${top.label} is the largest case type at ${fmtPct(topPct)} of volume (${fmtNum(top.count)} cases). `;
  s +=
    topPct > 30
      ? `Concentration this heavy makes ${top.label} the highest-leverage target for a template, checklist, or partial automation.`
      : "Volume is fairly spread across case types, so no single type currently dominates process risk.";
  return s;
}

export function CategoryBreakdownChart() {
  const data = useCategoryBreakdown();
  return (
    <BreakdownBarChart
      id="card-category"
      title="Volume by Case Category"
      icon={Tags}
      insight={buildInsight(data)}
      data={data}
      dimension="cat"
    />
  );
}
