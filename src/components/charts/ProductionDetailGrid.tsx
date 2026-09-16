import { useMemo, useState } from "react";
import { Grid2x2 } from "lucide-react";
import { ChartCard } from "../ui/ChartCard";
import { DataTable } from "../ui/DataTable";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { useMemberPeriodProduction } from "../../data/useDashboardSelectors";
import { fmtNum } from "../../lib/format";
import { formatBucketLabel, type Granularity } from "../../lib/bucket";
import type { MemberPeriodProduction, MemberPeriodProductionResult } from "../../data/selectors";

const PERIOD_NOUN: Record<Granularity, string> = { daily: "day", weekly: "week", monthly: "month" };

function cell(v: number): string {
  return v === 0 ? "–" : fmtNum(v);
}

function buildInsight({ rows, periods }: MemberPeriodProductionResult, noun: string): string {
  if (!rows.length) return "No production volume in the current view.";
  const top = [...rows].sort((a, b) => b.total - a.total)[0];
  return `${top.name} has the highest total at ${fmtNum(top.total)} tickets across ${fmtNum(
    top.activePeriods,
  )} active ${noun}s (${fmtNum(periods.length)} calendar ${noun}s in the current view).`;
}

export function ProductionDetailGrid() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const result = useMemberPeriodProduction(granularity);
  const noun = PERIOD_NOUN[granularity];
  const { periods } = result;

  const sortedRows = useMemo(() => [...result.rows].sort((a, b) => b.total - a.total), [result.rows]);

  const headers = useMemo(
    () => ["Employee", ...periods.map((p) => formatBucketLabel(p)), "Total", `Active ${noun}s`, "Avg / Active", "Avg / Calendar"],
    [periods, noun],
  );

  const tableRows = useMemo(
    () =>
      sortedRows.map((r: MemberPeriodProduction) => [
        r.name,
        ...r.perPeriod.map(cell),
        fmtNum(r.total),
        fmtNum(r.activePeriods),
        r.avgPerActivePeriod !== null ? r.avgPerActivePeriod.toFixed(1) : "–",
        r.avgPerCalendarPeriod !== null ? r.avgPerCalendarPeriod.toFixed(1) : "–",
      ]),
    [sortedRows],
  );

  return (
    <ChartCard
      id="card-productiondetail"
      title={`Full detail: tickets per employee per ${noun}`}
      subtitle={`Every employee x ${noun} cell, plus totals and both averages. Scrolls in both directions.`}
      icon={Grid2x2}
      headerExtra={
        <SegmentedToggle
          value={granularity}
          onChange={setGranularity}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      }
      insight={buildInsight(result, noun)}
      table={{ headers, rows: tableRows }}
    >
      <DataTable headers={headers} rows={tableRows} />
    </ChartCard>
  );
}
