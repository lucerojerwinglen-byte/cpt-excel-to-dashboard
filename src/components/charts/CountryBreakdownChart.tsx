import { Globe2 } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useCountryBreakdown, useFilteredIndices } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[], total: number): string {
  if (!total || !data.length) return "No cases match the current filters.";
  const top = data[0];
  const topPct = (top.count / total) * 100;
  const others = data.filter((d) => d.label !== top.label).reduce((s, d) => s + d.count, 0);
  return `${top.label} accounts for ${fmtPct(topPct)} of volume (${fmtNum(top.count)} cases); the other ${data.length - 1} countries together make up ${fmtNum(others)} cases (${fmtPct(total > 0 ? (others / total) * 100 : null)}).`;
}

export function CountryBreakdownChart() {
  const data = useCountryBreakdown();
  const total = useFilteredIndices().length;
  return (
    <BreakdownBarChart
      id="card-country"
      title="Volume by Country"
      subtitle="Requesting site's country"
      icon={Globe2}
      insight={buildInsight(data, total)}
      data={data}
      dimension="country"
    />
  );
}
