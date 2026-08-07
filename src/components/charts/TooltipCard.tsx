import type { ReactNode } from "react";

export function TooltipCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-green-700/10 bg-white px-3 py-2 text-sm shadow-lg">
      {children}
    </div>
  );
}
