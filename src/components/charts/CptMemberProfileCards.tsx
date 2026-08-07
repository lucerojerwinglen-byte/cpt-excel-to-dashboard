import { useState } from "react";
import { Sprout, TrendingUp, Trophy, UserRound, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { Avatar } from "../ui/Avatar";
import { Pill } from "../ui/Pill";
import { ProgressBar } from "../ui/ProgressBar";
import { useCptMemberCategoryBreakdown, useCptMemberStats, useTeamLeaderboards } from "../../data/useDashboardSelectors";
import { MIN_COMPLETED_FOR_RANKING } from "../../data/loadData";
import { fmtDateShort, fmtNum, fmtPct } from "../../lib/format";
import { accentFor } from "../../lib/palette";
import type { CptCategoryRow, CptMemberStats, TeamLeaderboard } from "../../data/selectors";

type TeamFilter = "both" | "Philippines" | "India";

function tenureLabel(m: CptMemberStats): string {
  if (m.startTs === null || m.tenureDays === null) return "Tenure unknown";
  const months = m.tenureDays / 30.4;
  const label = months < 1 ? `${Math.round(m.tenureDays)}d tenure` : `${months.toFixed(1)}mo tenure`;
  return `${m.tenureApprox ? "~" : ""}${label} · since ${fmtDateShort(m.startTs)}${m.tenureApprox ? " (cohort estimate)" : ""}`;
}

function buildInsight(rows: CptMemberStats[]): string {
  const withTenure = rows.filter((r) => r.casesPerDay !== null && r.totalCompleted >= 10);
  if (!withTenure.length) return "Not enough completed cases with tenure data to compare members.";
  const top = withTenure.reduce((b, r) => (r.casesPerDay! > b.casesPerDay! ? r : b), withTenure[0]);
  return `${top.name} completes the most cases per day of tenure (${top.casesPerDay!.toFixed(1)}/day) — the fairest single comparison across members with very different start dates, from the Philippines team's Jul 2025 veterans to the India team's members who joined as recently as mid-2026.`;
}

interface RoleBadges {
  topSla: string | null;
  fastest: string | null;
  highestVolume: string | null;
}

/** Badges are ranked within the member's own team (via teamLeaderboards),
 * not across both teams -- otherwise a hidden team's outlier could hold a
 * title no visible card ever shows, and this would disagree with the Top
 * Performers by Team panel above, which uses the same per-team ranking. */
function roleBadgesFromLeaderboard(lb: TeamLeaderboard): RoleBadges {
  return {
    topSla: lb.topSla?.name ?? null,
    fastest: lb.fastestTat?.name ?? null,
    highestVolume: lb.highestVolume?.name ?? null,
  };
}

interface RoleBadgeInfo {
  label: string;
  icon: LucideIcon | null;
  classes: string;
}

const BADGE_ACHIEVEMENT = "bg-brand-green-50 text-brand-green-700 border border-brand-green-400/30";
const BADGE_RAMPING = "bg-brand-green-200/40 text-brand-green-700 border border-brand-green-400/30";

function roleBadgeFor(member: CptMemberStats, badges: RoleBadges): RoleBadgeInfo {
  if (member.lowSample) return { label: `Ramping · under ${MIN_COMPLETED_FOR_RANKING} cases`, icon: Sprout, classes: BADGE_RAMPING };
  if (member.name === badges.topSla) return { label: "Top SLA Achiever", icon: Trophy, classes: BADGE_ACHIEVEMENT };
  if (member.name === badges.fastest) return { label: "Fastest Processing", icon: Zap, classes: BADGE_ACHIEVEMENT };
  if (member.name === badges.highestVolume) return { label: "Highest Volume", icon: TrendingUp, classes: BADGE_ACHIEVEMENT };
  return { label: "CPT Member", icon: null, classes: "" };
}

/** Every card always shows its full per-category table and standout chips --
 * no click-to-expand -- so leadership sees each member's complete picture at
 * a glance, consistent with the rest of the dashboard no longer hiding detail
 * behind "show more" toggles. Each member gets its own accent color (cycled
 * across the shared ACCENTS palette) rather than a team color, since team is
 * already conveyed by the Philippines/India section grouping. */
function MemberCard({
  member,
  categories,
  badges,
  accentIndex,
}: {
  member: CptMemberStats;
  categories: CptCategoryRow[];
  badges: RoleBadges;
  accentIndex: number;
}) {
  const accent = accentFor(accentIndex);
  const best = categories.filter((c) => c.volume >= 5).sort((a, b) => (b.slaPct ?? 0) - (a.slaPct ?? 0))[0];
  const worst = categories.filter((c) => c.volume >= 5).sort((a, b) => (a.slaPct ?? 0) - (b.slaPct ?? 0))[0];
  const role = roleBadgeFor(member, badges);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-green-700/12 transition-shadow hover:shadow-md">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent.fg }} />
      <div className="p-4 pl-5">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} accentIndex={accentIndex} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-brand-green-900">{member.name}</p>
          {role.icon ? (
            <span className={`mt-1 inline-flex max-w-full items-center gap-1 truncate whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium ${role.classes}`}>
              <role.icon size={11} strokeWidth={2.5} className="shrink-0" />
              <span className="truncate">{role.label}</span>
            </span>
          ) : (
            <p className="truncate text-[11px] text-brand-green-700">{role.label}</p>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-brand-green-700/80">{tenureLabel(member)}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-brand-green-50 px-1.5 py-2">
          <p className="text-base font-medium tabular-nums text-brand-green-900">{fmtNum(member.totalCompleted)}</p>
          <p className="text-[10px] uppercase tracking-wide text-brand-green-700">Completed</p>
        </div>
        <div className="rounded-xl bg-brand-green-50 px-1.5 py-2">
          <p className="text-base font-medium tabular-nums text-brand-green-900">{fmtPct(member.slaPct, 0)}</p>
          <p className="text-[10px] uppercase tracking-wide text-brand-green-700">SLA %</p>
        </div>
        <div className="rounded-xl bg-brand-green-50 px-1.5 py-2">
          <p className="text-base font-medium tabular-nums text-brand-green-900">
            {member.avgActualMinutes !== null ? fmtNum(member.avgActualMinutes) : "—"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-brand-green-700">Avg TAT (min)</p>
        </div>
      </div>

      {member.slaPct !== null && (
        <div className="mt-3">
          <ProgressBar pct={member.slaPct} color={accent.fg} height={6} />
          <div className="mt-1 flex items-center justify-between text-[10.5px] text-brand-green-700">
            <span>
              {fmtNum(member.slaMetCount)} / {fmtNum(member.totalCompleted)}
            </span>
            <span className="font-medium" style={{ color: accent.fg }}>
              {fmtPct(member.slaPct, 1)}
            </span>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <table className="mt-3 w-full border-t border-brand-green-700/10 pt-1 text-[11px]">
          <thead>
            <tr className="text-[9.5px] uppercase tracking-wide text-brand-green-700">
              <th className="py-1.5 text-left font-medium">Category</th>
              <th className="py-1.5 text-right font-medium">Vol</th>
              <th className="py-1.5 text-right font-medium">SLA%</th>
              <th className="py-1.5 text-right font-medium">TAT</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.category} className="border-t border-brand-green-700/8">
                <td className="min-w-0 truncate py-1.5 pr-2 text-brand-green-900/80">{c.category}</td>
                <td className="py-1.5 text-right tabular-nums text-brand-green-700">{fmtNum(c.volume)}</td>
                <td className="py-1.5 text-right tabular-nums font-medium text-brand-green-900">{fmtPct(c.slaPct, 0)}</td>
                <td className="py-1.5 text-right tabular-nums text-brand-green-700">
                  {c.avgActualMinutes !== null ? `${fmtNum(c.avgActualMinutes)}m` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {best && (best.slaPct ?? 0) >= 98 && <Pill label={`✓ ${best.category}: ${fmtPct(best.slaPct, 0)}`} tone="green" />}
        {worst && (worst.slaPct ?? 100) < 90 && <Pill label={`${worst.category}: ${fmtPct(worst.slaPct, 0)}`} tone="pink" />}
      </div>
      </div>
    </div>
  );
}

export function CptMemberProfileCards() {
  const stats = useCptMemberStats();
  const categories = useCptMemberCategoryBreakdown();
  const leaders = useTeamLeaderboards();
  const phBadges = roleBadgesFromLeaderboard(leaders.Philippines);
  const indiaBadges = roleBadgesFromLeaderboard(leaders.India);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("Philippines");

  const phTeam = stats.filter((m) => m.team === "Philippines").sort((a, b) => (a.startTs ?? 0) - (b.startTs ?? 0));
  const indiaTeam = stats.filter((m) => m.team === "India").sort((a, b) => (a.startTs ?? 0) - (b.startTs ?? 0));
  const showPh = teamFilter === "both" || teamFilter === "Philippines";
  const showIndia = teamFilter === "both" || teamFilter === "India";

  return (
    <ChartCard
      id="card-cptprofiles"
      title="Individual Member Profiles"
      subtitle="All 17 CPT members, grouped by team, sorted by tenure -- full category breakdown shown for every member"
      icon={UserRound}
      headerExtra={
        <SegmentedToggle
          value={teamFilter}
          onChange={setTeamFilter}
          options={[
            { value: "both", label: "Both" },
            { value: "Philippines", label: "Philippines" },
            { value: "India", label: "India" },
          ]}
        />
      }
      insight={buildInsight(stats)}
      table={{
        headers: ["Member", "Team", "Since", "Completed", "SLA %", "Avg Actual (min)", "Cases/day"],
        rows: stats
          .slice()
          .sort((a, b) => (a.startTs ?? 0) - (b.startTs ?? 0))
          .map((m) => [
            m.name,
            m.team,
            m.startTs !== null ? fmtDateShort(m.startTs) : "—",
            fmtNum(m.totalCompleted),
            fmtPct(m.slaPct),
            m.avgActualMinutes !== null ? fmtNum(m.avgActualMinutes) : "—",
            m.casesPerDay !== null ? m.casesPerDay.toFixed(2) : "—",
          ]),
      }}
    >
      <div className="space-y-6">
        {showPh && (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-green-700">
              Philippines Team · {phTeam.length} members
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {phTeam.map((m, i) => (
                <MemberCard key={m.name} member={m} categories={categories.get(m.name) ?? []} badges={phBadges} accentIndex={i} />
              ))}
            </div>
          </div>
        )}

        {showIndia && (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-green-700">
              India Team · {indiaTeam.length} members
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {indiaTeam.map((m, i) => (
                <MemberCard key={m.name} member={m} categories={categories.get(m.name) ?? []} badges={indiaBadges} accentIndex={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
