import type { LucideIcon } from "lucide-react";

interface MiniStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

/** Compact KPI-card look (icon circle + big number + label) for panels that
 * need several small stats side by side rather than the 5 headline metrics
 * StatCard is sized for -- same visual language (top accent bar, tinted icon
 * circle), just scaled down so a grid of 8 doesn't dominate the page. */
export function MiniStatCard({ icon: Icon, label, value, sub, color }: MiniStatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-green-700/12 bg-white px-4 py-3.5 transition-shadow hover:shadow-md">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}1f`, color }}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <span className="truncate text-[10.5px] font-medium uppercase tracking-wide text-brand-green-700">{label}</span>
      </div>
      <p className="mt-2.5 text-2xl font-semibold tabular-nums text-brand-green-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-brand-green-700/80">{sub ?? "—"}</p>
    </div>
  );
}
