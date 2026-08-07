import { useState } from "react";
import { FileText, Grid2x2, ListChecks, Sparkles, Users2, AlertTriangle, Download, RotateCcw } from "lucide-react";
import { FilterProvider } from "./state/FilterContext";
import { SectionNavProvider, useSectionNav, SECTIONS_META } from "./state/SectionNavContext";
import { InsightDrawerProvider } from "./state/InsightDrawerContext";
import { TopBar } from "./components/layout/TopBar";
import { FilterBar } from "./components/layout/FilterBar";
import { ActiveFilterChips } from "./components/layout/ActiveFilterChips";
import { InsightDrawer } from "./components/layout/InsightDrawer";
import { SectionNav } from "./components/layout/SectionNav";
import { AboutThisData } from "./components/layout/AboutThisData";
import { KpiRow } from "./components/kpi/KpiRow";
import { SectionLabel } from "./components/ui/SectionLabel";
import { ObservationsPanel } from "./components/ui/ObservationsPanel";
import { BackToTopButton } from "./components/ui/BackToTopButton";
import { MonthlyVolumeSlaChart } from "./components/charts/MonthlyVolumeSlaChart";
import { SlaComplianceChart } from "./components/charts/SlaComplianceChart";
import { StatusMixChart } from "./components/charts/StatusMixChart";
import { SiteBreakdownChart } from "./components/charts/SiteBreakdownChart";
import { ExecutiveScorecard } from "./components/charts/ExecutiveScorecard";
import { VolumeTrendChart } from "./components/charts/VolumeTrendChart";
import { CategoryBreakdownChart } from "./components/charts/CategoryBreakdownChart";
import { DepartmentBreakdownChart } from "./components/charts/DepartmentBreakdownChart";
import { CountryBreakdownChart } from "./components/charts/CountryBreakdownChart";
import { RequestHeatmapChart } from "./components/charts/RequestHeatmapChart";
import { TlApprovalHeatmapChart } from "./components/charts/TlApprovalHeatmapChart";
import { CompletionHeatmapChart } from "./components/charts/CompletionHeatmapChart";
import { CompletionRateTrendChart } from "./components/charts/CompletionRateTrendChart";
import { CancellationByDepartmentChart } from "./components/charts/CancellationByDepartmentChart";
import { SlaTrendChart } from "./components/charts/SlaTrendChart";
import { BreachDriversChart } from "./components/charts/BreachDriversChart";
import { BreachOutliersTable } from "./components/charts/BreachOutliersTable";
import { CategoryPerformanceMatrix } from "./components/charts/CategoryPerformanceMatrix";
import { CategoryVolumeDonut } from "./components/charts/CategoryVolumeDonut";
import { CategorySlaBarChart } from "./components/charts/CategorySlaBarChart";
import { TeamTopPerformers } from "./components/charts/TeamTopPerformers";
import { CptSlaBarChart } from "./components/charts/CptSlaBarChart";
import { CptVolumeVsTatChart } from "./components/charts/CptVolumeVsTatChart";
import { CheckerQcPanel } from "./components/charts/CheckerQcPanel";
import { CheckerVolumeChart } from "./components/charts/CheckerVolumeChart";
import { CptMemberProfileCards } from "./components/charts/CptMemberProfileCards";
import { CptWorkloadChart } from "./components/charts/CptWorkloadChart";
import { CptDayOfWeekChart } from "./components/charts/CptDayOfWeekChart";
import { useFilteredIndices } from "./data/useDashboardSelectors";
import {
  categoryObservations,
  cptObservations,
  executiveObservations,
  slaObservations,
  volumeObservations,
} from "./lib/observations";
import { UploadScreen } from "./upload/UploadScreen";
import { downloadStandaloneHtml, getEmbeddedDashboardData } from "./upload/downloadStandalone";
import { setDashboardData, DASHBOARD_DATA } from "./data/loadData";
import type { DashboardData } from "./data/types";

/** Looked up by id, not array position -- SECTIONS_META's order is the nav's
 * display order and can change independently of which variable name refers
 * to which section's content block below. */
function sectionById(id: string) {
  return SECTIONS_META.find((s) => s.id === id)!;
}

const executiveOverview = sectionById("section-executive-overview");
const volumeDemand = sectionById("section-volume-demand");
const timingPatterns = sectionById("section-timing-patterns");
const slaPerformance = sectionById("section-sla-performance");
const categoryPerformance = sectionById("section-category-performance");
const cptMemberInsights = sectionById("section-cpt-member-insights");
const workforceCapacity = sectionById("section-workforce-capacity");

function DashboardPages() {
  const { activeSection } = useSectionNav();
  const indices = useFilteredIndices();

  return (
    <div className="space-y-6">
      {activeSection === executiveOverview.id && (
        <section id={executiveOverview.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{executiveOverview.label}</h2>
          <KpiRow />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <MonthlyVolumeSlaChart />
            </div>
            <SlaComplianceChart />
            <StatusMixChart />
            <div className="lg:col-span-2">
              <SiteBreakdownChart />
            </div>
          </div>
          <SectionLabel>Executive Performance Scorecard</SectionLabel>
          <ExecutiveScorecard />
          <SectionLabel>Key Observations &amp; Leadership Notes</SectionLabel>
          <ObservationsPanel
            title="Key Observations & Leadership Notes"
            subtitle="Auto-generated from the current filtered view -- updates as filters change"
            icon={Sparkles}
            observations={executiveObservations(indices)}
          />
        </section>
      )}

      {activeSection === volumeDemand.id && (
        <section id={volumeDemand.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{volumeDemand.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <VolumeTrendChart />
            </div>
            <CategoryBreakdownChart />
            <DepartmentBreakdownChart />
            <div className="lg:col-span-2">
              <CountryBreakdownChart />
            </div>
            <div className="lg:col-span-2">
              <CompletionRateTrendChart />
            </div>
            <div className="lg:col-span-2">
              <CancellationByDepartmentChart />
            </div>
          </div>
          <SectionLabel>Demand Observations</SectionLabel>
          <ObservationsPanel
            title="Demand Observations"
            subtitle="Volume and concentration patterns in the current filtered view"
            icon={FileText}
            observations={volumeObservations(indices)}
          />
        </section>
      )}

      {activeSection === timingPatterns.id && (
        <section id={timingPatterns.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{timingPatterns.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <RequestHeatmapChart />
            </div>
            <div className="lg:col-span-2">
              <TlApprovalHeatmapChart />
            </div>
            <div className="lg:col-span-2">
              <CompletionHeatmapChart />
            </div>
          </div>
        </section>
      )}

      {activeSection === slaPerformance.id && (
        <section id={slaPerformance.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{slaPerformance.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <SlaTrendChart />
            </div>
            <BreachDriversChart />
            <div className="lg:col-span-2">
              <BreachOutliersTable />
            </div>
          </div>
          <SectionLabel>SLA Observations</SectionLabel>
          <ObservationsPanel
            title="SLA Observations"
            subtitle="Breach drivers and SLA trend patterns in the current filtered view"
            icon={ListChecks}
            observations={slaObservations(indices)}
          />
        </section>
      )}

      {activeSection === categoryPerformance.id && (
        <section id={categoryPerformance.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{categoryPerformance.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <CategoryPerformanceMatrix />
            </div>
            <CategoryVolumeDonut />
            <CategorySlaBarChart />
          </div>
          <SectionLabel>Category Observations</SectionLabel>
          <ObservationsPanel
            title="Category Observations"
            subtitle="Standout and at-risk categories in the current filtered view"
            icon={Grid2x2}
            observations={categoryObservations(indices)}
          />
        </section>
      )}

      {activeSection === cptMemberInsights.id && (
        <section id={cptMemberInsights.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{cptMemberInsights.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <TeamTopPerformers />
            </div>
            <div className="lg:col-span-2">
              <CptSlaBarChart />
            </div>
            <div className="lg:col-span-2">
              <CptVolumeVsTatChart />
            </div>
            <div className="lg:col-span-2">
              <CheckerQcPanel />
            </div>
            <div className="lg:col-span-2">
              <CheckerVolumeChart />
            </div>
            <div className="lg:col-span-2">
              <CptMemberProfileCards />
            </div>
          </div>
          <SectionLabel>CPT Strategic Insights for Leadership</SectionLabel>
          <ObservationsPanel
            title="CPT Strategic Insights for Leadership"
            subtitle="Auto-generated from the current filtered view -- updates as filters change"
            icon={Users2}
            observations={cptObservations(indices)}
          />
        </section>
      )}

      {activeSection === workforceCapacity.id && (
        <section id={workforceCapacity.id} className="space-y-6">
          <h2 className="text-lg font-medium text-brand-green-50">{workforceCapacity.label}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <CptWorkloadChart />
            </div>
            <div className="lg:col-span-2">
              <CptDayOfWeekChart />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Dashboard({
  unrecognizedMembers,
  onReset,
}: {
  unrecognizedMembers: string[];
  onReset: () => void;
}) {
  return (
    <FilterProvider>
      <SectionNavProvider>
        <InsightDrawerProvider>
          <main className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => downloadStandaloneHtml(DASHBOARD_DATA)}
                className="flex items-center gap-1.5 rounded-lg border border-brand-green-200/30 px-3 py-1.5 text-xs text-brand-green-200 hover:border-brand-green-200/60 hover:text-brand-green-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download standalone copy
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg border border-brand-green-200/30 px-3 py-1.5 text-xs text-brand-green-200 hover:border-brand-green-200/60 hover:text-brand-green-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Upload a different file
              </button>
            </div>

            {unrecognizedMembers.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-brand-green-50">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                <span>
                  {unrecognizedMembers.length} case assignee{unrecognizedMembers.length > 1 ? "s" : ""} not found in the roster --
                  shown under team "Unrecognized" with no tenure data: {unrecognizedMembers.join(", ")}.
                </span>
              </div>
            )}

            <TopBar />
            <FilterBar />
            <ActiveFilterChips />
            <SectionNav />

            <DashboardPages />

            <AboutThisData />
          </main>
          <InsightDrawer />
          <BackToTopButton />
        </InsightDrawerProvider>
      </SectionNavProvider>
    </FilterProvider>
  );
}

function App() {
  const [loaded, setLoaded] = useState<{ data: DashboardData; unrecognizedMembers: string[] } | null>(() => {
    const embedded = getEmbeddedDashboardData();
    if (!embedded) return null;
    setDashboardData(embedded);
    return { data: embedded, unrecognizedMembers: [] };
  });

  if (!loaded) {
    return (
      <UploadScreen
        onLoaded={(data, unrecognizedMembers) => {
          setDashboardData(data);
          setLoaded({ data, unrecognizedMembers });
        }}
      />
    );
  }

  return <Dashboard unrecognizedMembers={loaded.unrecognizedMembers} onReset={() => setLoaded(null)} />;
}

export default App;
