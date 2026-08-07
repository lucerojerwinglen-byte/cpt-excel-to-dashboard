import type { ReactNode } from "react";

/** Uppercase divider label with a leading accent dash and trailing rule --
 * marks the start of an observation block or scorecard on the dark page
 * background, between the white ChartCard sections. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 mb-3 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-green-200">
      <span className="h-0.5 w-4 shrink-0 rounded-full bg-brand-green-400" />
      <span className="whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-brand-green-50/15" />
    </div>
  );
}
