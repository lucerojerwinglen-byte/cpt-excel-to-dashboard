import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import type { BreakdownItem } from "../../data/selectors";
import { seriesColor } from "../../lib/palette";
import { fmtNum, fmtPct } from "../../lib/format";
import { useFilters, type Dimension } from "../../state/FilterContext";
import { TooltipCard } from "./TooltipCard";

interface Props {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  insight?: string;
  suggestedAction?: string;
  data: BreakdownItem[];
  dimension: Exclude<Dimension, "status">;
}

export function BreakdownBarChart({ id, title, subtitle, icon, insight, suggestedAction, data, dimension }: Props) {
  const { filters, isolate } = useFilters();
  const activeSet = filters[dimension];
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      id={id}
      title={title}
      subtitle={subtitle}
      icon={icon}
      insight={insight}
      suggestedAction={suggestedAction}
      table={{
        headers: ["Name", "Cases", "% of view"],
        rows: data.map((d) => [d.label, fmtNum(d.count), fmtPct(total > 0 ? (d.count / total) * 100 : null)]),
      }}
    >
      <div style={{ height: Math.max(220, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
          >
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#00493a08" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as BreakdownItem;
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.label}</p>
                    <p className="text-brand-green-900/70">{fmtNum(d.count)} cases</p>
                  </TooltipCard>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 8, 8, 0]}
              animationDuration={500}
              cursor="pointer"
              onClick={(entry) => {
                const item = entry as unknown as BreakdownItem;
                if (item.label !== "Other") isolate(dimension, item.label);
              }}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={d.label === "Other" ? "#00493a33" : seriesColor(i)}
                  opacity={activeSet.size === 0 || activeSet.has(d.label) ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
