import { useFilters, type Dimension } from "../../state/FilterContext";
import { fmtDateShort } from "../../lib/format";

const DIMENSIONS: { dim: Dimension; prefix: string }[] = [
  { dim: "team", prefix: "Team" },
  { dim: "country", prefix: "Country" },
  { dim: "dept", prefix: "Dept" },
  { dim: "cat", prefix: "Type" },
  { dim: "cpt", prefix: "CPT" },
  { dim: "status", prefix: "Status" },
  { dim: "site", prefix: "Site" },
];

export function ActiveFilterChips() {
  const { filters, toggle, setDateRange, isActive } = useFilters();
  if (!isActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DIMENSIONS.flatMap(({ dim, prefix }) =>
        [...filters[dim]].map((value) => (
          <button
            key={`${dim}:${value}`}
            type="button"
            onClick={() => toggle(dim, value)}
            className="flex items-center gap-1.5 rounded-full bg-brand-green-700 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-green-900"
          >
            {prefix}: {value}
            <span aria-hidden="true">✕</span>
          </button>
        )),
      )}
      {(filters.dateRange.start !== null || filters.dateRange.end !== null) && (
        <button
          type="button"
          onClick={() => setDateRange({ start: null, end: null })}
          className="flex items-center gap-1.5 rounded-full bg-brand-green-700 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-green-900"
        >
          {filters.dateRange.start ? fmtDateShort(filters.dateRange.start) : "…"} –{" "}
          {filters.dateRange.end ? fmtDateShort(filters.dateRange.end) : "…"}
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}
