import { MapPin } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useSiteBreakdown, useFilteredIndices } from "../../data/useDashboardSelectors";
import { DASHBOARD_DATA } from "../../data/loadData";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[], total: number): string {
  if (!total || !data.length) return "No sites match the current filters.";
  const top = data[0];
  const topPct = (top.count / total) * 100;
  return `${top.label} is the largest site by volume (${fmtNum(top.count)} cases, ${fmtPct(topPct)}) among ${DASHBOARD_DATA.sites.length} delivery-center sites.`;
}

export function SiteBreakdownChart() {
  const data = useSiteBreakdown(10);
  const total = useFilteredIndices().length;

  return (
    <BreakdownBarChart
      id="card-site"
      title="Volume by Site"
      subtitle={`${DASHBOARD_DATA.sites.length} delivery-center sites`}
      icon={MapPin}
      insight={buildInsight(data, total)}
      data={data}
      dimension="site"
    />
  );
}
