import { useMemo } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useProductionTotalsByMember } from "../../data/useDashboardSelectors";
import { useFilters } from "../../state/FilterContext";
import { fmtNum, fmtPct } from "../../lib/format";
import { TEAM_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { ProductionTotalRow } from "../../data/selectors";

function buildInsight(totals: ProductionTotalRow[]): string {
  if (!totals.length) return "No production volume in the current view.";
  const top = totals[0];
  return `${top.name} has the highest Total Production Count in the current view at ${fmtNum(
    top.totalProduction,
  )} cases (${fmtPct(top.pctOfTeam)} of ${top.team}'s volume). Narrow the sidebar's date range to see a single day or month.`;
}

export function ProductionByMemberTable() {
  const totals = useProductionTotalsByMember();
  const { isolate } = useFilters();

  const tableRows = useMemo(
    () => totals.map((r) => [r.name, r.team, fmtNum(r.totalProduction), fmtPct(r.pctOfTeam)]),
    [totals],
  );

  return (
    <ChartCard
      id="card-production"
      title="Total Production Count by Employee"
      subtitle="Completed + Cancelled cases per employee, for the current filtered view"
      icon={Users}
      insight={buildInsight(totals)}
      table={{ headers: ["Employee", "Team", "Total Production Count", "% of Team"], rows: tableRows }}
    >
      <div style={{ height: Math.max(220, totals.length * 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totals} layout="vertical" margin={{ top: 4, right: 70, left: 0, bottom: 4 }}>
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
                      {d.team} · {fmtNum(d.totalProduction)} total cases
                    </p>
                    <p className="text-brand-green-900/70">{fmtPct(d.pctOfTeam)} of {d.team}'s volume</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar
              dataKey="totalProduction"
              radius={[0, 8, 8, 0]}
              animationDuration={500}
              cursor="pointer"
              onClick={(entry) => {
                const row = entry as unknown as ProductionTotalRow;
                isolate("cpt", row.name);
              }}
            >
              {totals.map((d) => (
                <Cell key={d.name} fill={TEAM_COLOR[d.team] ?? "#0050ff"} />
              ))}
              <LabelList dataKey="totalProduction" formatter={(v: unknown) => fmtNum(Number(v))} position="right" style={{ fontSize: 11, fill: "#00493a" }} />
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
