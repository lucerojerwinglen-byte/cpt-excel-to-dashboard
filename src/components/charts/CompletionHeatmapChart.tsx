import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { Heatmap } from "../ui/Heatmap";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCompletionTimeHeatmap, useFilteredIndicesForTeam } from "../../data/useDashboardSelectors";
import { DOW_LABELS_MON_FIRST, TIME_BASIS_LABEL } from "../../data/selectors";
import type { HeatResult, LocalTeam, TimeBasis } from "../../data/selectors";
import { formatHourLabel, formatHourRange } from "../../lib/bucket";
import { fmtCompactNum, fmtNum } from "../../lib/format";

function buildInsight(result: HeatResult, team: LocalTeam, basis: TimeBasis): string {
  if (!result.total) return `No cases with a valid completion/cancellation timestamp for the ${team} team in the current view.`;
  const label = basis === "IST" ? "India Standard Time" : "Philippine Time";
  return `${team} team's busiest closing hour is ${formatHourRange(result.busiestHourIdx)} ${label} (${fmtNum(result.busiestHourCount)} cases) out of ${fmtNum(result.total)} closed cases in view.`;
}

const COL_LABELS = Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? formatHourLabel(h).replace(":00", "") : ""));

export function CompletionHeatmapChart() {
  const [team, setTeam] = useState<LocalTeam>("Philippines");
  const basis: TimeBasis = team === "India" ? "IST" : "PHT";
  const indices = useFilteredIndicesForTeam(team);
  const result = useCompletionTimeHeatmap(indices, basis);
  const maxV = Math.max(1, ...result.matrix.flat());

  const tableRows: (string | number)[][] = [];
  DOW_LABELS_MON_FIRST.forEach((rl, ri) => {
    for (let h = 0; h < 24; h++) tableRows.push([rl, formatHourRange(h), fmtNum(result.matrix[ri][h])]);
  });

  return (
    <ChartCard
      id="card-compheat"
      title="Completion Time Heatmap"
      subtitle={`When CPT closes out work -- Completed and Cancelled cases, ${team} team, ${TIME_BASIS_LABEL[basis]}`}
      icon={Grid3x3}
      headerExtra={
        <SegmentedToggle
          value={team}
          onChange={setTeam}
          options={[
            { value: "Philippines", label: "PH" },
            { value: "India", label: "IND" },
          ]}
        />
      }
      insight={buildInsight(result, team, basis)}
      table={{ headers: ["Day", "Hour", "Cases"], rows: tableRows }}
    >
      <Heatmap
        rowLabels={DOW_LABELS_MON_FIRST}
        colLabels={COL_LABELS}
        matrix={result.matrix}
        colorDomainMax={maxV}
        cellSize={44}
        fontSize={10}
        cellText={(v) => fmtCompactNum(v)}
        tooltip={(rl, _cl, v, _ri, ci) => `${rl}, ${formatHourRange(ci)}\n${fmtNum(v)} cases`}
      />
    </ChartCard>
  );
}
