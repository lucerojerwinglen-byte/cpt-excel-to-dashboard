import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck2 } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useMemberPeriodProduction } from "../../data/useDashboardSelectors";
import { fmtNum } from "../../lib/format";
import type { Granularity } from "../../lib/bucket";
import { TEAM_COLOR } from "../../lib/palette";
import { TooltipCard } from "./TooltipCard";
import type { MemberPeriodProduction } from "../../data/selectors";

const PERIOD_NOUN: Record<Granularity, string> = { daily: "day", weekly: "week", monthly: "month" };

function buildInsight(rows: MemberPeriodProduction[], noun: string): string {
  if (!rows.length) return "No production volume in the current view.";
  const top = rows[0];
  return `${top.name} averages the most tickets per active ${noun} at ${top.avgPerActivePeriod!.toFixed(1)}, across ${fmtNum(
    top.activePeriods,
  )} active ${noun}${top.activePeriods === 1 ? "" : "s"}.`;
}

export function AvgTicketsPerActivePeriodChart() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const { rows: allRows } = useMemberPeriodProduction(granularity);
  const noun = PERIOD_NOUN[granularity];

  const rows = useMemo(
    () => allRows.filter((r) => r.avgPerActivePeriod !== null).sort((a, b) => b.avgPerActivePeriod! - a.avgPerActivePeriod!),
    [allRows],
  );

  return (
    <ChartCard
      id="card-avgticketspermonth"
      title={`Average tickets per employee, per ${noun} they were active`}
      subtitle={`Ranked highest to lowest. "Active ${noun}" = a ${noun} in which the employee had at least one ticket assigned -- this avoids diluting the average for employees who joined the queue partway through the period.`}
      icon={CalendarCheck2}
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
      insight={buildInsight(rows, noun)}
      table={{
        headers: ["Employee", "Team", `Avg / Active ${noun[0].toUpperCase()}${noun.slice(1)}`, `Active ${noun}s`],
        rows: rows.map((r) => [r.name, r.team, r.avgPerActivePeriod!.toFixed(1), fmtNum(r.activePeriods)]),
      }}
    >
      <div style={{ height: Math.max(220, rows.length * 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 4 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#00493a" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#00493a08" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as MemberPeriodProduction;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.name}</p>
                    <p className="text-brand-green-900/70">
                      {d.avgPerActivePeriod!.toFixed(1)} avg/active {noun} · {fmtNum(d.activePeriods)} active {noun}s
                    </p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="avgPerActivePeriod" radius={[0, 8, 8, 0]} animationDuration={500}>
              {rows.map((r) => (
                <Cell key={r.name} fill={TEAM_COLOR[r.team] ?? "#0050ff"} />
              ))}
              <LabelList dataKey="avgPerActivePeriod" formatter={(v: unknown) => Number(v).toFixed(1)} position="right" style={{ fontSize: 11, fill: "#00493a" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
