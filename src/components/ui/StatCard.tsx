import type { LucideIcon } from "lucide-react";

export interface StatDelta {
  text: string;
  direction: "up" | "down" | "flat";
  /** Whether this direction is good news for this specific metric -- "up" is
   * good for SLA%, bad for SLA Breached, so the caller decides, not the sign. */
  good: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  accentColor: string;
  variant?: "hero" | "outline";
  delta?: StatDelta | null;
  className?: string;
}

const ARROW = { up: "▲", down: "▼", flat: "–" };

export function StatCard({ label, value, description, icon: Icon, accentColor, variant = "outline", delta, className }: StatCardProps) {
  const isHero = variant === "hero";
  return (
    <div
      className={`relative min-h-[172px] overflow-hidden rounded-[32px] px-8 py-7 transition-colors duration-300 ${
        isHero ? "bg-brand-green-400 text-brand-green-900" : "border border-brand-green-700/15 bg-white text-brand-green-700"
      } ${className ?? ""}`}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: isHero ? "rgba(0,33,26,0.28)" : accentColor }} />
      <Icon
        size={82}
        strokeWidth={1.5}
        className="pointer-events-none absolute -right-3 -bottom-5 opacity-[0.07]"
        style={{ color: isHero ? "#00211a" : accentColor }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={isHero ? { background: "rgba(255,255,255,0.4)", color: "#00211a" } : { background: `${accentColor}1f`, color: accentColor }}
        >
          <Icon size={22} strokeWidth={2.25} />
        </span>
        <span className={`text-sm font-medium uppercase tracking-wide ${isHero ? "text-brand-green-900/85" : "text-brand-green-700"}`}>{label}</span>
      </div>
      <span className="relative mt-3 block text-5xl font-medium tabular-nums text-brand-green-900" key={value}>
        {value}
      </span>
      <div className="relative mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {description && (
          <span className={`text-xs leading-snug ${isHero ? "text-brand-green-900/70" : "text-brand-green-700/85"}`}>{description}</span>
        )}
        {delta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              delta.good ? "bg-brand-green-50 text-brand-green-700" : "bg-brand-pink-200/60 text-brand-pink-800"
            }`}
          >
            {ARROW[delta.direction]} {delta.text}
          </span>
        )}
      </div>
    </div>
  );
}
