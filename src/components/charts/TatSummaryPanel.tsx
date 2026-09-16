import { useMemo } from "react";
import { Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../ui/ChartCard";
import { MiniStatCard } from "../ui/MiniStatCard";
import { useCategoryPerformance, useKpis } from "../../data/useDashboardSelectors";
import { fmtNum } from "../../lib/format";
import { seriesColor, TONE_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { CategoryPerformanceRow } from "../../data/selectors";

function buildInsight(overallMinutes: number | null, rows: CategoryPerformanceRow[]): string {
  if (!rows.length || overallMinutes === null) return "Not enough completed volume in the current view to compute Avg TAT.";
  const slowest = rows[0];
  return `Avg TAT overall is ${fmtNum(overallMinutes)} minutes across every module. ${slowest.name} is the slowest module at ${fmtNum(
    slowest.avgActualMinutes,
  )} minutes -- actual completion time, not the fixed SLA target.`;
}

/** Actual mean completion time (ActualSeconds/60), the same definition
 * "Avg TAT" already carries in the CPT Performer Dashboard's "Fastest Avg
 * TAT" leaderboard metric -- not the fixed TATInMinutes SLA target. Overall
 * reuses useKpis; per-module reuses useCategoryPerformance rather than
 * re-deriving either. */
export function TatSummaryPanel() {
  const kpis = useKpis();
  const categories = useCategoryPerformance();
  const rows = useMemo(
    () => categories.filter((c) => c.avgActualMinutes !== null).sort((a, b) => b.avgActualMinutes! - a.avgActualMinutes!),
    [categories],
  );

  return (
    <ChartCard
      id="card-tatsummary"
      title="Average TAT"
      subtitle="Actual completion time, overall and by module -- not the fixed SLA target"
      icon={Timer}
      insight={buildInsight(kpis.avgProcessingMinutes, rows)}
      table={{
        headers: ["Module", "Avg TAT (min)"],
        rows: rows.map((r) => [r.name, fmtNum(r.avgActualMinutes)]),
      }}
    >
      <div className="mb-4">
        <MiniStatCard
          icon={Timer}
          label="Avg TAT Overall"
          color={TONE_COLOR.info}
          value={kpis.avgProcessingMinutes !== null ? `${fmtNum(kpis.avgProcessingMinutes)} min` : "—"}
          sub="Across every module, completed cases"
        />
      </div>
      <div style={{ height: Math.max(220, rows.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#00493a14" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#00493a" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#00493a" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#00493a08" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as CategoryPerformanceRow;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.name}</p>
                    <p className="text-brand-green-900/70">{fmtNum(d.avgActualMinutes)} min avg TAT</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="avgActualMinutes" radius={[0, 8, 8, 0]} animationDuration={500}>
              {rows.map((r, i) => (
                <Cell key={r.name} fill={seriesColor(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
