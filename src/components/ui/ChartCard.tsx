import { useState, type ReactNode } from "react";
import { Lightbulb, type LucideIcon } from "lucide-react";
import { DataTable, type TableData } from "./DataTable";
import { InsightText } from "../../lib/insightText";
import { useInsightDrawer } from "../../state/InsightDrawerContext";
import { INSIGHT_CONTENT } from "../../data/insightContent";

interface ChartCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerExtra?: ReactNode;
  insight?: string;
  /** Live-computed Suggested Action, overriding INSIGHT_CONTENT's static
   * default -- only charts whose authored action names a specific
   * category/department/site pass this. */
  suggestedAction?: string;
  table: TableData;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  id,
  title,
  subtitle,
  icon: Icon,
  headerExtra,
  insight,
  suggestedAction,
  table,
  children,
  className = "",
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const { openDrawer } = useInsightDrawer();
  const hasInsightContent = id !== undefined && insight !== undefined && INSIGHT_CONTENT[id] !== undefined;

  return (
    <section
      id={id}
      className={`scroll-mt-6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,33,26,0.06)] ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-700">
              <Icon size={21} strokeWidth={2.25} />
            </span>
          )}
          <div>
            <h3 className="text-sm font-medium text-brand-green-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-brand-green-700">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          {hasInsightContent && (
            <button
              type="button"
              onClick={() =>
                openDrawer({ cardId: id!, title, icon: Icon, keyFinding: insight!, suggestedActionOverride: suggestedAction, chart: children })
              }
              className="flex items-center gap-1.5 rounded-lg border border-brand-green-700/15 px-2.5 py-1 text-xs font-medium text-brand-green-700 transition-colors hover:bg-brand-green-50"
            >
              <Lightbulb size={13} strokeWidth={2.25} />
              Insights
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="rounded-lg border border-brand-green-700/15 px-2.5 py-1 text-xs font-medium text-brand-green-700 transition-colors hover:bg-brand-green-50"
          >
            {showTable ? "View as chart" : "View as table"}
          </button>
        </div>
      </div>

      {showTable ? <DataTable headers={table.headers} rows={table.rows} /> : children}
      {insight && <InsightText text={insight} />}
    </section>
  );
}
