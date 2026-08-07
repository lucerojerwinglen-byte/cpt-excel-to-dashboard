import { Grid2x2 } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { Pill, type PillTone } from "../ui/Pill";
import { ProgressBar } from "../ui/ProgressBar";
import { useCategoryPerformance } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { seriesColor } from "../../lib/palette";
import type { CategoryPerformanceRow } from "../../data/selectors";

function buildInsight(rows: CategoryPerformanceRow[]): string {
  if (!rows.length) return "No completed cases in the current view.";
  const worst = rows.reduce((b, r) => ((r.slaPct ?? 100) < (b.slaPct ?? 100) ? r : b), rows[0]);
  const best = rows.reduce((b, r) => ((r.slaPct ?? 0) > (b.slaPct ?? 0) ? r : b), rows[0]);
  return `${best.name} has the strongest SLA Achievement at ${fmtPct(best.slaPct)}; ${worst.name} is weakest at ${fmtPct(worst.slaPct)} across ${fmtNum(worst.volume)} completed cases.`;
}

function statusFor(row: CategoryPerformanceRow): { label: string; tone: PillTone } {
  const pct = row.slaPct ?? 0;
  if (pct >= 99.5) return { label: "Outstanding", tone: "blue" };
  if (pct >= 97) return { label: "Excellent", tone: "green" };
  if (pct >= 90) return { label: "Monitor", tone: "amber" };
  return { label: "Focus", tone: "pink" };
}

export function CategoryPerformanceMatrix() {
  const rows = useCategoryPerformance();
  const maxSla = Math.max(1, ...rows.map((r) => r.slaPct ?? 0));

  return (
    <ChartCard
      id="card-catmatrix"
      title="Category Performance Matrix"
      subtitle="Volume · SLA Achievement · Avg TAT vs SLA Benchmark · Status — completed cases only"
      icon={Grid2x2}
      insight={buildInsight(rows)}
      table={{
        headers: ["Category", "Volume", "SLA Met", "SLA %", "Avg TAT (min)", "Median TAT (min)", "Benchmark (min)", "Efficiency"],
        rows: rows.map((r) => [
          r.name,
          fmtNum(r.volume),
          fmtNum(r.slaMetCount),
          fmtPct(r.slaPct),
          r.avgActualMinutes !== null ? fmtNum(r.avgActualMinutes) : "—",
          r.medianActualMinutes !== null ? fmtNum(r.medianActualMinutes) : "—",
          fmtNum(r.tatMinutes),
          r.efficiencyPct !== null ? `${r.efficiencyPct >= 0 ? "" : "+"}${fmtNum(Math.abs(r.efficiencyPct))}% ${r.efficiencyPct >= 0 ? "under" : "over"}` : "—",
        ]),
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wide text-brand-green-700">
              <th className="py-2 pr-3">Category</th>
              <th className="px-3 py-2 text-right">Volume</th>
              <th className="px-3 py-2 text-right">SLA %</th>
              <th className="px-3 py-2 text-right">Avg TAT</th>
              <th className="px-3 py-2 text-right">Benchmark</th>
              <th className="px-3 py-2">SLA Progress</th>
              <th className="py-2 pl-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const status = statusFor(r);
              const color = seriesColor(i);
              return (
                <tr key={r.name} className="border-t border-brand-green-700/8">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
                        style={{ background: `${color}22`, color }}
                      >
                        {r.name.slice(0, 1)}
                      </span>
                      <span className="font-medium text-brand-green-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-brand-green-900">{fmtNum(r.volume)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-brand-green-900">{fmtPct(r.slaPct)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-brand-green-900">
                    {r.avgActualMinutes !== null ? `${fmtNum(r.avgActualMinutes)}m` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-brand-green-700">{fmtNum(r.tatMinutes)}m</td>
                  <td className="px-3 py-3">
                    <ProgressBar pct={((r.slaPct ?? 0) / maxSla) * 100} color={color} />
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <Pill label={status.label} tone={status.tone} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
