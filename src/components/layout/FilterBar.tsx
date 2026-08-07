import { DASHBOARD_DATA } from "../../data/loadData";
import { useFilters } from "../../state/FilterContext";
import { MultiSelect } from "../filters/MultiSelect";
import { DateRangeInput } from "../filters/DateRangeInput";

const TEAMS = ["Philippines", "India"];

export function FilterBar() {
  const { filters, toggle, reset, isActive } = useFilters();

  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(0,33,26,0.06)]">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelect
          label="Team"
          options={TEAMS}
          selected={filters.team}
          onToggle={(v) => toggle("team", v)}
        />
        <MultiSelect
          label="Countries"
          options={DASHBOARD_DATA.countries}
          selected={filters.country}
          onToggle={(v) => toggle("country", v)}
        />
        <MultiSelect
          label="Departments"
          options={DASHBOARD_DATA.departments}
          selected={filters.dept}
          onToggle={(v) => toggle("dept", v)}
          searchable
        />
        <MultiSelect
          label="Case types"
          options={DASHBOARD_DATA.categories}
          selected={filters.cat}
          onToggle={(v) => toggle("cat", v)}
        />
        <MultiSelect
          label="Sites"
          options={DASHBOARD_DATA.sites}
          selected={filters.site}
          onToggle={(v) => toggle("site", v)}
          searchable
        />
        <MultiSelect
          label="CPT members"
          options={DASHBOARD_DATA.cptMembers}
          selected={filters.cpt}
          onToggle={(v) => toggle("cpt", v)}
          searchable
        />

        {isActive && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded-xl border border-brand-green-700/20 px-4 py-2 text-sm font-medium text-brand-green-700 transition-colors hover:bg-brand-green-50"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-brand-green-700/10 pt-3">
        <DateRangeInput />
      </div>
    </div>
  );
}
