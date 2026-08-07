import { Clock, Gauge, Layers, Users, XCircle } from "lucide-react";
import { StatCard, type StatDelta } from "../ui/StatCard";
import { useKpiDeltas, useKpis } from "../../data/useDashboardSelectors";
import { DASHBOARD_DATA } from "../../data/loadData";
import { fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel } from "../../lib/bucket";

function directionOf(delta: number | null): "up" | "down" | "flat" {
  if (delta === null || Math.abs(delta) < 0.05) return "flat";
  return delta > 0 ? "up" : "down";
}

function pctDeltaText(delta: number | null, direction: "up" | "down" | "flat", vsLabel: string): string | null {
  if (delta === null || direction === "flat") return direction === "flat" && delta !== null ? `flat ${vsLabel}` : null;
  return `${fmtPct(Math.abs(delta), 1)} ${vsLabel}`;
}

function ptsDeltaText(delta: number | null, direction: "up" | "down" | "flat", vsLabel: string): string | null {
  if (delta === null) return null;
  if (direction === "flat") return `flat ${vsLabel}`;
  return `${Math.abs(delta).toFixed(1)}pp ${vsLabel}`;
}

export function KpiRow() {
  const kpis = useKpis();
  const deltas = useKpiDeltas();
  const vsLabel = deltas.previousKey ? `vs ${formatBucketLabel(deltas.previousKey)}` : "";

  const phCount = DASHBOARD_DATA.cptTeam.filter((t) => t === "Philippines").length;
  const indiaCount = DASHBOARD_DATA.cptTeam.filter((t) => t === "India").length;

  const totalCasesDir = directionOf(deltas.totalCasesDeltaPct);
  const totalCasesDelta: StatDelta | null =
    deltas.totalCasesDeltaPct === null
      ? null
      : { text: pctDeltaText(deltas.totalCasesDeltaPct, totalCasesDir, vsLabel) ?? "", direction: totalCasesDir, good: totalCasesDir !== "down" };

  const slaDir = directionOf(deltas.slaAchievementDeltaPts);
  const slaDelta: StatDelta | null =
    deltas.slaAchievementDeltaPts === null
      ? null
      : { text: ptsDeltaText(deltas.slaAchievementDeltaPts, slaDir, vsLabel) ?? "", direction: slaDir, good: slaDir !== "down" };

  const tatDir = directionOf(deltas.avgProcessingMinutesDeltaPct);
  const tatDelta: StatDelta | null =
    deltas.avgProcessingMinutesDeltaPct === null
      ? null
      : { text: pctDeltaText(deltas.avgProcessingMinutesDeltaPct, tatDir, vsLabel) ?? "", direction: tatDir, good: tatDir !== "up" };

  const breachDir = directionOf(deltas.slaBreachedDeltaPct);
  const breachDelta: StatDelta | null =
    deltas.slaBreachedDeltaPct === null
      ? null
      : { text: pctDeltaText(deltas.slaBreachedDeltaPct, breachDir, vsLabel) ?? "", direction: breachDir, good: breachDir !== "up" };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Total Cases"
        value={fmtNum(kpis.totalCases)}
        description="Philippines & India, matching current filters"
        icon={Layers}
        accentColor="#0050ff"
        variant="hero"
        delta={totalCasesDelta}
        className="sm:col-span-2 lg:col-span-1"
      />
      <StatCard
        label="SLA Achievement Rate"
        value={fmtPct(kpis.slaAchievementRate)}
        description={`${fmtNum(kpis.slaMetCount)} of ${fmtNum(kpis.completedCases)} completed cases`}
        icon={Gauge}
        accentColor="#00cba1"
        delta={slaDelta}
      />
      <StatCard
        label="Avg Processing Time"
        value={kpis.avgProcessingMinutes !== null ? `${fmtNum(kpis.avgProcessingMinutes)} min` : "—"}
        description={kpis.medianProcessingMinutes !== null ? `Median ${fmtNum(kpis.medianProcessingMinutes)} min` : "Actual Completion Minutes, hold-excluded"}
        icon={Clock}
        accentColor="#c82ebf"
        delta={tatDelta}
      />
      <StatCard
        label="SLA Breached"
        value={fmtNum(kpis.slaBreachedCount)}
        description={`${fmtPct(kpis.completedCases > 0 ? (kpis.slaBreachedCount / kpis.completedCases) * 100 : null)} of completed cases`}
        icon={XCircle}
        accentColor="#e96be2"
        delta={breachDelta}
      />
      <StatCard
        label="CPT Members"
        value={fmtNum(DASHBOARD_DATA.cptMembers.length)}
        description={`${phCount} Philippines · ${indiaCount} India`}
        icon={Users}
        accentColor="#eda100"
      />
    </div>
  );
}
