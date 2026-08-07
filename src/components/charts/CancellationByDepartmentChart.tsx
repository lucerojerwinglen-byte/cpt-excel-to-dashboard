import { Ban } from "lucide-react";
import { RateBarChart } from "./RateBarChart";
import { useCancellationByDepartment } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { RateRow } from "../../data/selectors";

function buildInsight(rows: RateRow[]): string {
  if (!rows.length) return "No cases among the top-15 accounts by volume in the current view.";
  const top = rows[0];
  return `${top.name} has the highest cancellation rate among the top-15 accounts by volume, at ${fmtPct(top.rate)} (${fmtNum(top.numerator)} of ${fmtNum(top.total)} cases).`;
}

/** The authored Suggested Action names "AETNA QC and AETNA Iloilo" specifically
 * -- names whichever department is actually the worst offender in the current
 * filtered view instead. */
function buildSuggestedAction(rows: RateRow[]): string | undefined {
  if (!rows.length) return undefined;
  return `Worth a direct conversation with the ${rows[0].name} account team — understanding why ${fmtPct(rows[0].rate)} of their cases get cancelled could surface a fixable upstream habit.`;
}

export function CancellationByDepartmentChart() {
  const rows = useCancellationByDepartment();
  return (
    <RateBarChart
      id="card-canceldept"
      title="Cancellation Rate by Department"
      subtitle="Top 15 departments by volume"
      icon={Ban}
      insight={buildInsight(rows)}
      suggestedAction={buildSuggestedAction(rows)}
      rows={rows}
      color="#0050ff"
      numeratorLabel="Cancelled"
    />
  );
}
