import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useVolumeAndSlaTrend } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import { SLA_TARGET_PCT } from "../../lib/targets";
import { TooltipCard } from "./TooltipCard";
import type { VolumeSlaPoint } from "../../data/selectors";

function buildInsight(trend: VolumeSlaPoint[]): string {
  const withSla = trend.filter((t) => t.slaPct !== null && !t.isPartial);
  if (!withSla.length) return "No completed cases with SLA data in the current view.";
  const totalVolume = trend.reduce((s, p) => s + p.volume, 0);
  const best = withSla.reduce((b, t) => (t.slaPct! > b.slaPct! ? t : b), withSla[0]);
  const worst = withSla.reduce((b, t) => (t.slaPct! < b.slaPct! ? t : b), withSla[0]);
  const hasPartial = trend.some((t) => t.isPartial);
  return `${fmtNum(totalVolume)} total cases across this window. SLA Achievement peaked at ${fmtPct(best.slaPct)} in ${formatBucketLabel(
    best.key,
  )} and dipped lowest to ${fmtPct(worst.slaPct)} in ${formatBucketLabel(worst.key)}.${
    hasPartial ? " Faded bars are partial calendar months, excluded from these peak/lowest picks." : ""
  }`;
}

export function MonthlyVolumeSlaChart() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const trend = useVolumeAndSlaTrend(granularity);

  return (
    <ChartCard
      id="card-volsla"
      title="Monthly Volume & SLA Achievement Trend"
      subtitle={`Total case volume vs. SLA Achievement Rate (Completed cases), by Task Start date · target ${SLA_TARGET_PCT}%`}
      icon={TrendingUp}
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
      insight={buildInsight(trend)}
      table={{
        headers: ["Period", "Volume", "Completed", "Cancelled", "SLA%", "Partial month"],
        rows: trend.map((t) => [
          formatBucketLabel(t.key),
          fmtNum(t.volume),
          fmtNum(t.completed),
          fmtNum(t.cancelled),
          fmtPct(t.slaPct),
          t.isPartial ? "Yes" : "No",
        ]),
      }}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#55aaff" />
                <stop offset="100%" stopColor="#0050ff" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#00493a14" vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={(v: string) => formatBucketLabel(v)}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              yAxisId="volume"
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={48}
              allowDecimals={false}
            />
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
                    <p className="font-medium text-brand-green-900">
                      {formatBucketLabel(label as string)}
                      {d.isPartial ? " (partial)" : ""}
                    </p>
                    <p className="text-brand-green-900/70">Volume: {fmtNum(d.volume)}</p>
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
            <Bar yAxisId="volume" dataKey="volume" name="Total Volume" fill="#0050ff" radius={[6, 6, 0, 0]} animationDuration={500}>
              {trend.map((d) => (
                <Cell key={d.key} fill="url(#volumeBarGradient)" opacity={d.isPartial ? 0.35 : 1} />
              ))}
            </Bar>
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
