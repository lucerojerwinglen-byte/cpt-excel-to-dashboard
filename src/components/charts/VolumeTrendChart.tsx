import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useVolumeAndSlaTrend } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import { TooltipCard } from "./TooltipCard";
import type { VolumeSlaPoint } from "../../data/selectors";

function buildInsight(trend: VolumeSlaPoint[]): string {
  const totalCompleted = trend.reduce((s, p) => s + p.completed, 0);
  const totalCancelled = trend.reduce((s, p) => s + p.cancelled, 0);
  if (!totalCompleted && !totalCancelled) return "No cases match the current filters.";
  let s = `${fmtNum(totalCompleted)} Completed and ${fmtNum(totalCancelled)} Cancelled cases in the current view. `;
  if (trend.length >= 2) {
    const half = Math.ceil(trend.length / 2);
    const firstVol = trend.slice(0, half).reduce((s2, p) => s2 + p.volume, 0);
    const secondVol = trend.slice(half).reduce((s2, p) => s2 + p.volume, 0);
    const trendPct = firstVol > 0 ? ((secondVol - firstVol) / firstVol) * 100 : null;
    if (trendPct !== null && Math.abs(trendPct) > 15) {
      s += `Volume is ${trendPct >= 0 ? "up" : "down"} ${fmtPct(Math.abs(trendPct))} in the second half of this window — worth checking whether CPT capacity is scaling with intake.`;
    }
  }
  return s;
}

export function VolumeTrendChart() {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const trend = useVolumeAndSlaTrend(granularity);

  return (
    <ChartCard
      id="card-volume"
      title="Case Volume Trend"
      subtitle="Completed vs. Cancelled, by Request Raised date"
      icon={TrendingUp}
      headerExtra={
        <SegmentedToggle
          value={granularity}
          onChange={setGranularity}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      }
      insight={buildInsight(trend)}
      table={{
        headers: ["Period", "Completed", "Cancelled", "Total"],
        rows: trend.map((t) => [formatBucketLabel(t.key), fmtNum(t.completed), fmtNum(t.cancelled), fmtNum(t.volume)]),
      }}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={48}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{formatBucketLabel(label as string)}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey as string} className="text-brand-green-900/70">
                        {p.name}: {fmtNum(p.value as number)}
                      </p>
                    ))}
                  </TooltipCard>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#00cba1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="cancelled"
              name="Cancelled"
              stroke="#e96be2"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
