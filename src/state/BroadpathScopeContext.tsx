import { createContext, useContext, type ReactNode } from "react";

const BroadpathScopeContext = createContext(false);

/** Wraps a subtree so every chart mounted inside it -- reused verbatim from
 * the rest of the dashboard, unmodified -- sees only Broadpath's rows. This
 * works because every chart's row indices ultimately come from one of three
 * hooks in useDashboardSelectors.ts (useFilteredIndices,
 * useFilteredIndicesForTeam, useFilteredIndicesAnyTeam); those three check
 * this context and additionally restrict to Broadpath when it's set, so no
 * individual chart component needs to know Broadpath scoping exists. */
export function BroadpathScopeProvider({ children }: { children: ReactNode }) {
  return <BroadpathScopeContext.Provider value={true}>{children}</BroadpathScopeContext.Provider>;
}

export function useIsBroadpathScoped(): boolean {
  return useContext(BroadpathScopeContext);
}
