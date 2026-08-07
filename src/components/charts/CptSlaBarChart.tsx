import { useState } from "react";
import { Bar, BarChart, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCptMemberStats } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { TONE_COLOR } from "../../lib/palette";
import { SLA_TARGET_PCT } from "../../lib/targets";
import { TooltipCard } from "./TooltipCard";
import type { CptMemberStats } from "../../data/selectors";

const MIN_VOLUME = 10;
const EXCEEDING_PCT = 98;
const AMBER = "#eda100";

const TIERS = [
  { max: SLA_TARGET_PCT, label: "Below target", color: TONE_COLOR.warning },
  { max: EXCEEDING_PCT, label: "On target", color: AMBER },
  { max: Infinity, label: "Exceeding", color: TONE_COLOR.good },
] as const;

function tierFor(slaPct: number) {
  return TIERS.find((t) => slaPct < t.max) ?? TIERS[TIERS.length - 1];
}

type TeamFilter = "both" | "Philippines" | "India";

function buildInsight(rows: CptMemberStats[], teamFilter: TeamFilter): string {
  const eligible = rows.filter((r) => r.totalCompleted >= MIN_VOLUME && r.slaPct !== null);
  if (!eligible.length) return `No CPT member has at least ${MIN_VOLUME} completed cases in the current view.`;
  const ranked = [...eligible].sort((a, b) => (b.slaPct ?? 0) - (a.slaPct ?? 0));
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const scope = teamFilter === "both" ? "" : ` (${teamFilter} team only)`;
  return `${top.name} leads at ${fmtPct(top.slaPct)} SLA Achievement; ${bottom.name} is lowest at ${fmtPct(bottom.slaPct)} among members with at least ${MIN_VOLUME} completed cases${scope}.`;
}

/** Renders each row as a lollipop -- a thin stem plus a dot at the value --
 * instead of a solid bar, so 17 rows read as a calm scatter of marks rather
 * than a wall of equal-weight fills. Colored by performance tier against the
 * benchmark (not team) so under/over-performers pop at a glance. */
function LollipopShape(props: { x?: number; y?: number; width?: number; height?: number; payload?: { slaPct: number } }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const color = payload ? tierFor(payload.slaPct).color : "#00493a";
  const cy = y + height / 2;
  const endX = x + width;
  return (
    <g>
      <line x1={x} y1={cy} x2={endX} y2={cy} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.45} />
      <circle cx={endX} cy={cy} r={5.5} fill={color} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export function CptSlaBarChart() {
  const rows = useCptMemberStats();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("both");

  const scoped = teamFilter === "both" ? rows : rows.filter((r) => r.team === teamFilter);
  const eligible = scoped.filter((r) => r.totalCompleted >= MIN_VOLUME && r.slaPct !== null);
  const ranked = [...eligible].sort((a, b) => (b.slaPct ?? 0) - (a.slaPct ?? 0));
  const data = ranked.map((r) => ({ label: r.name, slaPct: r.slaPct ?? 0, team: r.team, n: r.totalCompleted }));
  const minSlaPct = data.length ? Math.min(...data.map((d) => d.slaPct)) : 0;
  const axisMin = Math.max(0, Math.floor(minSlaPct / 5) * 5 - 5);

  return (
    <ChartCard
      id="card-cptsla"
      title="SLA Achievement — All CPT Members"
      subtitle={`Completed cases only, members with ${MIN_VOLUME}+ completed cases`}
      icon={Award}
      headerExtra={
        <SegmentedToggle
          value={teamFilter}
          onChange={setTeamFilter}
          options={[
            { value: "both", label: "Both" },
            { value: "Philippines", label: "Philippines" },
            { value: "India", label: "India" },
          ]}
        />
      }
      insight={buildInsight(scoped, teamFilter)}
      table={{
        headers: ["Member", "Team", "SLA %", "Completed Cases"],
        rows: ranked.map((r) => [r.name, r.team, fmtPct(r.slaPct), fmtNum(r.totalCompleted)]),
      }}
    >
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-green-700">No members with {MIN_VOLUME}+ completed cases in this team.</p>
      ) : (
        <div style={{ height: Math.max(240, data.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 4 }}>
              <XAxis
                type="number"
                domain={[axisMin, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 11, fill: "#00493a" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                x={SLA_TARGET_PCT}
                stroke="#00493a"
                strokeDasharray="4 4"
                strokeOpacity={0.35}
                label={{ value: `${SLA_TARGET_PCT}% benchmark`, position: "insideTopRight", fontSize: 11, fill: "#00493a", fillOpacity: 0.55 }}
              />
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
                  const d = payload[0].payload as { label: string; slaPct: number; team: string; n: number };
                  const tier = tierFor(d.slaPct);
                  const vsBenchmark = d.slaPct - SLA_TARGET_PCT;
                  return (
                    <TooltipCard>
                      <p className="font-medium text-brand-green-900">{d.label}</p>
                      <p className="text-brand-green-900/70">
                        {d.team} · {fmtPct(d.slaPct)} SLA · {fmtNum(d.n)} completed cases
                      </p>
                      <p className="mt-0.5 font-medium" style={{ color: tier.color }}>
                        {tier.label} · {vsBenchmark >= 0 ? "+" : ""}
                        {vsBenchmark.toFixed(1)}pts vs. benchmark
                      </p>
                    </TooltipCard>
                  );
                }}
              />
              <Bar dataKey="slaPct" shape={LollipopShape} animationDuration={500}>
                <LabelList
                  dataKey="slaPct"
                  position="right"
                  formatter={(v: unknown) => fmtPct(typeof v === "number" ? v : null)}
                  style={{ fontSize: 11, fill: "#00493a" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && (
        <div className="mt-3 flex items-center gap-4 text-xs text-brand-green-700">
          {TIERS.map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} /> {t.label}
            </span>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
