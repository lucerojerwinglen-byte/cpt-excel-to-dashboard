export interface ScorecardCell {
  value: string;
  label: string;
  sub?: string;
  color: string;
}

/** Divided strip of value/label/sub cells -- lives inside a ChartCard's white
 * container, so cells are separated by hairline borders rather than a
 * colored grid gap (which would disappear against the card's own white bg).
 * Each cell carries a top accent bar and a soft tint on hover so the strip
 * reads as six distinct metrics rather than one flat table row. */
export function ScorecardStrip({ cells }: { cells: ScorecardCell[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-brand-green-700/10 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((c, i) => (
        <div key={i} className="group relative bg-white px-3 pt-4 pb-4 text-center transition-colors hover:bg-brand-green-50/40">
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.color }} />
          <p className="text-2xl font-semibold tabular-nums" style={{ color: c.color }}>
            {c.value}
          </p>
          <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wide text-brand-green-700">{c.label}</p>
          {c.sub && (
            <p className="mt-1 text-[11px] font-medium" style={{ color: c.color }}>
              {c.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
