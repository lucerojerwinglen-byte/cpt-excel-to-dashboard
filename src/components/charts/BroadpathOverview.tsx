import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CheckCircle2, Gauge, Timer, TrendingUp } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { MiniStatCard } from "../ui/MiniStatCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useFilteredIndices, useKpis, useVolumeAndSlaTrend } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import { SLA_TARGET_PCT } from "../../lib/targets";
import { TONE_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { KpiSummary, VolumeSlaPoint } from "../../data/selectors";

function buildInsight(kpis: KpiSummary, trend: VolumeSlaPoint[]): string {
  if (kpis.totalCases === 0) return "No Broadpath cases in the current view.";
  const withSla = trend.filter((t) => t.slaPct !== null);
  const slaNote = withSla.length ? ` SLA Achievement is currently ${fmtPct(kpis.slaAchievementRate)}.` : "";
  return `${fmtNum(kpis.totalCases)} Broadpath cases (${fmtNum(kpis.completedCases)} completed, ${fmtNum(
    kpis.cancelledCases,
  )} cancelled) in the current view.${slaNote} Figures here are Broadpath's cases only, isolated from the rest of CPT's volume.`;
}

export function BroadpathOverview() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const indices = useFilteredIndices();
  const kpis = useKpis();
  const trend = useVolumeAndSlaTrend(granularity);

  return (
    <ChartCard
      id="card-broadpath"
      title="Broadpath"
      subtitle="Cases raised under the Broadpath subcontractor entity, isolated from Sagility's own volume"
      icon={Building2}
      headerExtra={
        <SegmentedToggle
          value={granularity}
          onChange={setGranularity}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      }
      insight={buildInsight(kpis, trend)}
      table={{
        headers: ["Period", "Total Cases", "Completed", "Cancelled", "SLA%"],
        rows: trend.map((t) => [formatBucketLabel(t.key), fmtNum(t.volume), fmtNum(t.completed), fmtNum(t.cancelled), fmtPct(t.slaPct)]),
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStatCard icon={TrendingUp} label="Total Cases" color={TONE_COLOR.info} value={fmtNum(kpis.totalCases)} sub={`${fmtNum(indices.length)} in view`} />
        <MiniStatCard
          icon={CheckCircle2}
          label="Completion Rate"
          color={TONE_COLOR.good}
          value={fmtPct(kpis.completionRate)}
          sub={`${fmtNum(kpis.completedCases)} completed`}
        />
        <MiniStatCard
          icon={Gauge}
          label="SLA Achievement"
          color={kpis.slaAchievementRate !== null && kpis.slaAchievementRate >= SLA_TARGET_PCT ? TONE_COLOR.good : TONE_COLOR.warning}
          value={fmtPct(kpis.slaAchievementRate)}
          sub={`Target ${SLA_TARGET_PCT}%`}
        />
        <MiniStatCard icon={Timer} label="Avg TAT" color="#531367" value={kpis.avgProcessingMinutes !== null ? `${fmtNum(kpis.avgProcessingMinutes)} min` : "—"} sub="Actual completion time" />
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#00493a14" vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={(v: string) => formatBucketLabel(v)}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis yAxisId="volume" tick={{ fontSize: 12, fill: "#00493a" }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
            <YAxis
              yAxisId="sla"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as VolumeSlaPoint;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{formatBucketLabel(label as string)}</p>
                    <p className="text-brand-green-900/70">Total Cases: {fmtNum(d.volume)}</p>
                    <p className="text-brand-green-900/70">SLA%: {fmtPct(d.slaPct)}</p>
                  </TooltipCard>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine
              yAxisId="sla"
              y={SLA_TARGET_PCT}
              stroke="#00493a"
              strokeOpacity={0.4}
              strokeDasharray="5 4"
              label={{ value: `Target ${SLA_TARGET_PCT}%`, position: "insideBottomRight", fontSize: 11, fill: "#00493a" }}
            />
            <Bar yAxisId="volume" dataKey="volume" name="Total Cases" fill="#0050ff" radius={[6, 6, 0, 0]} animationDuration={500} />
            <Line
              yAxisId="sla"
              type="monotone"
              dataKey="slaPct"
              name="SLA Achievement %"
              stroke="#00cba1"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
              animationDuration={500}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
