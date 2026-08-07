export type PillTone = "green" | "blue" | "amber" | "pink" | "sage" | "neutral";

const TONE_CLASSES: Record<PillTone, string> = {
  green: "bg-brand-green-50 text-brand-green-700 border-brand-green-400/30",
  blue: "bg-brand-blue-100 text-brand-blue-800 border-brand-blue-500/25",
  amber: "bg-[#eda10022] text-[#8a6108] border-[#eda10040]",
  pink: "bg-brand-pink-200/60 text-brand-pink-800 border-brand-pink-400/35",
  sage: "bg-brand-green-200/40 text-brand-green-700 border-brand-green-400/30",
  neutral: "bg-brand-green-700/8 text-brand-green-700 border-brand-green-700/15",
};

export function Pill({ label, tone = "neutral" }: { label: string; tone?: PillTone }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
