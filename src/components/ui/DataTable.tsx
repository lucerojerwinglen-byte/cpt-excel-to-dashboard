export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export function DataTable({ headers, rows }: TableData) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-brand-green-700/10">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-brand-green-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium text-brand-green-900/70">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-brand-green-700/8 odd:bg-brand-green-50/30">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`whitespace-nowrap px-3 py-1.5 text-brand-green-900 ${ci > 0 ? "text-right tabular-nums" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-brand-green-700">
                No data for the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
