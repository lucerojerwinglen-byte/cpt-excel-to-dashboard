import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarClock, Gauge, Grid2x2, LayoutDashboard, Users, Users2, type LucideIcon } from "lucide-react";

export interface SectionMeta {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Top-nav pages. Order here is both the nav's display order and the
 * dashboard's narrative order: how much work came in (Volume & Demand), how
 * well it was handled (SLA Performance), broken down by case type (Category
 * Performance) and by who did it (CPT Member Insights, Workforce &
 * Capacity), before ending on Timing Patterns -- a specialized operational
 * deep-dive (heatmaps, shift timing) rather than a headline metric, so it
 * comes last instead of interrupting the performance narrative. */
export const SECTIONS_META: SectionMeta[] = [
  { id: "section-executive-overview", label: "Executive Overview", icon: LayoutDashboard },
  { id: "section-volume-demand", label: "Volume & Demand", icon: BarChart3 },
  { id: "section-sla-performance", label: "SLA Performance", icon: Gauge },
  { id: "section-category-performance", label: "Category Performance", icon: Grid2x2 },
  { id: "section-cpt-member-insights", label: "CPT Member Insights", icon: Users },
  { id: "section-workforce-capacity", label: "Workforce & Capacity", icon: Users2 },
  { id: "section-timing-patterns", label: "Timing Patterns", icon: CalendarClock },
];

/** Which page owns each ChartCard id -- only the active page's charts are
 * mounted at a time, so the Insights panel's "View chart" links need this to
 * jump pages before scrolling to the target card. */
const SECTION_OF_CARD: Record<string, string> = {
  "card-volsla": "section-executive-overview",
  "card-sladonut": "section-executive-overview",
  "card-status": "section-executive-overview",
  "card-site": "section-executive-overview",
  "card-scorecard": "section-executive-overview",

  "card-volume": "section-volume-demand",
  "card-category": "section-volume-demand",
  "card-department": "section-volume-demand",
  "card-country": "section-volume-demand",
  "card-complrate": "section-volume-demand",
  "card-canceldept": "section-volume-demand",

  "card-reqheat": "section-timing-patterns",
  "card-tlheat": "section-timing-patterns",
  "card-compheat": "section-timing-patterns",

  "card-slatrend": "section-sla-performance",
  "card-breachdrivers": "section-sla-performance",
  "card-breachoutliers": "section-sla-performance",

  "card-catmatrix": "section-category-performance",
  "card-catvol": "section-category-performance",
  "card-catsla": "section-category-performance",

  "card-cptsla": "section-cpt-member-insights",
  "card-cptvoltat": "section-cpt-member-insights",
  "card-checker": "section-cpt-member-insights",
  "card-checkervolume": "section-cpt-member-insights",
  "card-teamtop": "section-cpt-member-insights",
  "card-cptprofiles": "section-cpt-member-insights",

  "card-workload": "section-workforce-capacity",
  "card-cptdow": "section-workforce-capacity",
};

interface ScrollTarget {
  id: string;
}

interface SectionNavContextValue {
  activeSection: string;
  setActiveSection: (id: string) => void;
  /** Switch to whichever page owns `cardId` (a no-op if already there), then
   * scroll it into view once that page's charts have mounted. */
  navigateToCard: (cardId: string) => void;
}

const SectionNavContext = createContext<SectionNavContextValue | null>(null);

export function SectionNavProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState(SECTIONS_META[0].id);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null);

  function navigateToCard(cardId: string) {
    setActiveSection(SECTION_OF_CARD[cardId] ?? SECTIONS_META[0].id);
    // A fresh object every call, even for the same cardId, so re-clicking the
    // same insight bullet re-scrolls instead of being a no-op dependency.
    setScrollTarget({ id: cardId });
  }

  // Runs after the (possibly new) active page has committed and painted --
  // rAF, not a plain effect body, so getElementById finds the card instead of
  // racing the just-switched page's first render.
  useEffect(() => {
    if (!scrollTarget) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(scrollTarget.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollTarget]);

  return (
    <SectionNavContext.Provider value={{ activeSection, setActiveSection, navigateToCard }}>
      {children}
    </SectionNavContext.Provider>
  );
}

export function useSectionNav(): SectionNavContextValue {
  const ctx = useContext(SectionNavContext);
  if (!ctx) throw new Error("useSectionNav must be used within a SectionNavProvider");
  return ctx;
}
