import { seqColor, textColorForSeq } from "../../lib/palette";

interface HeatmapProps {
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
  colorDomainMax: number;
  cellText?: (v: number, ri: number, ci: number) => string;
  tooltip: (rowLabel: string, colLabel: string, v: number, ri: number, ci: number) => string;
  /** Cell width/height in px. Defaults to 36. */
  cellSize?: number;
  fontSize?: number;
}

export function Heatmap({
  rowLabels,
  colLabels,
  matrix,
  colorDomainMax,
  cellText,
  tooltip,
  cellSize = 36,
  fontSize = 11,
}: HeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {colLabels.map((cl, ci) => (
              <th key={ci} className="px-0.5 text-[10px] font-normal text-brand-green-700">
                {cl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((rl, ri) => (
            <tr key={rl}>
              <td className="whitespace-nowrap pr-2 text-right text-xs text-brand-green-700">{rl}</td>
              {matrix[ri].map((v, ci) => {
                const t = colorDomainMax > 0 ? v / colorDomainMax : 0;
                return (
                  <td
                    key={ci}
                    title={tooltip(rl, colLabels[ci], v, ri, ci)}
                    className="rounded-md text-center align-middle font-medium"
                    style={{
                      height: cellSize,
                      minWidth: cellSize,
                      fontSize,
                      background: v ? seqColor(t) : "#00493a0d",
                      color: v ? textColorForSeq(t) : "transparent",
                    }}
                  >
                    {v && cellText ? cellText(v, ri, ci) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
