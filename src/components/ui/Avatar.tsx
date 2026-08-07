import { accentFor } from "../../lib/palette";

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter((p) => p !== "." && p.length > 0);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, accentIndex, size = 44 }: { name: string; accentIndex: number; size?: number }) {
  const a = accentFor(accentIndex);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl text-sm font-medium"
      style={{ width: size, height: size, background: a.bg, color: a.fg, border: `1px solid ${a.border}` }}
    >
      {initialsOf(name)}
    </span>
  );
}
