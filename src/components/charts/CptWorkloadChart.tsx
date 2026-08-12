import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCptTeamToggleIndices } from "../../data/useDashboardSelectors";
import { cptMemberStats } from "../../data/selectors";
import { useFilters } from "../../state/FilterContext";
import { fmtNum, fmtPct, tenureLabel, tenureShort } from "../../lib/format";
import { TEAM_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import { MemberNameTenureTick, MEMBER_TICK_WIDTH } from "./MemberNameTenureTick";
import type { CptMemberStats, LocalTeam } from "../../data/selectors";

type TeamToggle = "Both" | LocalTeam;

interface Row {
  label: string;
  volume: number;
  team: string;
}

function buildInsight(rows: CptMemberStats[]): string {
  const withData = rows.filter((r) => r.totalCompleted > 0).sort((a, b) => b.totalCompleted - a.totalCompleted);
  const totalAll = withData.reduce((s, r) => s + r.totalCompleted, 0);
  if (!totalAll) return "No completed cases in the current view.";
  const top = withData[0];
  const top3 = withData.slice(0, 3).reduce((s, r) => s + r.totalCompleted, 0);
  let s = `${top.name} completed the most cases (${fmtNum(top.totalCompleted)}, top 3 account for ${fmtPct((top3 / totalAll) * 100)} of ${fmtNum(withData.length)} active members)`;
  if (withData.length > 4) {
    const bottomHalf = withData.slice(Math.ceil(withData.length / 2));
    const bottomShare = bottomHalf.reduce((s2, r) => s2 + r.totalCompleted, 0);
    s += ` while the bottom half handles only ${fmtPct((bottomShare / totalAll) * 100)} of the volume -- tenure (shown next to each name) explains some but not all of that gap.`;
  } else {
    s += ".";
  }
  return s;
}

/** Custom LabelList renderer -- volume count at the end of each bar. */
function VolumeLabel(props: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; index?: number; data: Row[] }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const row = props.data[props.index ?? 0];
  if (!row) return null;
  return (
    <text x={x + width + 8} y={y + height / 2} dy={4} fontSize={11} fill="#00493a">
      {fmtNum(row.volume)} cases
    </text>
  );
}

/** Bespoke rather than the shared BreakdownBarChart (used by 8+ unrelated
 * breakdown charts) so this chart's team toggle and tenure pill stay
 * localized here instead of leaking into every other BreakdownBarChart
 * consumer. Same Both/Philippines/India local toggle contract as
 * CptVolumeVsTatChart -- see CONTEXT.md's "Local Team Toggle" entry. */
export function CptWorkloadChart() {
  const [team, setTeam] = useState<TeamToggle>("Both");
  const indices = useCptTeamToggleIndices(team);
  const stats = useMemo(() => cptMemberStats(indices), [indices]);
  const { isolate } = useFilters();

  const data: Row[] = stats
    .filter((r) => r.totalCompleted > 0)
    .sort((a, b) => b.totalCompleted - a.totalCompleted)
    .map((r) => ({ label: r.name, volume: r.totalCompleted, team: r.team }));

  const tenureByName = new Map(
    stats.map((r) => [r.name, tenureShort(r.tenureDays, r.tenureApprox)] as const).filter((pair): pair is [string, string] => pair[1] !== null),
  );

  const teamLabel = team === "Both" ? "all teams" : team;

  return (
    <ChartCard
      id="card-workload"
      title="CPT Member Workload"
      subtitle={`Completed cases, ranked -- ${teamLabel}`}
      icon={Users}
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
      insight={buildInsight(stats)}
      table={{
        headers: ["Member", "Team", "Completed Cases", "Tenure"],
        rows: data.map((d) => {
          const m = stats.find((r) => r.name === d.label);
          return [d.label, d.team, fmtNum(d.volume), m ? tenureLabel(m.startTs, m.tenureDays, m.tenureApprox) : "—"];
        }),
      }}
    >
      <div style={{ height: Math.max(220, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 90, left: 0, bottom: 4 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={MEMBER_TICK_WIDTH}
              tick={<MemberNameTenureTick tenureByName={tenureByName} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#00493a08" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Row;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.label}</p>
                    <p className="text-brand-green-900/70">
                      {d.team} · {fmtNum(d.volume)} completed
                    </p>
                  </TooltipCard>
                );
              }}
            />
            <Bar
              dataKey="volume"
              radius={[0, 8, 8, 0]}
              animationDuration={500}
              cursor="pointer"
              onClick={(entry) => {
                const row = entry as unknown as Row;
                isolate("cpt", row.label);
              }}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={TEAM_COLOR[d.team] ?? "#0050ff"} />
              ))}
              <LabelList dataKey="volume" content={(props) => <VolumeLabel {...props} data={data} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-brand-green-700">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAM_COLOR.Philippines }} /> Philippines
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAM_COLOR.India }} /> India
        </span>
      </div>
    </ChartCard>
  );
}
