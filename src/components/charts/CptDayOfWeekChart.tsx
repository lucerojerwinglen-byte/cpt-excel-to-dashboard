import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { Heatmap } from "../ui/Heatmap";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCptDayOfWeek, useFilteredIndicesForTeam } from "../../data/useDashboardSelectors";
import { DOW_LABELS_MON_FIRST, TIME_BASIS_LABEL } from "../../data/selectors";
import type { CptDowRow, LocalTeam, TimeBasis } from "../../data/selectors";
import { fmtNum, fmtPct } from "../../lib/format";

function buildInsight(rows: CptDowRow[], team: LocalTeam): string {
  if (!rows.length) return `No completed cases with a valid completion date for the ${team} team in the current view.`;
  const dayAvg = DOW_LABELS_MON_FIRST.map((_, d) => {
    const vals = rows.map((r) => r.pct[d]);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  });
  const bestIdx = dayAvg.reduce((best, v, i) => (v > dayAvg[best] ? i : best), 0);
  return `Across ${fmtNum(rows.length)} active ${team} team members, ${DOW_LABELS_MON_FIRST[bestIdx]} is on average the day each member completes the largest share of their own cases (${fmtPct(dayAvg[bestIdx])}) — a row whose peak differs sharply from this pattern may reflect a fixed schedule worth knowing about.`;
}

export function CptDayOfWeekChart() {
  const [team, setTeam] = useState<LocalTeam>("Philippines");
  const basis: TimeBasis = team === "India" ? "IST" : "PHT";
  const indices = useFilteredIndicesForTeam(team);
  const rows = useCptDayOfWeek(indices, basis);
  const teamRaw = DOW_LABELS_MON_FIRST.map((_, ci) => rows.reduce((s, r) => s + r.raw[ci], 0));
  const teamTotal = teamRaw.reduce((s, v) => s + v, 0);
  const maxTeam = Math.max(1, ...teamRaw);
  const maxPct = Math.max(1, ...rows.flatMap((r) => r.pct));

  const tableRows: (string | number)[][] = [];
  rows.forEach((r) => {
    DOW_LABELS_MON_FIRST.forEach((cl, ci) => {
      tableRows.push([r.name, cl, fmtNum(r.raw[ci]), fmtPct(r.pct[ci])]);
    });
  });
  DOW_LABELS_MON_FIRST.forEach((cl, ci) => {
    tableRows.push([`All ${team}`, cl, fmtNum(teamRaw[ci]), fmtPct(teamTotal ? (teamRaw[ci] / teamTotal) * 100 : 0)]);
  });

  return (
    <ChartCard
      id="card-cptdow"
      title="CPT Activity by Day of Week"
      subtitle={`Row-normalized: % of each member's own completions -- ${team} team, ${TIME_BASIS_LABEL[basis]}`}
      icon={CalendarDays}
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
      insight={buildInsight(rows, team)}
      table={{ headers: ["CPT Member", "Day", "Cases", "% of member total"], rows: tableRows }}
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-52 lg:shrink-0">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-green-700">
            {team} totals by day
          </p>
          <div className="space-y-2">
            {DOW_LABELS_MON_FIRST.map((label, ci) => {
              const v = teamRaw[ci];
              const pct = (v / maxTeam) * 100;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-brand-green-700">{label}</span>
                  <div className="h-5 flex-1 rounded-full bg-brand-green-50">
                    <div
                      className="h-5 rounded-full bg-brand-green-400 transition-[width] duration-300"
                      style={{ width: `${Math.max(v > 0 ? 4 : 0, pct)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-brand-green-900">
                    {fmtNum(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <Heatmap
            rowLabels={rows.map((r) => r.name)}
            colLabels={DOW_LABELS_MON_FIRST}
            matrix={rows.map((r) => r.pct)}
            colorDomainMax={maxPct}
            cellText={(v) => `${v.toFixed(0)}%`}
            tooltip={(rl, cl, v, ri, ci) =>
              `${rl} — ${cl}: ${v.toFixed(1)}% of their completions (${fmtNum(rows[ri].raw[ci])} cases)`
            }
          />
        </div>
      </div>
    </ChartCard>
  );
}
