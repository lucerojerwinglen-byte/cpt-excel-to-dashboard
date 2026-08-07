import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartPie } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useFilteredIndices, useStatusMix } from "../../data/useDashboardSelectors";
import { STATUS_COLOR } from "../../lib/palette";
import { fmtNum, fmtPct } from "../../lib/format";
import { useFilters } from "../../state/FilterContext";
import { TooltipCard } from "./TooltipCard";
import type { BreakdownItem } from "../../data/selectors";

function buildInsight(data: BreakdownItem[], total: number): string {
  if (!total) return "No cases match the current filters.";
  const byLabel = Object.fromEntries(data.map((d) => [d.label, d.count]));
  const completed = byLabel["Completed"] ?? 0;
  const cancelled = byLabel["Cancelled"] ?? 0;
  return `${fmtPct((completed / total) * 100)} of ${fmtNum(total)} cases were Completed, ${fmtPct((cancelled / total) * 100)} Cancelled — every case in this data source resolves to one of these two outcomes.`;
}

export function StatusMixChart() {
  const data = useStatusMix();
  const indices = useFilteredIndices();
  const { filters, isolate } = useFilters();
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const ranked = [...data].sort((a, b) => b.count - a.count);

  return (
    <ChartCard
      id="card-status"
      title="Case Status Mix"
      icon={ChartPie}
      insight={buildInsight(data, indices.length)}
      table={{
        headers: ["Status", "Cases", "% of view"],
        rows: ranked.map((d) => [d.label, fmtNum(d.count), fmtPct(total > 0 ? (d.count / total) * 100 : null)]),
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
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as BreakdownItem;
                  isolate("status", item.label);
                }}
              >
                {data.map((d) => (
                  <Cell
                    key={d.label}
                    fill={STATUS_COLOR[d.label] ?? "#00493a"}
                    opacity={filters.status.size === 0 || filters.status.has(d.label) ? 1 : 0.25}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium tabular-nums text-brand-green-900">{fmtNum(total)}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-brand-green-700">
              Total Cases
            </span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-1">
          {ranked.map((d) => {
            const isDimmed = filters.status.size > 0 && !filters.status.has(d.label);
            return (
              <li key={d.label}>
                <button
                  type="button"
                  onClick={() => isolate("status", d.label)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-brand-green-50"
                  style={{ opacity: isDimmed ? 0.4 : 1 }}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: STATUS_COLOR[d.label] }}
                  />
                  <span className="flex-1 truncate text-sm font-medium text-brand-green-900">{d.label}</span>
                  <span className="text-sm font-medium tabular-nums text-brand-green-900">{fmtNum(d.count)}</span>
                  <span className="w-14 text-right text-xs tabular-nums text-brand-green-700">
                    {fmtPct(total > 0 ? (d.count / total) * 100 : null)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}
