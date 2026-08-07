import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useCptMemberStats } from "../../data/useDashboardSelectors";
import { fmtNum } from "../../lib/format";
import { TEAM_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { CptMemberStats } from "../../data/selectors";

function buildInsight(rows: CptMemberStats[]): string {
  const withData = rows.filter((r) => r.totalCompleted > 0);
  if (!withData.length) return "No completed cases in the current view.";
  const highestVolume = withData.reduce((b, r) => (r.totalCompleted > b.totalCompleted ? r : b), withData[0]);
  const fastest = withData.reduce((b, r) => ((r.avgActualMinutes ?? Infinity) < (b.avgActualMinutes ?? Infinity) ? r : b), withData[0]);
  return `${highestVolume.name} has the highest completed volume (${fmtNum(highestVolume.totalCompleted)}); ${fastest.name} has the fastest average processing time (${fastest.avgActualMinutes !== null ? `${fmtNum(fastest.avgActualMinutes)} min` : "—"}) — not necessarily the same person.`;
}

interface Row {
  label: string;
  volume: number;
  avgMinutes: number | null;
  team: string;
}

/** Custom LabelList renderer -- shows both volume AND average minutes per
 * bar, since a single dataKey formatter can't see the sibling field. Recharts
 * passes x/y/width/height as string|number, so they're normalized here. */
function VolumeAndTatLabel(props: {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  index?: number;
  data: Row[];
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const row = props.data[props.index ?? 0];
  if (!row) return null;
  return (
    <text x={x + width + 8} y={y + height / 2} dy={4} fontSize={11} fill="#00493a">
      {fmtNum(row.volume)} cases{row.avgMinutes !== null ? ` · ${fmtNum(row.avgMinutes)}m avg` : ""}
    </text>
  );
}

/** Horizontal, ranked-by-volume layout -- readable regardless of team size,
 * unlike a vertical bar chart with 17 rotated member-name labels. */
export function CptVolumeVsTatChart() {
  const rows = useCptMemberStats();
  const data: Row[] = rows
    .filter((r) => r.totalCompleted > 0)
    .sort((a, b) => b.totalCompleted - a.totalCompleted)
    .map((r) => ({ label: r.name, volume: r.totalCompleted, avgMinutes: r.avgActualMinutes, team: r.team }));

  return (
    <ChartCard
      id="card-cptvoltat"
      title="Volume vs. Average Processing Time"
      subtitle="Completed cases only, ranked by volume -- all 17 members"
      icon={Activity}
      insight={buildInsight(rows)}
      table={{
        headers: ["Member", "Team", "Completed Cases", "Average Actual Minutes"],
        rows: data.map((d) => [d.label, d.team, fmtNum(d.volume), d.avgMinutes !== null ? fmtNum(d.avgMinutes) : "—"]),
      }}
    >
      <div style={{ height: Math.max(280, data.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 110, left: 0, bottom: 4 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={170}
              tick={{ fontSize: 11, fill: "#00493a" }}
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
                      {d.team} · {fmtNum(d.volume)} completed{d.avgMinutes !== null ? ` · ${fmtNum(d.avgMinutes)} min avg` : ""}
                    </p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="volume" radius={[0, 8, 8, 0]} animationDuration={500}>
              {data.map((d) => (
                <Cell key={d.label} fill={TEAM_COLOR[d.team] ?? "#0050ff"} />
              ))}
              <LabelList dataKey="volume" content={(props) => <VolumeAndTatLabel {...props} data={data} />} />
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
