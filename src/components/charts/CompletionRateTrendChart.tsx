import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCompletionRateTrend } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import { TooltipCard } from "./TooltipCard";
import type { CompletionRateTrendPoint } from "../../data/selectors";

function buildInsight(trend: CompletionRateTrendPoint[]): string {
  const withRate = trend.filter((t) => t.completionRate !== null);
  if (withRate.length < 2) {
    return "Not enough cases across multiple periods in the current view to show a completion-rate trend.";
  }
  const first = withRate[0];
  const last = withRate[withRate.length - 1];
  const delta = last.completionRate! - first.completionRate!;
  const weakest = withRate.reduce((b, t) => (t.completionRate! < b.completionRate! ? t : b), withRate[0]);
  return `Completion rate moved from ${fmtPct(first.completionRate)} to ${fmtPct(last.completionRate)} across this window, a ${delta >= 0 ? "gain" : "drop"} of ${fmtPct(Math.abs(delta))} points, with ${formatBucketLabel(weakest.key)} the weakest period at ${fmtPct(weakest.completionRate)}.`;
}

export function CompletionRateTrendChart() {
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const trend = useCompletionRateTrend(granularity);

  return (
    <ChartCard
      id="card-complrate"
      title="Completion Rate Trend"
      subtitle="Completed ÷ Total Cases (Completed + Cancelled) -- bars show Total Cases per period"
      icon={CheckCircle2}
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
        headers: ["Period", "Completion Rate", "Total Cases"],
        rows: trend.map((t) => [formatBucketLabel(t.key), fmtPct(t.completionRate), t.total]),
      }}
    >
      <div className="h-64">
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
            <YAxis
              yAxisId="cases"
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={44}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
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
                const d = payload[0].payload as CompletionRateTrendPoint;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{formatBucketLabel(label as string)}</p>
                    <p className="text-brand-green-900/70">Total Cases: {fmtNum(d.total)}</p>
                    <p className="text-brand-green-900/70">Completion Rate: {fmtPct(d.completionRate)}</p>
                  </TooltipCard>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="cases" dataKey="total" name="Total Cases" fill="#55aaff" radius={[6, 6, 0, 0]} animationDuration={500} />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="completionRate"
              name="Completion Rate %"
              stroke="#0050ff"
              strokeWidth={2.5}
              dot={false}
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
