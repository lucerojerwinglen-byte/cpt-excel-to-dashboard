import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import type { RateRow } from "../../data/selectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { TooltipCard } from "./TooltipCard";

interface Props {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  insight?: string;
  suggestedAction?: string;
  rows: RateRow[];
  color: string;
  numeratorLabel: string;
}

export function RateBarChart({ id, title, subtitle, icon, insight, suggestedAction, rows, color, numeratorLabel }: Props) {
  const data = rows.map((r) => ({ label: r.name, rate: r.rate ?? 0, numerator: r.numerator, total: r.total }));

  return (
    <ChartCard
      id={id}
      title={title}
      subtitle={subtitle}
      icon={icon}
      insight={insight}
      suggestedAction={suggestedAction}
      table={{
        headers: ["Name", `${numeratorLabel} Rate`, numeratorLabel, "Total"],
        rows: rows.map((r) => [r.name, fmtPct(r.rate), fmtNum(r.numerator), fmtNum(r.total)]),
      }}
    >
      <div style={{ height: Math.max(220, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 4 }}>
            <XAxis type="number" hide />
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
                const d = payload[0].payload as { label: string; rate: number; numerator: number; total: number };
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.label}</p>
                    <p className="text-brand-green-900/70">
                      {fmtPct(d.rate)} {numeratorLabel.toLowerCase()} ({fmtNum(d.numerator)} of {fmtNum(d.total)})
                    </p>
                  </TooltipCard>
                );
              }}
            />
            <Bar dataKey="rate" radius={[0, 8, 8, 0]} fill={color} animationDuration={500}>
              <LabelList
                dataKey="rate"
                position="right"
                formatter={(v: unknown) => fmtPct(typeof v === "number" ? v : null)}
                style={{ fontSize: 11, fill: "#00493a" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
