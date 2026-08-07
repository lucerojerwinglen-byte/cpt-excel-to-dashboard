export interface RangeStats {
  mean: number;
  median: number;
  p10: number;
  p90: number;
  n: number;
}

export function percentile(sortedArr: number[], p: number): number | null {
  if (!sortedArr.length) return null;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
}

export function statsOf(arr: number[]): RangeStats | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mean = s.reduce((sum, v) => sum + v, 0) / s.length;
  return {
    mean,
    median: percentile(s, 50)!,
    p10: percentile(s, 10)!,
    p90: percentile(s, 90)!,
    n: s.length,
  };
}
