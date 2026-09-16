import { useMemo } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useProductionTotalsByMember } from "../../data/useDashboardSelectors";
import { fmtNum } from "../../lib/format";
import { TEAM_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { ProductionTotalRow } from "../../data/selectors";

function hrs(mins: number): string {
  return `${(mins / 60).toFixed(1)} hrs`;
}

function buildInsight(rows: ProductionTotalRow[]): string {
  if (!rows.length) return "No production volume in the current view.";
  const top = rows[0];
  return `${top.name} has the most Total Time Production in the current view at ${fmtNum(top.totalTimeMinutes)} minutes (${hrs(
    top.totalTimeMinutes,
  )}) of actual working time across ${fmtNum(top.totalProduction)} cases.`;
}

export function TotalTimeProductionChart() {
  const totals = useProductionTotalsByMember();
  const rows = useMemo(() => [...totals].sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes), [totals]);

  return (
    <ChartCard
      id="card-totaltimeproduction"
      title="Total Time Production by Employee"
      subtitle="Sum of actual working time (ActualSeconds), converted to minutes -- Completed + Cancelled cases"
      icon={Clock}
      insight={buildInsight(rows)}
      table={{
        headers: ["Employee", "Team", "Total Time Production (min)", "Total Time Production (hrs)"],
        rows: rows.map((r) => [r.name, r.team, fmtNum(r.totalTimeMinutes), (r.totalTimeMinutes / 60).toFixed(1)]),
      }}
    >
      <div style={{ height: Math.max(220, rows.length * 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 80, left: 0, bottom: 4 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#00493a" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#00493a08" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ProductionTotalRow;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.name}</p>
                    <p className="text-brand-green-900/70">
                      {fmtNum(d.totalTimeMinutes)} min ({hrs(d.totalTimeMinutes)})
                    </p>
                    <p className="text-brand-green-900/70">{fmtNum(d.totalProduction)} cases</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="totalTimeMinutes" radius={[0, 8, 8, 0]} animationDuration={500}>
              {rows.map((r) => (
                <Cell key={r.name} fill={TEAM_COLOR[r.team] ?? "#0050ff"} />
              ))}
              <LabelList
                dataKey="totalTimeMinutes"
                formatter={(v: unknown) => `${fmtNum(Number(v))} min`}
                position="right"
                style={{ fontSize: 11, fill: "#00493a" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-center gap-4 text-xs text-brand-green-700">
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
