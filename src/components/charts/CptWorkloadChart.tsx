import { Users } from "lucide-react";
import { BreakdownBarChart } from "./BreakdownBarChart";
import { useCptWorkload } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(rows: BreakdownItem[]): string {
  const totalAll = rows.reduce((s, r) => s + r.count, 0);
  if (!totalAll) return "No completed cases in the current view.";
  const top = rows[0];
  const top3 = rows.slice(0, 3).reduce((s, r) => s + r.count, 0);
  let s = `${top.label} completed the most cases (${fmtNum(top.count)}, top 3 account for ${fmtPct((top3 / totalAll) * 100)} of ${fmtNum(rows.length)} active members)`;
  if (rows.length > 4) {
    const bottomHalf = rows.slice(Math.ceil(rows.length / 2));
    const bottomShare = bottomHalf.reduce((s2, r) => s2 + r.count, 0);
    s += ` while the bottom half handles only ${fmtPct((bottomShare / totalAll) * 100)} — some of that gap reflects tenure differences, see the profile cards below for a tenure-normalized view.`;
  } else {
    s += ".";
  }
  return s;
}

export function CptWorkloadChart() {
  const data = useCptWorkload(17);
  return (
    <BreakdownBarChart
      id="card-workload"
      title="CPT Member Workload"
      subtitle="Completed cases, all 17 members"
      icon={Users}
      insight={buildInsight(data)}
      data={data}
      dimension="cpt"
    />
  );
}
