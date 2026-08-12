import { useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCheck } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCheckerStats } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct, tenureShort } from "../../lib/format";
import { TooltipCard } from "./TooltipCard";
import { MemberNameTenureTick, MEMBER_TICK_WIDTH } from "./MemberNameTenureTick";
import type { CheckerStatsRow, LocalTeam } from "../../data/selectors";

type TeamToggle = "Both" | LocalTeam;

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
 * not a fair or meaningful "speed" comparison between people.
 *
 * The Both/Philippines/India toggle filters the already-computed approver
 * list by the approver's own team (CHECKER_TEAM) -- same approach
 * teamLeaderboards already uses for "Top Approver", rather than re-scoping
 * the underlying case rows, since which cases an approver signs off on isn't
 * restricted by that approver's own team. Approvers with no team match (the
 * "Unknown" placeholder, or someone who approves without being a
 * case-processing CPT member) only ever show under "Both". */
export function CheckerVolumeChart() {
  const [team, setTeam] = useState<TeamToggle>("Both");
  const allRows = useCheckerStats();
  const rows = team === "Both" ? allRows : allRows.filter((r) => r.team === team);

  const tenureByName = new Map(
    rows.map((r) => [r.name, tenureShort(r.tenureDays, r.tenureApprox)] as const).filter((pair): pair is [string, string] => pair[1] !== null),
  );

  const teamLabel = team === "Both" ? "all teams" : team;

  return (
    <ChartCard
      id="card-checkervolume"
      title="Approver Case Volume"
      subtitle={`Completed cases approved, ranked by volume -- ${teamLabel}`}
      icon={CheckCheck}
      headerExtra={
        <SegmentedToggle
          value={team}
          onChange={setTeam}
          options={[
            { value: "Both", label: "Both" },
            { value: "Philippines", label: "PH" },
            { value: "India", label: "IND" },
          ]}
        />
      }
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
                width={MEMBER_TICK_WIDTH}
                tick={<MemberNameTenureTick tenureByName={tenureByName} />}
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
