export function ProgressBar({
  pct,
  color = "#00cba1",
  trackClassName = "bg-brand-green-50",
  height = 8,
}: {
  pct: number;
  color?: string;
  trackClassName?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div className={`w-full rounded-full ${trackClassName}`} style={{ height }}>
      <div
        className="rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(clamped > 0 ? 2 : 0, clamped)}%`, height, background: color }}
      />
    </div>
  );
}
