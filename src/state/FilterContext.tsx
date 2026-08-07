import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

export interface DateRange {
  start: number | null;
  end: number | null;
}

export interface FilterState {
  dept: Set<string>;
  cat: Set<string>;
  cpt: Set<string>;
  /** Not exposed as a FilterBar dropdown -- only reachable by clicking a status chart segment. */
  status: Set<string>;
  site: Set<string>;
  country: Set<string>;
  team: Set<string>;
  dateRange: DateRange;
}

export type Dimension = "dept" | "cat" | "cpt" | "status" | "site" | "country" | "team";

type FilterAction =
  | { type: "TOGGLE"; dim: Dimension; value: string }
  | { type: "ISOLATE"; dim: Dimension; value: string }
  | { type: "SET_DATE_RANGE"; range: DateRange }
  | { type: "RESET" };

const EMPTY_STATE: FilterState = {
  dept: new Set(),
  cat: new Set(),
  cpt: new Set(),
  status: new Set(),
  site: new Set(),
  country: new Set(),
  team: new Set(),
  dateRange: { start: null, end: null },
};

function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "TOGGLE": {
      const next = new Set(state[action.dim]);
      if (next.has(action.value)) next.delete(action.value);
      else next.add(action.value);
      return { ...state, [action.dim]: next };
    }
    case "ISOLATE": {
      // Clicking a chart segment: select only that value, or clear if it's
      // already the sole active selection (click again to undo).
      const current = state[action.dim];
      const isSoleSelection = current.size === 1 && current.has(action.value);
      const next = isSoleSelection ? new Set<string>() : new Set([action.value]);
      return { ...state, [action.dim]: next };
    }
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.range };
    case "RESET":
      return EMPTY_STATE;
    default:
      return state;
  }
}

interface FilterContextValue {
  filters: FilterState;
  toggle: (dim: Dimension, value: string) => void;
  isolate: (dim: Dimension, value: string) => void;
  setDateRange: (range: DateRange) => void;
  reset: () => void;
  isActive: boolean;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(reducer, EMPTY_STATE);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      toggle: (dim, value) => dispatch({ type: "TOGGLE", dim, value }),
      isolate: (dim, value) => dispatch({ type: "ISOLATE", dim, value }),
      setDateRange: (range) => dispatch({ type: "SET_DATE_RANGE", range }),
      reset: () => dispatch({ type: "RESET" }),
      isActive:
        filters.dept.size > 0 ||
        filters.cat.size > 0 ||
        filters.cpt.size > 0 ||
        filters.status.size > 0 ||
        filters.site.size > 0 ||
        filters.country.size > 0 ||
        filters.team.size > 0 ||
        filters.dateRange.start !== null ||
        filters.dateRange.end !== null,
    }),
    [filters],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within a FilterProvider");
  return ctx;
}
