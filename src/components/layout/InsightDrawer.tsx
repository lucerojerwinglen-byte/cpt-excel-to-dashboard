import { useEffect } from "react";
import { X } from "lucide-react";
import { useInsightDrawer } from "../../state/InsightDrawerContext";
import { INSIGHT_CONTENT } from "../../data/insightContent";
import { InsightSpans } from "../../lib/insightText";

/** Per-chart Key Finding / Why It Matters / Suggested Action spotlight,
 * opened by the "Insights" button on a ChartCard. Re-renders the chart's own
 * element (same data, same props) floating beside its insight text in a
 * centered modal, so the chart is never covered by the panel that explains
 * it -- unlike a side drawer, which can end up over or beside the very chart
 * it's describing depending on where that card sits in the grid.
 * Always mounted (so the scale/fade transition has something to animate
 * from/to) but visually and interactively inert while closed. */
export function InsightDrawer() {
  const { open, closeDrawer } = useInsightDrawer();
  const content = open ? INSIGHT_CONTENT[open.cardId] : null;
  const Icon = open?.icon;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeDrawer]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-green-900/40 p-4 transition-opacity duration-300 sm:p-8 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={closeDrawer}
      aria-hidden={!open}
    >
      <div
        className={`flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,33,26,0.35)] transition-transform duration-300 ease-out ${
          open ? "scale-100" : "scale-95"
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {open && content && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-brand-green-700/10 p-5">
              <div className="flex items-center gap-2.5">
                {Icon && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-700">
                    <Icon size={19} strokeWidth={2.25} />
                  </span>
                )}
                <h3 className="text-base font-medium text-brand-green-900">{open.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-brand-green-700 transition-colors hover:bg-brand-green-50"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.6fr_1fr]">
              <div className="overflow-y-auto border-b border-brand-green-700/10 p-6 lg:border-r lg:border-b-0">
                {open.chart}
              </div>

              <div className="space-y-6 overflow-y-auto p-6">
                <section>
                  <h4 className="inline-flex rounded-full bg-brand-green-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-green-700">
                    Key Finding
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-brand-green-900/85">
                    <InsightSpans text={open.keyFinding} />
                  </p>
                </section>

                <section>
                  <h4 className="inline-flex rounded-full bg-brand-green-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-green-700">
                    Why It Matters
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-brand-green-900/85">{content.whyItMatters}</p>
                </section>

                <section>
                  <h4 className="inline-flex rounded-full bg-brand-green-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-green-700">
                    Suggested Action
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-brand-green-900/85">
                    {open.suggestedActionOverride ?? content.suggestedAction}
                  </p>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
