import { STATUS_COLOR } from "./palette";

// Matches, longest/most-specific first: comma-grouped numbers, decimal/int
// percentages, compound durations ("3d 4h", "12h 30m"), single-unit
// durations, then bare integers -- OR one of the four outcome words.
const TOKEN_RE =
  /(\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\d+\.\d+%|\d+%|\d+d(?:\s\d+h)?|\d+h(?:\s\d+m)?|\d+m\b|\d+)|\b(Completed|Cancelled)\b/g;

function statusWordColor(word: string): string | undefined {
  return STATUS_COLOR[word];
}

/** Splits an insight sentence into plain-text and highlighted-span segments
 * (numbers/percentages/durations, and outcome words Completed/Cancelled/Rejected/Pending). */
function highlightTokens(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));

    const [full, metric, statusWord] = match;
    if (metric) {
      parts.push(
        <span key={key++} className="font-medium text-brand-green-900">
          {metric}
        </span>,
      );
    } else if (statusWord) {
      const color = statusWordColor(statusWord);
      parts.push(
        <span key={key++} className="font-medium" style={color ? { color } : undefined}>
          {statusWord}
        </span>,
      );
    } else {
      parts.push(full);
    }
    lastIndex = index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

/** Auto-generated insight sentence, shown as a chart-card footer (with top border/spacing). */
export function InsightText({ text }: { text: string }) {
  return (
    <p className="mt-4 border-t border-brand-green-700/10 pt-3 text-sm leading-relaxed text-brand-green-900/70">
      {highlightTokens(text)}
    </p>
  );
}

/** Same highlighting, no wrapper -- for embedding inline (e.g. inside a bulleted list item). */
export function InsightSpans({ text }: { text: string }) {
  return <>{highlightTokens(text)}</>;
}
