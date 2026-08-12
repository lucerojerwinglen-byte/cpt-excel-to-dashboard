import { useState } from "react";
import { AlertTriangle, UserCheck } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { ProgressBar } from "../ui/ProgressBar";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useCheckerStats } from "../../data/useDashboardSelectors";
import { fmtNum, fmtPct, tenureShort } from "../../lib/format";
import { seriesColor } from "../../lib/palette";
import type { CheckerStatsRow, LocalTeam } from "../../data/selectors";

type TeamToggle = "Both" | LocalTeam;

function buildInsight(rows: CheckerStatsRow[]): string {
  const eligible = rows.filter((r) => r.volumeChecked >= 30);
  if (!eligible.length) return "Not enough approved volume per approver in the current view to compare breach rates.";
  const avg = eligible.reduce((s, r) => s + (r.breachRatePct ?? 0), 0) / eligible.length;
  const worst = eligible.reduce((b, r) => ((r.breachRatePct ?? 0) > (b.breachRatePct ?? 0) ? r : b), eligible[0]);
  return `${fmtNum(rows.reduce((s, r) => s + r.volumeChecked, 0))} completed cases have been approved. ${worst.name} has the highest breach rate among cases they approved, at ${fmtPct(worst.breachRatePct)} (team average ${fmtPct(avg)}) — correlational, not a verdict on the approver specifically.`;
}

/** Both/Philippines/India toggle filters the already-computed approver list
 * by the approver's own team, same approach as CheckerVolumeChart -- see that
 * file's comment for why this doesn't re-scope the underlying case rows. */
export function CheckerQcPanel() {
  const [team, setTeam] = useState<TeamToggle>("Both");
  const allRows = useCheckerStats();
  const rows = team === "Both" ? allRows : allRows.filter((r) => r.team === team);
  const maxRate = Math.max(1, ...rows.map((r) => r.breachRatePct ?? 0));

  return (
    <ChartCard
      id="card-checker"
      title="Initiator–Approver Quality Signal"
      subtitle="SLA breach rate on completed cases, by who approves the case"
      icon={UserCheck}
      headerExtra={
        <SegmentedToggle
          value={team}
          onChange={setTeam}
          options={[
            { value: "Both", label: "Both" },
            { value: "Philippines", label: "PH" },
            { value: "India", label: "IND" },
          ]}
        />
      }
      insight={buildInsight(rows)}
      table={{
        headers: ["Approver", "Cases Approved", "Breached", "Breach Rate"],
        rows: rows.map((r) => [r.name, fmtNum(r.volumeChecked), fmtNum(r.breachedUnderChecker), fmtPct(r.breachRatePct)]),
      }}
    >
      <p className="mb-3 text-[11px] leading-relaxed text-brand-green-700">
        <span className="font-medium text-brand-green-900">Initiator</span> = the CPT member who processed the case.{" "}
        <span className="font-medium text-brand-green-900">Approver</span> = the CPT member who approves the
        case — often, but not always, a different person from the initiator. The percentage below is each approver's
        <span className="font-medium text-brand-green-900"> breach rate</span>: of the completed cases they approved, the
        share that missed the SLA benchmark.
      </p>
      <div className="mb-3 flex items-start gap-2 rounded-xl bg-[#eda10014] px-3 py-2 text-[11px] leading-relaxed text-brand-green-900/75">
        <AlertTriangle size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" style={{ color: "#eda100" }} />
        <span>
          A high breach rate under an approver isn't necessarily the approver's fault — category mix and the underlying
          initiator's own work both confound this view. Read it as a starting question, not a verdict.
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-green-700">No approved completed cases in the current view.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => {
            const tenure = tenureShort(r.tenureDays, r.tenureApprox);
            return (
              <div key={r.name} className="flex items-center gap-3">
                <div className="flex w-44 shrink-0 items-center gap-1.5 overflow-hidden">
                  <span className="truncate text-xs font-medium text-brand-green-900">{r.name}</span>
                  {tenure && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-green-700/8 px-1.5 py-0.5 text-[9.5px] font-medium text-brand-green-700">
                      {tenure}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <ProgressBar pct={((r.breachRatePct ?? 0) / maxRate) * 100} color={seriesColor(i)} height={10} />
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-brand-green-900">
                  {fmtPct(r.breachRatePct, 1)}
                </span>
                <span className="w-20 shrink-0 text-right text-[10.5px] tabular-nums text-brand-green-700">
                  {fmtNum(r.volumeChecked)} approved
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
