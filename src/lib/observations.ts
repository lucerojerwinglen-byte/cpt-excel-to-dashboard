import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Award,
  Ban,
  CheckCheck,
  Gauge,
  Globe2,
  MapPin,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Tone } from "./palette";
import {
  breachOutliers,
  cancellationByDepartment,
  categoryBreakdown,
  categoryPerformance,
  categorySlaTrend,
  checkerStats,
  computeKpis,
  cptMemberStats,
  cptWorkload,
  departmentBreakdown,
  siteBreakdown,
  volumeAndSlaTrend,
} from "../data/selectors";
import { MIN_COMPLETED_FOR_RANKING } from "../data/loadData";
import { fmtNum, fmtPct } from "./format";
import { formatBucketLabel } from "./bucket";

export interface Observation {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Resolved to a hex color via TONE_COLOR at render time -- a calm 3-tone
   * palette (good / warning / info) rather than a per-tile rainbow, so color
   * carries meaning instead of just being "which slot this tile landed in". */
  tone: Tone;
  cardId?: string;
}

/* ---------- individual rules -- each reads the filtered indices and returns
 * an Observation, or null if there isn't enough data / nothing worth flagging. ---------- */

function overallCompliance(indices: number[]): Observation | null {
  const k = computeKpis(indices);
  if (k.slaAchievementRate === null || k.completedCases === 0) return null;
  const good = k.slaAchievementRate >= 95;
  return {
    icon: good ? ShieldCheck : ShieldAlert,
    tone: good ? "good" : "warning",
    title: good ? "Strong Operational Compliance" : "SLA Achievement Below Target",
    body: good
      ? `${fmtPct(k.slaAchievementRate)} SLA Achievement across ${fmtNum(k.completedCases)} completed cases -- consistent, reliable delivery.`
      : `${fmtPct(k.slaAchievementRate)} SLA Achievement across ${fmtNum(k.completedCases)} completed cases is below the 95% threshold. Needs a root-cause look.`,
    cardId: "card-sladonut",
  };
}

function efficiencyVsBenchmark(indices: number[]): Observation | null {
  const k = computeKpis(indices);
  const cats = categoryPerformance(indices);
  if (k.avgProcessingMinutes === null || !cats.length) return null;
  const totalVol = cats.reduce((s, c) => s + c.volume, 0);
  if (totalVol === 0) return null;
  const weightedTat = cats.reduce((s, c) => s + c.tatMinutes * c.volume, 0) / totalVol;
  if (weightedTat <= 0) return null;
  const pctUnder = ((weightedTat - k.avgProcessingMinutes) / weightedTat) * 100;
  const good = pctUnder >= 0;
  return {
    icon: Activity,
    tone: good ? "good" : "warning",
    title: good ? `Processing Efficiency — ${fmtPct(Math.abs(pctUnder), 0)} Under Benchmark` : "Processing Time Above Benchmark",
    body: good
      ? `${fmtNum(k.avgProcessingMinutes)} min average processing time vs. a ${fmtNum(weightedTat)}-min volume-weighted benchmark -- real operational headroom as volume scales.`
      : `${fmtNum(k.avgProcessingMinutes)} min average processing time runs over the ${fmtNum(weightedTat)}-min volume-weighted benchmark. Investigate before it compounds.`,
    cardId: "card-volsla",
  };
}

function worstMonth(indices: number[], cardId: string): Observation | null {
  const trend = volumeAndSlaTrend(indices, "monthly").filter((p) => !p.isPartial && p.slaPct !== null);
  if (trend.length < 2) return null;
  const worst = trend.reduce((b, t) => (t.slaPct! < b.slaPct! ? t : b), trend[0]);
  const best = trend.reduce((b, t) => (t.slaPct! > b.slaPct! ? t : b), trend[0]);
  if (worst.key === best.key) return null;
  return {
    icon: AlertTriangle,
    tone: "warning",
    title: `${formatBucketLabel(worst.key)} — Weakest SLA Month`,
    body: `SLA Achievement dropped to ${fmtPct(worst.slaPct)} in ${formatBucketLabel(worst.key)}, down from a ${fmtPct(
      best.slaPct,
    )} peak in ${formatBucketLabel(best.key)}. Needs a root-cause look before the next reporting cycle.`,
    cardId,
  };
}

function volumeGrowth(indices: number[]): Observation | null {
  const trend = volumeAndSlaTrend(indices, "monthly").filter((p) => !p.isPartial);
  if (trend.length < 2) return null;
  const first = trend[0];
  const peak = trend.reduce((b, t) => (t.volume > b.volume ? t : b), trend[0]);
  if (first.volume <= 0 || peak.key === first.key) return null;
  const multiple = peak.volume / first.volume;
  if (multiple < 1.3) return null;
  return {
    icon: TrendingUp,
    tone: "good",
    title: `${multiple.toFixed(1)}× Volume Growth — Capacity Planning`,
    body: `Volume grew from ${fmtNum(first.volume)} cases in ${formatBucketLabel(first.key)} to ${fmtNum(peak.volume)} in ${formatBucketLabel(
      peak.key,
    )}. Validates scalability, but forward staffing needs to keep pace.`,
    cardId: "card-volsla",
  };
}

function memberIntervention(indices: number[]): Observation | null {
  const members = cptMemberStats(indices).filter((m) => !m.lowSample && m.slaPct !== null);
  if (members.length < 2) return null;
  const worst = members.reduce((b, m) => (m.slaPct! < b.slaPct! ? m : b), members[0]);
  if (worst.slaPct! >= 95) return null;
  const withTat = members.filter((m) => m.avgActualMinutes !== null);
  const teamAvgTat = withTat.length ? withTat.reduce((s, m) => s + m.avgActualMinutes!, 0) / withTat.length : null;
  return {
    icon: ShieldAlert,
    tone: "warning",
    title: `${worst.name} — Coaching Opportunity`,
    body: `${fmtPct(worst.slaPct)} SLA Achievement${
      worst.avgActualMinutes !== null ? ` and ${fmtNum(worst.avgActualMinutes)} min average processing time` : ""
    }${
      teamAvgTat !== null && worst.avgActualMinutes !== null ? ` (team average ${fmtNum(teamAvgTat)} min)` : ""
    } among members with ${MIN_COMPLETED_FOR_RANKING}+ completed cases. Recommend a structured coaching conversation.`,
    cardId: "card-cptsla",
  };
}

function nearBenchmarkRisk(indices: number[]): Observation | null {
  const cats = categoryPerformance(indices).filter((c) => c.avgActualMinutes !== null && c.tatMinutes > 0);
  if (!cats.length) return null;
  const withRatio = cats.map((c) => ({ ...c, ratio: c.avgActualMinutes! / c.tatMinutes }));
  const closest = withRatio.reduce((b, c) => (c.ratio > b.ratio ? c : b), withRatio[0]);
  if (closest.ratio < 0.5) return null;
  const headroomMin = closest.tatMinutes - closest.avgActualMinutes!;
  return {
    icon: Target,
    tone: "warning",
    title: `${closest.name} — Narrow SLA Headroom`,
    body: `Average processing time of ${fmtNum(closest.avgActualMinutes)} minutes is only ${fmtNum(
      headroomMin,
    )} minutes from the ${fmtNum(closest.tatMinutes)}-minute SLA ceiling. Any further creep compounds into breaches.`,
    cardId: "card-catmatrix",
  };
}

function categoryEfficiencyHeadroom(indices: number[]): Observation | null {
  const cats = categoryPerformance(indices).filter((c) => c.avgActualMinutes !== null && c.tatMinutes > 0);
  if (cats.length < 2) return null;
  const withRatio = cats.map((c) => ({ ...c, ratio: c.avgActualMinutes! / c.tatMinutes }));
  const safest = withRatio.reduce((b, c) => (c.ratio < b.ratio ? c : b), withRatio[0]);
  if (safest.ratio > 0.3) return null;
  const efficiencyPct = (1 - safest.ratio) * 100;
  return {
    icon: Zap,
    tone: "good",
    title: `${safest.name} — Widest SLA Margin`,
    body: `${fmtNum(safest.avgActualMinutes)} minutes average against a ${fmtNum(
      safest.tatMinutes,
    )}-minute benchmark -- ${fmtPct(efficiencyPct, 0)} under target, the most buffer of any category in view.`,
    cardId: "card-catmatrix",
  };
}

function categoryStandouts(indices: number[]): Observation[] {
  const cats = categoryPerformance(indices).filter((c) => c.slaPct !== null);
  if (cats.length < 2) return [];
  const best = cats.reduce((b, c) => (c.slaPct! > b.slaPct! ? c : b), cats[0]);
  const worst = cats.reduce((b, c) => (c.slaPct! < b.slaPct! ? c : b), cats[0]);
  if (best.name === worst.name) return [];
  const out: Observation[] = [
    {
      icon: Award,
      tone: "good",
      title: `${best.name} — Gold Standard`,
      body: `${fmtPct(best.slaPct)} SLA Achievement across ${fmtNum(
        best.volume,
      )} completed cases -- the strongest category in view. Worth documenting as a process template.`,
      cardId: "card-catsla",
    },
  ];
  if (worst.slaPct! < 95) {
    out.push({
      icon: AlertTriangle,
      tone: "warning",
      title: `${worst.name} — Highest-Risk Category`,
      body: `${fmtPct(worst.slaPct)} SLA Achievement across ${fmtNum(worst.volume)} completed cases -- the weakest in the current view.`,
      cardId: "card-catsla",
    });
  }
  return out;
}

function categoryVariance(indices: number[]): Observation | null {
  const series = categorySlaTrend(indices, "monthly");
  let widest: { category: string; spread: number } | null = null;
  for (const s of series) {
    const vals = s.points.map((p) => p.slaPct).filter((v): v is number => v !== null);
    if (vals.length < 2) continue;
    const spread = Math.max(...vals) - Math.min(...vals);
    if (!widest || spread > widest.spread) widest = { category: s.category, spread };
  }
  if (!widest || widest.spread < 15) return null;
  return {
    icon: Scale,
    tone: "warning",
    title: `${widest.category} — Inconsistent Month to Month`,
    body: `Monthly SLA Achievement swings by ${fmtPct(
      widest.spread,
      0,
    )} points across the reporting period -- a spread this wide signals process inconsistency worth standardizing.`,
    cardId: "card-catmatrix",
  };
}

function mostActiveChecker(indices: number[]): Observation | null {
  const rows = checkerStats(indices); // already sorted by volume descending
  if (rows.length < 2) return null;
  const top = rows[0];
  const total = rows.reduce((s, r) => s + r.volumeChecked, 0);
  if (total <= 0) return null;
  const share = (top.volumeChecked / total) * 100;
  return {
    icon: CheckCheck,
    tone: "info",
    title: `${top.name} — Highest Approval Volume`,
    body: `${fmtNum(top.volumeChecked)} completed cases approved (${fmtPct(share, 0)} of all approved volume in view) -- the most of any approver.`,
    cardId: "card-checkervolume",
  };
}

function bestCptSla(indices: number[]): Observation | null {
  const members = cptMemberStats(indices).filter((m) => !m.lowSample && m.slaPct !== null);
  if (!members.length) return null;
  const bestPct = members.reduce((b, m) => Math.max(b, m.slaPct!), -Infinity);
  const winners = members.filter((m) => m.slaPct === bestPct);
  const names = winners.map((w) => w.name).join(", ");
  const totalCompleted = winners.reduce((s, w) => s + w.totalCompleted, 0);
  return {
    icon: Award,
    tone: "good",
    title: `${names} — Top SLA Achiever${winners.length > 1 ? "s" : ""}`,
    body: `${fmtPct(bestPct)} SLA Achievement across ${fmtNum(
      totalCompleted,
    )} completed cases -- the best among members with ${MIN_COMPLETED_FOR_RANKING}+ completed cases.`,
    cardId: "card-cptsla",
  };
}

function fastestProcessor(indices: number[]): Observation | null {
  const members = cptMemberStats(indices).filter((m) => !m.lowSample && m.avgActualMinutes !== null);
  if (members.length < 2) return null;
  const fastest = members.reduce((b, m) => (m.avgActualMinutes! < b.avgActualMinutes! ? m : b), members[0]);
  return {
    icon: Gauge,
    tone: "good",
    title: `${fastest.name} — Fastest Average Processing`,
    body: `${fmtNum(fastest.avgActualMinutes)} minutes average across ${fmtNum(
      fastest.totalCompleted,
    )} completed cases -- the fastest among members with ${MIN_COMPLETED_FOR_RANKING}+ completed cases.`,
    cardId: "card-cptvoltat",
  };
}

function worstBreachCluster(indices: number[]): Observation | null {
  const rows = breachOutliers(indices, 15);
  if (!rows.length) return null;
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const worst = rows[0];
  return {
    icon: AlertTriangle,
    tone: "warning",
    title: "Worst Breaches Cluster By Category",
    body: `${top[1]} of the ${rows.length} worst SLA breaches are ${top[0]} cases. The single worst ran ${fmtNum(
      worst.overMinutes,
    )} minutes over its ${fmtNum(worst.tatMinutes)}-minute benchmark.`,
    cardId: "card-breachoutliers",
  };
}

function dominantCategoryConcentration(indices: number[]): Observation | null {
  const cats = categoryBreakdown(indices);
  const total = cats.reduce((s, c) => s + c.count, 0);
  if (!cats.length || total === 0) return null;
  const top = cats[0];
  const share = (top.count / total) * 100;
  if (share < 60) return null;
  return {
    icon: Target,
    tone: "info",
    title: `${top.label} — Core Engine`,
    body: `${fmtPct(share)} of total volume (${fmtNum(
      top.count,
    )} cases) is ${top.label}. Any process change or SLA shift here has an outsized effect on CPT's overall numbers.`,
    cardId: "card-category",
  };
}

function dominantAccountConcentration(indices: number[]): Observation | null {
  const depts = departmentBreakdown(indices, Infinity);
  const total = depts.reduce((s, d) => s + d.count, 0);
  if (!depts.length || total === 0) return null;
  const top = depts[0];
  const share = (top.count / total) * 100;
  if (share < 15) return null;
  return {
    icon: Target,
    tone: "info",
    title: `${top.label} — Largest Account`,
    body: `${fmtPct(share)} of volume (${fmtNum(top.count)} cases) runs through a single account. Worth a dedicated point of contact given the concentration.`,
    cardId: "card-department",
  };
}

function siteConcentration(indices: number[]): Observation | null {
  const sites = siteBreakdown(indices, Infinity);
  const total = sites.reduce((s, d) => s + d.count, 0);
  if (!sites.length || total === 0) return null;
  const top = sites[0];
  const share = (top.count / total) * 100;
  if (share < 25) return null;
  return {
    icon: MapPin,
    tone: "info",
    title: `${top.label} — Largest Delivery Site`,
    body: `${fmtPct(share)} of volume (${fmtNum(top.count)} cases) originates from a single site among ${fmtNum(
      sites.length,
    )} sites in view.`,
    cardId: "card-site",
  };
}

function cancellationHotspot(indices: number[]): Observation | null {
  const rows = cancellationByDepartment(indices).filter((r) => r.total >= 20);
  if (!rows.length) return null;
  const top = rows[0];
  if ((top.rate ?? 0) < 10) return null;
  return {
    icon: Ban,
    tone: "warning",
    title: `${top.name} — Highest Cancellation Rate`,
    body: `${fmtPct(top.rate)} of ${top.name}'s cases are cancelled (${fmtNum(top.numerator)} of ${fmtNum(
      top.total,
    )}) among top accounts by volume. Worth a direct conversation with the account team.`,
    cardId: "card-canceldept",
  };
}

function completionOutcomeNote(indices: number[]): Observation | null {
  const k = computeKpis(indices);
  if (k.totalCases === 0) return null;
  return {
    icon: TrendingUp,
    tone: "info",
    title: "Case Outcome Split",
    body: `${fmtPct(k.completionRate)} of ${fmtNum(k.totalCases)} cases completed (${fmtNum(
      k.completedCases,
    )}); ${fmtNum(k.cancelledCases)} cancelled. Cancellation is the one outcome CPT and its upstream partners can realistically influence.`,
    cardId: "card-status",
  };
}

function workloadConcentration(indices: number[]): Observation | null {
  const rows = cptWorkload(indices, Infinity);
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (rows.length < 4 || total === 0) return null;
  const top3 = rows.slice(0, 3).reduce((s, r) => s + r.count, 0);
  const share = (top3 / total) * 100;
  if (share < 50) return null;
  return {
    icon: Users,
    tone: "warning",
    title: "Workload Concentrated in a Few Members",
    body: `The top 3 CPT members handle ${fmtPct(share)} of all completed cases in view -- a resilience risk if any one of them is out for an extended period.`,
    cardId: "card-workload",
  };
}

function teamComparisonNote(indices: number[]): Observation | null {
  const members = cptMemberStats(indices);
  const ph = members.filter((m) => m.team === "Philippines" && m.slaPct !== null);
  const india = members.filter((m) => m.team === "India" && m.slaPct !== null);
  if (!ph.length || !india.length) return null;
  const phSla = ph.reduce((s, m) => s + m.slaPct!, 0) / ph.length;
  const indiaSla = india.reduce((s, m) => s + m.slaPct!, 0) / india.length;
  const indiaCompleted = india.reduce((s, m) => s + m.totalCompleted, 0);
  return {
    icon: Globe2,
    tone: "info",
    title: "Philippines & India — Different Ramp Stages",
    body: `Philippines team averages ${fmtPct(phSla)} SLA on a longer tenure; India (${fmtNum(
      indiaCompleted,
    )} completed cases so far) averages ${fmtPct(indiaSla)} while still ramping since Mar–Jul 2026. Read India's numbers against tenure, not head-to-head against PH veterans.`,
    cardId: "card-cptprofiles",
  };
}

function rampingCohortNote(indices: number[]): Observation | null {
  const members = cptMemberStats(indices);
  const ramping = members.filter((m) => m.lowSample && m.totalCompleted > 0);
  if (ramping.length < 1) return null;
  const names = ramping.map((m) => m.name);
  return {
    icon: Sprout,
    tone: "info",
    title: ramping.length === 1 ? `${names[0]} — Still Ramping` : `${ramping.length} Members Still Ramping`,
    body: `${names.slice(0, 4).join(", ")}${
      ramping.length > 4 ? ", and others" : ""
    } ${ramping.length === 1 ? "has" : "have"} fewer than ${MIN_COMPLETED_FOR_RANKING} completed cases so far and ${
      ramping.length === 1 ? "is" : "are"
    } excluded from best/worst SLA rankings until sample size is large enough to be fair.`,
    cardId: "card-cptprofiles",
  };
}

/* ---------- per-tab assembly -- each caps at 6 cards, drops nulls. Order is
 * priority order: the first entry becomes the panel's lead tile. ---------- */

function assemble(...obs: (Observation | Observation[] | null)[]): Observation[] {
  return obs.flatMap((o) => (o === null ? [] : Array.isArray(o) ? o : [o])).slice(0, 6);
}

export function executiveObservations(indices: number[]): Observation[] {
  return assemble(
    overallCompliance(indices),
    memberIntervention(indices),
    efficiencyVsBenchmark(indices),
    volumeGrowth(indices),
    nearBenchmarkRisk(indices),
  );
}

export function volumeObservations(indices: number[]): Observation[] {
  return assemble(
    volumeGrowth(indices),
    dominantCategoryConcentration(indices),
    dominantAccountConcentration(indices),
    cancellationHotspot(indices),
    siteConcentration(indices),
    completionOutcomeNote(indices),
  );
}

export function slaObservations(indices: number[]): Observation[] {
  return assemble(
    worstMonth(indices, "card-slatrend"),
    worstBreachCluster(indices),
    nearBenchmarkRisk(indices),
    categoryVariance(indices),
    overallCompliance(indices),
  );
}

export function categoryObservations(indices: number[]): Observation[] {
  return assemble(
    categoryStandouts(indices),
    nearBenchmarkRisk(indices),
    categoryEfficiencyHeadroom(indices),
    categoryVariance(indices),
  );
}

export function cptObservations(indices: number[]): Observation[] {
  return assemble(
    bestCptSla(indices),
    memberIntervention(indices),
    fastestProcessor(indices),
    mostActiveChecker(indices),
    workloadConcentration(indices),
    teamComparisonNote(indices),
    rampingCohortNote(indices),
  );
}
