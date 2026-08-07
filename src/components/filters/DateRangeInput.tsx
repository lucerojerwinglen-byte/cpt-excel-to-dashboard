import { useFilters } from "../../state/FilterContext";

function toDateInputValue(ms: number | null): string {
  if (ms === null) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string, endOfDay: boolean): number | null {
  if (!value) return null;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return endOfDay ? ms + 24 * 60 * 60 * 1000 - 1 : ms;
}

export function DateRangeInput() {
  const { filters, setDateRange } = useFilters();

  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-brand-green-700">
        Date range
      </span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={toDateInputValue(filters.dateRange.start)}
          onChange={(e) =>
            setDateRange({
              start: fromDateInputValue(e.target.value, false),
              end: filters.dateRange.end,
            })
          }
          className="rounded-xl border border-brand-green-700/15 bg-white px-3 py-2 text-sm text-brand-green-900 outline-none focus:border-brand-green-400"
        />
        <span className="text-brand-green-700">–</span>
        <input
          type="date"
          value={toDateInputValue(filters.dateRange.end)}
          onChange={(e) =>
            setDateRange({
              start: filters.dateRange.start,
              end: fromDateInputValue(e.target.value, true),
            })
          }
          className="rounded-xl border border-brand-green-700/15 bg-white px-3 py-2 text-sm text-brand-green-900 outline-none focus:border-brand-green-400"
        />
      </div>
    </div>
  );
}
