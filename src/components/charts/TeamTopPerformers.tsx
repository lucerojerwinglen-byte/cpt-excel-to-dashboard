import { Award, CheckCheck, TrendingUp, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { MiniStatCard } from "../ui/MiniStatCard";
import { useTeamLeaderboards } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct } from "../../lib/format";
import { TONE_COLOR } from "../../lib/palette";
import type { LocalTeam, TeamLeaderboard } from "../../data/selectors";

const TEAMS: LocalTeam[] = ["Philippines", "India"];

interface Metric {
  icon: LucideIcon;
  label: string;
  color: string;
  value: (lb: TeamLeaderboard) => string;
  sub: (lb: TeamLeaderboard) => string | undefined;
}

const METRICS: Metric[] = [
  { icon: Trophy, label: "Top SLA Achiever", color: TONE_COLOR.good, value: (lb) => (lb.topSla ? fmtPct(lb.topSla.value) : "—"), sub: (lb) => lb.topSla?.name },
  {
    icon: Zap,
    label: "Fastest Avg TAT",
    color: TONE_COLOR.info,
    value: (lb) => (lb.fastestTat ? `${fmtNum(lb.fastestTat.value)} min` : "—"),
    sub: (lb) => lb.fastestTat?.name,
  },
  {
    icon: TrendingUp,
    label: "Highest Volume",
    color: "#eda100",
    value: (lb) => (lb.highestVolume ? fmtNum(lb.highestVolume.value) : "—"),
    sub: (lb) => lb.highestVolume?.name,
  },
  {
    icon: CheckCheck,
    label: "Top Approver",
    color: "#531367",
    value: (lb) => (lb.topApprover ? fmtNum(lb.topApprover.value) : "—"),
    sub: (lb) => lb.topApprover?.name,
  },
];

function buildInsight(leaders: Record<LocalTeam, TeamLeaderboard>): string {
  const parts = TEAMS.map((team) => {
    const top = leaders[team].topSla;
    return top ? `${top.name} leads ${team} on SLA (${fmtPct(top.value)})` : null;
  }).filter((p): p is string => p !== null);
  if (!parts.length) return "Not enough completed volume in the current view to rank team leaders.";
  return `${parts.join("; ")}. Each metric is ranked within its own team -- a small team's outlier can't win a title in the other team's row.`;
}

export function TeamTopPerformers() {
  const leaders = useTeamLeaderboards();

  const tableRows: (string | number)[][] = [];
  TEAMS.forEach((team) => {
    METRICS.forEach((m) => tableRows.push([team, m.label, m.value(leaders[team]), m.sub(leaders[team]) ?? "—"]));
  });

  return (
    <ChartCard
      id="card-teamtop"
      title="Top Performers by Team"
      subtitle="Philippines and India ranked separately, so one team's leader can't overshadow the other's"
      icon={Award}
      insight={buildInsight(leaders)}
      table={{ headers: ["Team", "Metric", "Value", "Member"], rows: tableRows }}
    >
      <div className="space-y-5">
        {TEAMS.map((team) => (
          <div key={team}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-green-700">{team}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {METRICS.map((m) => (
                <MiniStatCard key={m.label} icon={m.icon} label={m.label} color={m.color} value={m.value(leaders[team])} sub={m.sub(leaders[team])} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
