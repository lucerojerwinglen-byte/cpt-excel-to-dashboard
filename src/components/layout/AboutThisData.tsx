import { ShieldCheck } from "lucide-react";
import { PROVENANCE } from "../../data/provenance";
import { fmtDateShort, fmtNum, fmtPct } from "../../lib/format";
import { formatBucketLabel } from "../../lib/bucket";

/**
 * A credibility / data-quality footnote -- deliberately placed last, after
 * every chart section, so it reads as "here's my work" rather than a caveat
 * led with. Deliberately NOT part of SECTIONS_META -- this isn't a chart
 * section, it's provenance for the whole dataset.
 */
export function AboutThisData() {
  const p = PROVENANCE;

  return (
    <details id="about-data" className="group scroll-mt-6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm text-brand-green-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-700">
          <ShieldCheck size={21} strokeWidth={2.25} />
        </span>
        <span>
          <span className="font-medium">About this data</span>
          <span className="text-brand-green-700">
            {" "}
            · {fmtNum(p.totalRows)} cases from {p.sourceFile} · generated {fmtDateShort(p.generatedAtMs)}
          </span>
        </span>
      </summary>

      <div className="mt-5 grid grid-cols-1 gap-6 border-t border-brand-green-700/10 pt-5 text-xs leading-relaxed text-brand-green-700 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-green-900">Scope</h4>
          <ul className="space-y-1">
            <li>{fmtNum(p.totalRows)} rows in the Workday export, every row analyzed</li>
            <li>{fmtNum(p.statusCounts.Completed)} Completed · {fmtNum(p.statusCounts.Cancelled)} Cancelled</li>
            <li>{p.cptMemberCount} CPT members across the Philippines &amp; India teams</li>
            <li>{p.departmentCount} departments (queues) · {p.siteCount} delivery-center sites</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-green-900">Coverage</h4>
          <ul className="space-y-1">
            <li>
              Requests span {fmtDateShort(p.coverageStartMs)} – {fmtDateShort(p.coverageEndMs)}
            </li>
            {p.partialMonths.length > 0 && (
              <li>Partial calendar months: {p.partialMonths.map((m) => formatBucketLabel(m)).join(", ")} -- excluded from peak/lowest-month scorecard picks</li>
            )}
            <li>Snapshot taken {fmtDateShort(p.generatedAtMs)}</li>
            <li>All times are Philippine Standard Time (UTC+8) -- source export is in UTC, shifted +8h at build time</li>
            <li>SLA is judged on Actual Completion Minutes (hold time excluded), Completed cases only</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-green-900">Known gaps</h4>
          <ul className="space-y-1">
            <li>
              {fmtNum(p.reconciliation.mismatches)} rows where Actual Completion Minutes vs. TAT benchmark doesn't
              reproduce the recorded SLAStatus ({fmtPct(p.reconciliation.matchRatePct)} of rows do reconcile) --
              source data noise, kept as recorded
            </li>
            <li>
              {fmtNum(p.holdStats.rowsWithHold)} cases used a hold, {fmtNum(p.holdStats.rowsWithOverlap)} of which
              overlapped the task window and reduced SLA-clock time
            </li>
            <li>
              {fmtNum(p.edgeCases.cancelledWithClosedDate)} Cancelled cases also carry a Closed date, and{" "}
              {fmtNum(p.edgeCases.completedWithCancelledDate)} Completed cases also carry a Cancelled date -- source
              data noise affecting a handful of rows, doesn't change any total
            </li>
            <li>Isolated blanks: {fmtNum(p.blanks.city)} City · {fmtNum(p.blanks.site)} Site · {fmtNum(p.blanks.department)} Department · {fmtNum(p.blanks.country)} Country · {fmtNum(p.blanks.approvedDateByTL)} TL Approval date</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-green-900">Definitions</h4>
          <ul className="space-y-1">
            <li>Completion Rate = Completed ÷ Total -- every case here resolves to Completed or Cancelled, there's no Pending/Rejected state in this data source</li>
            <li>SLA Achievement Rate = SLA Met ÷ Completed, using Actual Completion Minutes (hold-excluded)</li>
            <li>"Avg" processing-time figures are arithmetic means (matching how they're already reported to leadership); a skew-resistant median is shown alongside as a secondary figure</li>
            <li>CPT members below {p.minCompletedForRanking} completed cases are excluded from best/worst rankings and coaching call-outs, tagged "Ramping" instead -- still shown with a full profile card</li>
            <li>CPT tenure for members joined as part of a multi-month cohort (see CPT Member Insights) is approximate</li>
            <li>Maker–checker breach-rate comparisons are correlational, not causal -- confounded by category mix and by who did the underlying work</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
