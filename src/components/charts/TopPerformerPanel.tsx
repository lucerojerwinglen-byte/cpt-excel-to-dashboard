import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { useFilters } from "../../state/FilterContext";
import { useTopPerformerStore } from "../../state/TopPerformerStore";
import { useCptMemberStatsForTeam } from "../../data/useDashboardSelectors";
import { topPerformerBoard, type TopPerformerEntry, type TopPerformerVerdict } from "../../data/topPerformer";
import type { LocalTeam } from "../../data/selectors";
import { formatBucketLabel, monthlyKey } from "../../lib/bucket";
import { fmtNum, fmtPct } from "../../lib/format";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { Pill } from "../ui/Pill";

function VerdictPill({ verdict }: { verdict: TopPerformerVerdict }) {
  if (verdict === "winner") {
    return (
      <span
        title="Top Performer"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-700 text-white"
      >
        <Trophy size={13} strokeWidth={2.5} />
      </span>
    );
  }
  if (verdict === "no") return <Pill label="No" tone="pink" />;
  return <Pill label="TBD" tone="amber" />;
}

const SITE_LABEL: Record<LocalTeam, string> = { Philippines: "PH", India: "IND" };

function TopPerformerTable({ team, monthKey }: { team: LocalTeam; monthKey: string }) {
  const members = useCptMemberStatsForTeam(team);
  const store = useTopPerformerStore();

  const entries = useMemo(() => {
    const map: Record<string, TopPerformerEntry> = {};
    for (const m of members) map[m.name] = store.getEntry(monthKey, m.name);
    return map;
  }, [members, store, monthKey]);

  const board = useMemo(() => topPerformerBoard(members, team, entries), [members, team, entries]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
      <h3 className="mb-4 text-sm font-medium text-brand-green-900">{SITE_LABEL[team]} Top Performer</h3>
      <div className="max-h-[480px] overflow-auto rounded-xl border border-brand-green-700/10">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-brand-green-50">
            <tr>
              {["Employee", "Vol.", "Quality", "SLA", "Leaves", "Score", "Winner"].map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-2 font-medium text-brand-green-900/70">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.rows.map((r) => (
              <tr key={r.name} className="border-t border-brand-green-700/8 odd:bg-brand-green-50/30">
                <td className="max-w-[110px] px-2 py-2 leading-tight text-brand-green-900">{r.name}</td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-brand-green-900">{fmtNum(r.volumes)}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={r.quality ?? 0}
                      onChange={(e) => store.setQuality(monthKey, r.name, Number(e.target.value))}
                      className="h-1.5 w-14 accent-brand-green-700"
                    />
                    <span className="w-7 text-right text-xs tabular-nums text-brand-green-900">
                      {r.quality === null ? "—" : `${r.quality}%`}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-brand-green-900">{fmtPct(r.slaPct, 0)}</td>
                <td className="whitespace-nowrap px-2 py-2">
                  <SegmentedToggle
                    options={[
                      { value: "No", label: "No" },
                      { value: "Yes", label: "Yes" },
                    ]}
                    value={r.leaves ? "Yes" : "No"}
                    onChange={(v) => store.setLeaves(monthKey, r.name, v === "Yes")}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-brand-green-900">
                  {r.score === null ? "—" : r.score.toFixed(1)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-center">
                  <VerdictPill verdict={r.verdict} />
                </td>
              </tr>
            ))}
            {board.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-brand-green-700">
                  No {team} members in the current view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Leaders score each CPT member's month here: Volumes and SLA auto-pull
 * from the uploaded Excel data for whatever month is set in the date
 * filter above (Volumes = Completed + Cancelled, matching Total Production
 * Count elsewhere); Quality and Leaves are the only genuinely manual
 * inputs, since neither exists in the Sagiease export. Reuses the date
 * filter's start date -- rather than a dedicated month picker -- as the
 * save-key for those manual entries, so leaders are expected to filter to
 * one full calendar month while using this tab. */
export function TopPerformerPanel() {
  const { filters } = useFilters();

  const monthKey = filters.dateRange.start !== null ? monthlyKey(new Date(filters.dateRange.start)) : null;

  if (monthKey === null) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
        <p className="text-sm font-medium text-brand-green-900">Select a month to begin</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-brand-green-700">
          Use the date filter above to pick a calendar month -- Volumes and SLA auto-pull from that period, and any
          Quality/Leaves you enter are saved against it.
        </p>
      </div>
    );
  }

  const monthLabel = formatBucketLabel(monthKey);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/60 px-4 py-3">
        <p className="text-sm font-medium text-brand-green-900">Scoring for {monthLabel}</p>
        <p className="text-xs text-brand-green-700">
          Score = Volume (1/3, normalized to the site's top scorer) + Quality (1/3) + SLA (1/3) -- Leaves = Yes disqualifies
          from winning, but the score still shows.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopPerformerTable team="Philippines" monthKey={monthKey} />
        <TopPerformerTable team="India" monthKey={monthKey} />
      </div>
    </div>
  );
}
