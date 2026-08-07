import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Gauge } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useSlaMix } from "../../data/useDashboardSelectors";
import { SLA_COLOR } from "../../lib/palette";
import { fmtNum, fmtPct } from "../../lib/format";
import { TooltipCard } from "./TooltipCard";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[]): string {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return "No completed cases in the current view.";
  const met = data.find((d) => d.label === "SLA Met")?.count ?? 0;
  const breached = data.find((d) => d.label === "SLA Breached")?.count ?? 0;
  return `${fmtPct((met / total) * 100)} of ${fmtNum(total)} completed cases met their SLA benchmark; ${fmtNum(breached)} (${fmtPct((breached / total) * 100)}) breached it.`;
}

export function SlaComplianceChart() {
  const data = useSlaMix();
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const metPct = total > 0 ? ((data.find((d) => d.label === "SLA Met")?.count ?? 0) / total) * 100 : null;

  return (
    <ChartCard
      id="card-sladonut"
      title="SLA Compliance"
      subtitle="Completed cases only"
      icon={Gauge}
      insight={buildInsight(data)}
      table={{
        headers: ["Outcome", "Cases", "% of Completed"],
        rows: data.map((d) => [d.label, fmtNum(d.count), fmtPct(total > 0 ? (d.count / total) * 100 : null)]),
      }}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-64 w-full max-w-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as BreakdownItem;
                  return (
                    <TooltipCard>
                      <p className="font-medium text-brand-green-900">{d.label}</p>
                      <p className="text-brand-green-900/70">
                        {fmtNum(d.count)} cases · {fmtPct(total > 0 ? (d.count / total) * 100 : null)}
                      </p>
                    </TooltipCard>
                  );
                }}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={3}
                cornerRadius={6}
                animationDuration={500}
              >
                {data.map((d) => (
                  <Cell key={d.label} fill={SLA_COLOR[d.label] ?? "#00493a"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium tabular-nums text-brand-green-900">{fmtPct(metPct, 1)}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-brand-green-700">SLA Met</span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-1">
          {data.map((d) => (
            <li key={d.label} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: SLA_COLOR[d.label] }} />
              <span className="flex-1 truncate text-sm font-medium text-brand-green-900">{d.label}</span>
              <span className="text-sm font-medium tabular-nums text-brand-green-900">{fmtNum(d.count)}</span>
              <span className="w-14 text-right text-xs tabular-nums text-brand-green-700">
                {fmtPct(total > 0 ? (d.count / total) * 100 : null)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
