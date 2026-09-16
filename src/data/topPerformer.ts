import { tiedTop, type CptMemberStats, type LocalTeam } from "./selectors";

/** Transferred to other work -- still shown everywhere else in the
 * dashboard (roster totals, profile cards, etc.), but excluded from Top
 * Performer scoring specifically, per leadership request (2026-09-16). */
export const TOP_PERFORMER_EXCLUDED_MEMBERS = new Set<string>(["Anie Balol Sensi", "Arianne Mae Olino Aquino", "Tanya Taroy"]);

/** Equal weighting across Volume, Quality, and SLA -- confirmed with
 * leadership. Leaves is a pass/fail eligibility gate, not part of this
 * weighted math: a disqualified member's score still computes and displays,
 * it just can't win. */
export const TOP_PERFORMER_WEIGHTS = { volume: 1 / 3, quality: 1 / 3, sla: 1 / 3 } as const;

export interface TopPerformerEntry {
  /** 0-100, null until a leader enters it -- the only one of the four
   * parameters with no source in the uploaded Excel. */
  quality: number | null;
  /** On leave/absent during the scored month. */
  leaves: boolean;
}

export type TopPerformerVerdict = "winner" | "no" | "tbd";

export interface TopPerformerRow {
  name: string;
  team: string;
  volumes: number;
  slaPct: number | null;
  quality: number | null;
  leaves: boolean;
  score: number | null;
  verdict: TopPerformerVerdict;
}

export interface TopPerformerBoard {
  rows: TopPerformerRow[];
  /** True once every eligible (has cases this month, not on leave) member's
   * Quality is entered. The site's winner stays "tbd" for every row until
   * this flips, so no one is crowned on partial data. */
  resolved: boolean;
}

function scoreOf(volumes: number, maxVolumes: number, slaPct: number | null, quality: number | null): number | null {
  if (quality === null) return null;
  const volumeNorm = maxVolumes > 0 ? (volumes / maxVolumes) * 100 : 0;
  return volumeNorm * TOP_PERFORMER_WEIGHTS.volume + quality * TOP_PERFORMER_WEIGHTS.quality + (slaPct ?? 0) * TOP_PERFORMER_WEIGHTS.sla;
}

/** Builds one site's Top Performer leaderboard for the scored month. Volumes
 * come from `members` (already Completed+Cancelled per cptMemberStats,
 * pre-filtered to the active date range), Quality/Leaves come from the
 * caller's persisted manual entries for that month. */
export function topPerformerBoard(members: CptMemberStats[], team: LocalTeam, entries: Record<string, TopPerformerEntry>): TopPerformerBoard {
  const teamMembers = members.filter((m) => m.team === team && !TOP_PERFORMER_EXCLUDED_MEMBERS.has(m.name));
  const maxVolumes = teamMembers.reduce((max, m) => Math.max(max, m.totalAssigned), 0);

  const rows: TopPerformerRow[] = teamMembers.map((m) => {
    const entry = entries[m.name] ?? { quality: null, leaves: false };
    return {
      name: m.name,
      team: m.team,
      volumes: m.totalAssigned,
      slaPct: m.slaPct,
      quality: entry.quality,
      leaves: entry.leaves,
      score: scoreOf(m.totalAssigned, maxVolumes, m.slaPct, entry.quality),
      verdict: "tbd",
    };
  });

  const eligible = rows.filter((r) => r.volumes > 0 && !r.leaves);
  const resolved = eligible.length > 0 && eligible.every((r) => r.score !== null);
  const winners = new Set(resolved ? tiedTop(eligible, (r) => r.score!, (r) => r.name, true)?.names ?? [] : []);

  for (const r of rows) {
    if (r.volumes === 0) r.verdict = r.leaves ? "no" : "tbd";
    else if (r.leaves) r.verdict = "no";
    else if (!resolved) r.verdict = "tbd";
    else r.verdict = winners.has(r.name) ? "winner" : "no";
  }

  return { rows, resolved };
}
