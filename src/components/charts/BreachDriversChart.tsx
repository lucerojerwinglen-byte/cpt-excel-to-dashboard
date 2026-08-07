import { AlertTriangle } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useBreachDrivers } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import type { BreachDriverStats } from "../../data/selectors";

interface Multiplier {
  value: number;
  direction: "worse" | "better" | "flat";
}

function computeMultiplier(stats: BreachDriverStats): Multiplier | null {
  const { withHold, withoutHold } = stats;
  if (!withHold.n || !withoutHold.n) return null;
  const withRate = withHold.breachRate ?? 0;
  const withoutRate = withoutHold.breachRate ?? 0;
  if (withoutRate === 0) return null;
  const ratio = withRate / withoutRate;
  if (Math.abs(withRate - withoutRate) < 1) return { value: 1, direction: "flat" };
  return { value: ratio >= 1 ? ratio : withoutRate / withRate, direction: ratio >= 1 ? "worse" : "better" };
}

function buildCallout(m: Multiplier | null): string {
  if (!m) return "Not enough data with and without a hold in the current view to compare.";
  if (m.direction === "flat") return "Cases with a hold breach SLA at roughly the same rate as cases without one -- holds appear to be doing their job of neutralizing the extra time.";
  if (m.direction === "worse") return `Cases with a hold are ${m.value.toFixed(1)}x more likely to breach SLA than cases without one.`;
  return `Cases with a hold are actually ${m.value.toFixed(1)}x less likely to breach SLA than cases without one.`;
}

function buildInsight(stats: BreachDriverStats): string {
  const { withHold, withoutHold } = stats;
  if (!withHold.n && !withoutHold.n) return "No completed cases in the current view.";
  if (withHold.n === 0) return "No completed cases in the current view used a hold.";
  return `${fmtNum(withHold.n)} completed cases used a hold, ${fmtNum(withoutHold.n)} didn't. ${fmtNum(withHold.breached)} of the held cases breached SLA (${fmtPct(withHold.breachRate)}), vs. ${fmtNum(withoutHold.breached)} of the non-held cases (${fmtPct(withoutHold.breachRate)}).`;
}

export function BreachDriversChart() {
  const stats = useBreachDrivers();
  const rows = [
    { label: "Completed cases with a hold", ...stats.withHold },
    { label: "Completed cases without a hold", ...stats.withoutHold },
  ];
  const maxRate = Math.max(1, ...rows.map((r) => r.breachRate ?? 0));
  const multiplier = computeMultiplier(stats);

  return (
    <ChartCard
      id="card-breachdrivers"
      title="SLA Breach Drivers: Hold vs. No Hold"
      subtitle="Completed cases only"
      icon={AlertTriangle}
      insight={buildInsight(stats)}
      table={{
        headers: ["Group", "Cases", "Breached", "Breach Rate"],
        rows: rows.map((r) => [r.label, fmtNum(r.n), fmtNum(r.breached), fmtPct(r.breachRate)]),
      }}
    >
      <p className="mb-3 text-[11px] leading-relaxed text-brand-green-700">
        A <span className="font-medium text-brand-green-900">hold</span> is a pause CPT places on a case while
        waiting on something outside their control (e.g. the requester, or another team) -- the clock keeps running
        against the SLA benchmark the whole time. This compares how often held cases still end up breaching SLA vs.
        cases that were never paused.
      </p>

      <div className="mb-4 rounded-xl bg-[#eda10014] px-3 py-2.5 text-center">
        <p className="text-xl font-semibold tabular-nums text-brand-green-900">
          {multiplier ? (multiplier.direction === "flat" ? "≈ Same rate" : `${multiplier.value.toFixed(1)}×`) : "—"}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-brand-green-900/75">{buildCallout(multiplier)}</p>
      </div>

      <div className="space-y-5 py-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-brand-green-900">{r.label}</span>
              <span className="text-sm font-medium tabular-nums text-brand-green-900">
                {fmtPct(r.breachRate)} <span className="font-normal text-brand-green-700">({fmtNum(r.breached)} of {fmtNum(r.n)})</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-brand-green-50">
              <div
                className="h-3 rounded-full bg-brand-pink-400 transition-[width] duration-300"
                style={{ width: `${Math.max(r.breachRate ? 1.5 : 0, ((r.breachRate ?? 0) / maxRate) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
