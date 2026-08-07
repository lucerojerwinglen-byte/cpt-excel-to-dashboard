import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useSlaTrend } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import { SLA_TARGET_PCT } from "../../lib/targets";
import { TooltipCard } from "./TooltipCard";
import type { SlaTrendPoint } from "../../data/selectors";

function buildInsight(trend: SlaTrendPoint[]): string {
  const withRate = trend.filter((t) => t.slaPct !== null);
  if (withRate.length < 2) {
    return "Not enough completed cases across multiple periods in the current view to show an SLA trend.";
  }
  const first = withRate[0];
  const last = withRate[withRate.length - 1];
  const delta = last.slaPct! - first.slaPct!;
  const weakest = withRate.reduce((b, t) => (t.slaPct! < b.slaPct! ? t : b), withRate[0]);
  const hitTarget = withRate.filter((t) => t.slaPct! >= SLA_TARGET_PCT).length;
  return `SLA Achievement moved from ${fmtPct(first.slaPct)} to ${fmtPct(last.slaPct)} across this window, a ${delta >= 0 ? "gain" : "drop"} of ${fmtPct(Math.abs(delta))} points, with ${formatBucketLabel(weakest.key)} the weakest period at ${fmtPct(weakest.slaPct)}. ${hitTarget} of ${withRate.length} periods sat at or above the ${SLA_TARGET_PCT}% target.`;
}

export function SlaTrendChart() {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const trend = useSlaTrend(granularity);

  return (
    <ChartCard
      id="card-slatrend"
      title="SLA Achievement Trend"
      subtitle={`Completed cases only · target ${SLA_TARGET_PCT}%`}
      icon={Gauge}
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
        headers: ["Period", "SLA%", "SLA Met", "Completed Cases"],
        rows: trend.map((t) => [formatBucketLabel(t.key), fmtPct(t.slaPct), fmtNum(t.slaMetCount), fmtNum(t.n)]),
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
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0].value as number | null;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{formatBucketLabel(label as string)}</p>
                    <p className="text-brand-green-900/70">{fmtPct(value)}</p>
                  </TooltipCard>
                );
              }}
            />
            <ReferenceLine
              y={SLA_TARGET_PCT}
              stroke="#00493a"
              strokeOpacity={0.45}
              strokeDasharray="5 4"
              label={{
                value: `Target ${SLA_TARGET_PCT}%`,
                position: "insideTopRight",
                fontSize: 11,
                fill: "#00493a",
              }}
            />
            <Line
              type="monotone"
              dataKey="slaPct"
              stroke="#00cba1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
              animationDuration={500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
