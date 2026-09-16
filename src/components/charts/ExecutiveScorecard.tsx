import { ClipboardList } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { ScorecardStrip, type ScorecardCell } from "../ui/ScorecardStrip";
import { TONE_COLOR } from "../../lib/palette";
import { useScorecard } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel } from "../../lib/bucket";
import type { ScorecardData } from "../../data/selectors";

function buildInsight(s: ScorecardData): string {
  if (!s.peakSlaMonth || !s.lowestSlaMonth) return "Not enough complete calendar months in the current view to compute a scorecard.";
  return `${formatBucketLabel(s.peakSlaMonth.key)} was the strongest SLA month at ${fmtPct(s.peakSlaMonth.slaPct)}; ${formatBucketLabel(
    s.lowestSlaMonth.key,
  )} was the weakest at ${fmtPct(s.lowestSlaMonth.slaPct)}. Picks are restricted to complete calendar months so a partial month at either end can't win or lose a cell.`;
}

function cellsFor(s: ScorecardData): ScorecardCell[] {
  return [
    {
      value: s.peakSlaMonth ? fmtPct(s.peakSlaMonth.slaPct) : "—",
      label: "Peak SLA Month",
      sub: s.peakSlaMonth ? formatBucketLabel(s.peakSlaMonth.key) : undefined,
      color: TONE_COLOR.good,
    },
    {
      value: s.lowestSlaMonth ? fmtPct(s.lowestSlaMonth.slaPct) : "—",
      label: "Lowest SLA Month",
      sub: s.lowestSlaMonth ? formatBucketLabel(s.lowestSlaMonth.key) : undefined,
      color: TONE_COLOR.warning,
    },
    {
      value: s.peakVolumeMonth ? fmtNum(s.peakVolumeMonth.volume) : "—",
      label: "Peak Volume Month",
      sub: s.peakVolumeMonth ? formatBucketLabel(s.peakVolumeMonth.key) : undefined,
      color: TONE_COLOR.info,
    },
    {
      value: s.maxTatRecordedMinutes !== null ? fmtNum(s.maxTatRecordedMinutes) : "—",
      label: "Max TAT Recorded",
      sub: "Minutes (outlier)",
      color: "#531367",
    },
    {
      value: fmtNum(s.completedCases),
      label: "Completed Cases",
      sub: s.completedCasesPct !== null ? `${fmtPct(s.completedCasesPct, 1)} of total` : undefined,
      color: "#eda100",
    },
    {
      value: s.bestCptSla ? fmtPct(s.bestCptSla.slaPct) : "—",
      label: "Best CPT SLA",
      sub: s.bestCptSla?.names.join(", "),
      color: "#1e2867",
    },
  ];
}

export function ExecutiveScorecard() {
  const scorecard = useScorecard();

  return (
    <ChartCard
      id="card-scorecard"
      title="Executive Performance Scorecard"
      subtitle="Consolidated metrics for leadership review"
      icon={ClipboardList}
      insight={buildInsight(scorecard)}
      table={{
        headers: ["Metric", "Value", "Period / Note"],
        rows: cellsFor(scorecard).map((c) => [c.label, c.value, c.sub ?? "—"]),
      }}
    >
      <ScorecardStrip cells={cellsFor(scorecard)} />
    </ChartCard>
  );
}
