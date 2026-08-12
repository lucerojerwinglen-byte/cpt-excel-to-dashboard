export const MEMBER_TICK_WIDTH = 210;
const TICK_HEIGHT = 20;

interface Props {
  x?: number;
  y?: number;
  payload?: { value: string };
  tenureByName: Map<string, string>;
}

/** Custom YAxis tick for horizontal member/approver bar charts -- recharts'
 * default tick only renders a single plain <text>, so showing a tenure pill
 * next to the name needs a real HTML layout via <foreignObject> rather than
 * hand-measuring SVG text widths. Reused by every chart with a Both/PH/India
 * toggle so the name+tenure treatment looks identical across all of them. */
export function MemberNameTenureTick({ x = 0, y = 0, payload, tenureByName }: Props) {
  const name = payload?.value ?? "";
  const tenure = tenureByName.get(name);
  return (
    <foreignObject x={x - MEMBER_TICK_WIDTH} y={y - TICK_HEIGHT / 2} width={MEMBER_TICK_WIDTH} height={TICK_HEIGHT}>
      <div className="flex h-full items-center justify-end gap-1.5 overflow-hidden">
        <span className="truncate text-[11px] text-brand-green-900" title={name}>
          {name}
        </span>
        {tenure && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-green-700/8 px-1.5 py-0.5 text-[9.5px] font-medium text-brand-green-700">
            {tenure}
          </span>
        )}
      </div>
    </foreignObject>
  );
}
