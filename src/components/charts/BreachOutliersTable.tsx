import { useEffect, useMemo, useState } from "react";
import { ListOrdered, Search } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { useBreachOutliers } from "../../data/useDashboardSelectors";
import { fmtDateTime, fmtNum } from "../../lib/format";
import type { BreachOutlier } from "../../data/selectors";

const INITIAL_VISIBLE = 50;
const REVEAL_INCREMENT = 100;

function buildInsight(rows: BreachOutlier[]): string {
  if (!rows.length) return "No SLA breaches among completed cases in the current view.";
  const top = rows[0];
  const catCounts = new Map<string, number>();
  rows.forEach((r) => catCounts.set(r.category, (catCounts.get(r.category) ?? 0) + 1));
  const topCat = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  return `The worst breach in view ran ${fmtNum(top.overMinutes)} minutes over its ${fmtNum(top.tatMinutes)}-minute benchmark (${top.caseNo}, ${top.category}, ${top.cptMember}). ${topCat[1]} of all ${rows.length} SLA breaches in view are ${topCat[0]} cases.`;
}

export function BreachOutliersTable() {
  const rows = useBreachOutliers(); // full list, worst overage first
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.caseNo.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.cptMember.toLowerCase().includes(q),
    );
  }, [rows, query]);

  useEffect(() => setVisibleCount(INITIAL_VISIBLE), [query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  return (
    <ChartCard
      id="card-breachoutliers"
      title="Worst SLA Breaches"
      subtitle="Every completed case that breached its SLA benchmark, worst overage first"
      icon={ListOrdered}
      insight={buildInsight(rows)}
      table={{
        // Full, unfiltered rows -- "View as table" always means the complete
        // dataset. The search box lives in the custom list view below, which
        // ChartCard hides while the table is showing, so a filtered table
        // here would look silently incomplete with no way to see why.
        headers: ["Case No.", "Category", "CPT Member", "Completed", "Actual (min)", "Benchmark (min)", "Over by (min)"],
        rows: rows.map((r) => [
          r.caseNo,
          r.category,
          r.cptMember,
          fmtDateTime(r.dateMs),
          fmtNum(r.actualMinutes),
          fmtNum(r.tatMinutes),
          fmtNum(r.overMinutes),
        ]),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-brand-green-700">No SLA breaches among completed cases in the current view.</p>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} strokeWidth={2.25} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-green-700/60" />
              <input
                type="text"
                placeholder="Search case no., category, member…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-brand-green-700/15 py-1.5 pl-8 pr-2 text-sm text-brand-green-900 outline-none placeholder:text-brand-green-700/60 focus:border-brand-green-400"
              />
            </div>
            <span className="shrink-0 text-xs text-brand-green-700">
              {fmtNum(visible.length)} of {fmtNum(filtered.length)} breaches
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-green-700">No breaches match "{query}".</p>
          ) : (
            <div className="max-h-96 space-y-1.5 overflow-y-auto">
              {visible.map((r, i) => (
                <div
                  key={r.caseNo}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-3 py-2 odd:bg-brand-green-50/40"
                >
                  <span className="w-6 shrink-0 text-xs font-medium text-brand-green-700">#{i + 1}</span>
                  <span className="w-20 shrink-0 truncate text-xs font-medium text-brand-green-900/70">{r.caseNo}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-green-900">{r.category}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-brand-green-900/80">{r.cptMember}</span>
                  <span className="text-xs text-brand-green-700">{fmtDateTime(r.dateMs)}</span>
                  <span className="text-sm font-medium tabular-nums text-brand-pink-600">
                    +{fmtNum(r.overMinutes)}m over
                  </span>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((v) => v + REVEAL_INCREMENT)}
              className="mt-3 w-full rounded-lg border border-brand-green-700/15 py-1.5 text-xs font-medium text-brand-green-700 transition-colors hover:bg-brand-green-50"
            >
              Show {Math.min(REVEAL_INCREMENT, filtered.length - visible.length)} more
            </button>
          )}
        </div>
      )}
    </ChartCard>
  );
}
