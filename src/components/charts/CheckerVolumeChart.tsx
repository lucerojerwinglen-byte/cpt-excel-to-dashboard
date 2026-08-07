import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCheck } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useCheckerStats } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { TooltipCard } from "./TooltipCard";
import type { CheckerStatsRow } from "../../data/selectors";

function buildInsight(rows: CheckerStatsRow[]): string {
  if (!rows.length) return "No approved completed cases in the current view.";
  const top = rows[0]; // checkerStats is already sorted by volume descending
  const total = rows.reduce((s, r) => s + r.volumeChecked, 0);
  const share = total > 0 ? (top.volumeChecked / total) * 100 : 0;
  return `${top.name} has approved the most completed cases (${fmtNum(top.volumeChecked)}, ${fmtPct(
    share,
    0,
  )} of all approved volume in view) among ${fmtNum(rows.length)} active approvers.`;
}

/** Volume only, ranked -- "who checks the most" is well-supported by this
 * data (checkerStats is already sorted by volume). A "fastest checker"
 * companion metric was considered and dropped: the checker's own sign-off
 * timestamp lands ~1-2 minutes before case closure in 99.9% of rows, which
 * reads as system/workflow latency rather than real review-time variation --
 * not a fair or meaningful "speed" comparison between people. */
export function CheckerVolumeChart() {
  const rows = useCheckerStats();

  return (
    <ChartCard
      id="card-checkervolume"
      title="Approver Case Volume"
      subtitle="Completed cases approved, ranked by volume -- who's carrying the most approval workload"
      icon={CheckCheck}
      insight={buildInsight(rows)}
      table={{
        headers: ["Approver", "Cases Approved", "% of Approved Volume"],
        rows: rows.map((r) => {
          const total = rows.reduce((s, x) => s + x.volumeChecked, 0);
          return [r.name, fmtNum(r.volumeChecked), fmtPct(total > 0 ? (r.volumeChecked / total) * 100 : null)];
        }),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-green-700">No approved completed cases in the current view.</p>
      ) : (
        <div style={{ height: Math.max(220, rows.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 4 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={170}
                tick={{ fontSize: 11, fill: "#00493a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#00493a08" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as CheckerStatsRow;
                  return (
                    <TooltipCard>
                      <p className="font-medium text-brand-green-900">{d.name}</p>
                      <p className="text-brand-green-900/70">{fmtNum(d.volumeChecked)} cases approved</p>
                    </TooltipCard>
                  );
                }}
              />
              <Bar dataKey="volumeChecked" fill="#0050ff" radius={[0, 8, 8, 0]} animationDuration={500}>
                <LabelList dataKey="volumeChecked" position="right" formatter={(v) => `${fmtNum(Number(v))} cases`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
