import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ScatterChart as ScatterChartIcon } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useCategoryPerformance } from "../../data/useDashboardSelectors";
import { seriesColor } from "../../lib/palette";
import { fmtNum, fmtPct } from "../../lib/format";
import { SLA_TARGET_PCT } from "../../lib/targets";
import { TooltipCard } from "./TooltipCard";
import type { CategoryPerformanceRow } from "../../data/selectors";

function buildInsight(rows: CategoryPerformanceRow[]): string {
  if (!rows.length) return "No completed cases in the current view.";
  const ranked = [...rows].sort((a, b) => (b.slaPct ?? 0) - (a.slaPct ?? 0));
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const atRisk = rows.filter((r) => r.volume >= 100 && (r.slaPct ?? 100) < SLA_TARGET_PCT);
  const riskNote = atRisk.length
    ? ` ${atRisk.map((r) => r.name).join(", ")} combine real volume with sub-${SLA_TARGET_PCT}% SLA -- the highest-leverage fix target.`
    : ` No high-volume category currently sits below the ${SLA_TARGET_PCT}% benchmark.`;
  return `${top.name} leads on SLA Achievement at ${fmtPct(top.slaPct)}; ${bottom.name} trails at ${fmtPct(bottom.slaPct)}.${riskNote}`;
}

/** Volume x SLA% scatter, one bubble per category -- answers a question the
 * ranked bar (and the Category Matrix table above it) can't at a glance:
 * which categories are BOTH high-volume AND below benchmark, vs. which
 * below-benchmark categories are low-stakes because they're low-volume. */
/** Alternates label position above/below its point (by index parity) so
 * neighboring bubbles' name labels don't stack on top of each other when
 * volumes are close together even after the log-scale X axis spreads them out. */
function CategoryLabel(props: { x?: string | number; y?: string | number; index?: number; data: { label: string }[] }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const index = props.index ?? 0;
  const row = props.data[index];
  if (!row) return null;
  const above = index % 2 === 0;
  return (
    <text x={x} y={above ? y - 12 : y + 20} textAnchor="middle" fontSize={10.5} fontWeight={500} fill="#00493a">
      {row.label}
    </text>
  );
}

export function CategorySlaBarChart() {
  const rows = useCategoryPerformance();
  const data = rows.map((r) => ({ label: r.name, volume: r.volume, slaPct: r.slaPct ?? 0 }));
  const maxVolume = Math.max(1, ...data.map((d) => d.volume));
  const minVolume = Math.max(1, Math.min(...data.map((d) => d.volume)));

  return (
    <ChartCard
      id="card-catsla"
      title="SLA % by Category"
      subtitle="Volume vs. SLA Achievement, completed cases only -- bubble size scales with volume"
      icon={ScatterChartIcon}
      insight={buildInsight(rows)}
      table={{
        headers: ["Category", "Volume", "SLA %"],
        rows: [...rows]
          .sort((a, b) => (b.slaPct ?? 0) - (a.slaPct ?? 0))
          .map((r) => [r.name, fmtNum(r.volume), fmtPct(r.slaPct)]),
      }}
    >
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 28, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#00493a14" />
            <XAxis
              type="number"
              dataKey="volume"
              name="Volume"
              scale="log"
              domain={[minVolume * 0.7, maxVolume * 1.3]}
              allowDataOverflow
              tickFormatter={(v: number) => fmtNum(v)}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Volume (completed cases, log scale)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#00493a" }}
            />
            <YAxis
              type="number"
              dataKey="slaPct"
              name="SLA %"
              domain={[Math.min(80, ...data.map((d) => d.slaPct)) - 2, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 12, fill: "#00493a" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ZAxis type="number" dataKey="volume" domain={[0, maxVolume]} range={[120, 1400]} />
            <ReferenceLine
              y={SLA_TARGET_PCT}
              stroke="#c82ebf"
              strokeDasharray="5 4"
              strokeOpacity={0.6}
              label={{ value: `${SLA_TARGET_PCT}% benchmark`, position: "insideTopRight", fontSize: 11, fill: "#c82ebf" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { label: string; volume: number; slaPct: number };
                return (
                  <TooltipCard>
                    <p className="font-medium text-brand-green-900">{d.label}</p>
                    <p className="text-brand-green-900/70">
                      {fmtNum(d.volume)} cases · {fmtPct(d.slaPct)} SLA
                    </p>
                  </TooltipCard>
                );
              }}
            />
            <Scatter data={data} animationDuration={500}>
              {data.map((d, i) => (
                <Cell key={d.label} fill={seriesColor(i)} fillOpacity={0.75} stroke={seriesColor(i)} strokeWidth={1.5} />
              ))}
              <LabelList dataKey="label" content={(props) => <CategoryLabel {...props} data={data} />} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
