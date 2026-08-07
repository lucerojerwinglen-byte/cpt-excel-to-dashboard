import { createContext, useContext, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface DrawerContent {
  cardId: string;
  title: string;
  icon?: LucideIcon;
  /** The chart's own live, filter-aware insight sentence -- reused as-is. */
  keyFinding: string;
  /** Live-computed replacement for INSIGHT_CONTENT's static default, passed
   * only by charts whose authored action names a specific category/department/
   * site that can change under a filter. */
  suggestedActionOverride?: string;
  /** The chart's own rendered element (ChartCard's `children`), re-rendered
   * beside the insight text in the spotlight modal so the chart is never
   * covered while its insights are open. */
  chart: ReactNode;
}

interface InsightDrawerContextValue {
  open: DrawerContent | null;
  openDrawer: (content: DrawerContent) => void;
  closeDrawer: () => void;
}

const InsightDrawerContext = createContext<InsightDrawerContextValue | null>(null);

export function InsightDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DrawerContent | null>(null);
  return (
    <InsightDrawerContext.Provider value={{ open, openDrawer: setOpen, closeDrawer: () => setOpen(null) }}>
      {children}
    </InsightDrawerContext.Provider>
  );
}

export function useInsightDrawer(): InsightDrawerContextValue {
  const ctx = useContext(InsightDrawerContext);
  if (!ctx) throw new Error("useInsightDrawer must be used within an InsightDrawerProvider");
  return ctx;
}
