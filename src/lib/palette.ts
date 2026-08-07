// Chart colors drawn from Sagility's brand swatches, chosen (not just picked
// in brand order) so neighboring series stay distinguishable at 6-11 series.
export const SERIES_PALETTE = [
  "#00cba1", // brand green
  "#0050ff", // brand blue
  "#e96be2", // brand pink
  "#1e2867", // brand navy
  "#00493a", // dark green
  "#55aaff", // light blue
  "#c82ebf", // magenta
  "#531367", // dark purple
  "#6efacd", // mint
  "#26093b", // darkest purple
  "#bceaff", // pale blue
] as const;

export function seriesColor(index: number): string {
  return SERIES_PALETTE[index % SERIES_PALETTE.length];
}

export const STATUS_COLOR: Record<string, string> = {
  Completed: "#00cba1",
  Cancelled: "#e96be2",
};

export const SLA_COLOR: Record<string, string> = {
  "SLA Met": "#00cba1",
  "SLA Breached": "#e96be2",
};

export const TEAM_COLOR: Record<string, string> = {
  Philippines: "#00cba1",
  India: "#0050ff",
};

/** Calm 3-tone semantic palette for observation tiles and alert banners --
 * deliberately NOT a rotating rainbow (see ACCENTS below, used for avatar
 * identity instead): every tile's color should mean something (good news /
 * needs attention / neutral context), not just "which slot it's in".
 * `warning` reuses the deeper --color-status-critical swatch rather than the
 * softer --color-status-serious pink already used for routine pills, so a
 * genuine risk call-out reads as urgent instead of blending in. */
export const TONE_COLOR = {
  good: "#00cba1",
  warning: "#c82ebf",
  info: "#0050ff",
} as const;

export type Tone = keyof typeof TONE_COLOR;

/** Per-card colour identity, cycled across KPI tiles / observation cards / scorecard
 * cells so no two neighbors share a hue -- the mockup's "every card has a colour"
 * visual language, built from the same brand swatches as SERIES_PALETTE. Widened to
 * 10 entries (was 6) so a ~8-9 member team roster can get a distinct color per
 * member instead of 2-3 repeats landing on green, which is also this dashboard's
 * dominant chrome colour and was reading as "too much green" on member cards. */
export const ACCENTS = [
  { fg: "#00cba1", bg: "rgba(0,203,161,0.12)", border: "rgba(0,203,161,0.3)" }, // green
  { fg: "#0050ff", bg: "rgba(0,80,255,0.12)", border: "rgba(0,80,255,0.3)" }, // blue
  { fg: "#e96be2", bg: "rgba(233,107,226,0.14)", border: "rgba(233,107,226,0.32)" }, // pink
  { fg: "#eda100", bg: "rgba(237,161,0,0.14)", border: "rgba(237,161,0,0.32)" }, // amber
  { fg: "#c82ebf", bg: "rgba(200,46,191,0.14)", border: "rgba(200,46,191,0.32)" }, // magenta
  { fg: "#6efacd", bg: "rgba(110,250,205,0.16)", border: "rgba(110,250,205,0.35)" }, // mint
  { fg: "#1e2867", bg: "rgba(30,40,103,0.12)", border: "rgba(30,40,103,0.3)" }, // navy
  { fg: "#55aaff", bg: "rgba(85,170,255,0.14)", border: "rgba(85,170,255,0.32)" }, // light blue
  { fg: "#531367", bg: "rgba(83,19,103,0.14)", border: "rgba(83,19,103,0.32)" }, // dark purple
  { fg: "#bceaff", bg: "rgba(188,234,255,0.35)", border: "rgba(188,234,255,0.6)" }, // pale blue
] as const;

export function accentFor(index: number) {
  return ACCENTS[index % ACCENTS.length];
}

const SEQ_LIGHT: [number, number, number] = [227, 255, 243]; // pale mint
const SEQ_DARK: [number, number, number] = [0, 33, 26]; // brand darkest green

/** Sequential ramp for heatmaps, pale mint -> darkest brand green. t in [0,1]. */
export function seqColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, Number.isNaN(t) ? 0 : t));
  const r = Math.round(SEQ_LIGHT[0] + (SEQ_DARK[0] - SEQ_LIGHT[0]) * clamped);
  const g = Math.round(SEQ_LIGHT[1] + (SEQ_DARK[1] - SEQ_LIGHT[1]) * clamped);
  const b = Math.round(SEQ_LIGHT[2] + (SEQ_DARK[2] - SEQ_LIGHT[2]) * clamped);
  return `rgb(${r},${g},${b})`;
}

export function textColorForSeq(t: number): string {
  return t > 0.55 ? "#00211a" : "#ffffff";
}
