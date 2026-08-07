// CPT roster: team + tenure start date. Sourced directly from the user, not
// the Excel file (Workday doesn't track team/hire-date for this report).
// Single-month entries use the 1st of that month; multi-month ranges (given
// as a batch, not per-person) use the midpoint month's 1st, since the source
// only specified a range for that whole cohort, not individual join dates --
// tenure figures for that cohort are therefore approximate, flagged as such
// in the UI (see CPT Member Insights).
//
// This is deliberately committed as plain source, not injected privately at
// build time: whatever the client-side bundle needs at runtime is visible in
// the deployed JS regardless of whether it started out public or private, so
// privately injecting it would add build complexity for no actual gain. Real
// employee names and hire dates are therefore publicly visible on the
// deployed site to anyone with the link -- a conscious tradeoff in exchange
// for simplicity (no per-session roster upload).
export const ROSTER: Record<string, [team: "Philippines" | "India", startDate: string]> = {
  "Michelle Odo Agon": ["Philippines", "2025-07-01"],
  "Jhalene Danga Austria": ["Philippines", "2025-07-01"],
  "Linda Abletia Sagun": ["Philippines", "2025-07-01"],
  "Jerwin Glen Alejandre Lucero": ["Philippines", "2025-08-01"],
  "Sonia Verma": ["Philippines", "2025-11-01"],
  "Joan Canencia Salvador": ["Philippines", "2026-02-01"],
  "Nicole Marie Tayong Damasco": ["Philippines", "2026-02-01"],
  "Arianne Mae Olino Aquino": ["Philippines", "2026-03-15"], // Feb-Apr 2026 cohort, midpoint
  "Tanya Taroy": ["Philippines", "2026-03-15"],
  "Anie Balol Sensi": ["Philippines", "2026-03-15"],
  "Merige Dakshayani": ["India", "2026-05-15"], // Mar-Jul 2026 cohort, midpoint
  "Anjali .": ["India", "2026-05-15"],
  "A Sachin Kumar": ["India", "2026-05-15"],
  "Thanuja .": ["India", "2026-05-15"],
  "Mohammed Fazil": ["India", "2026-05-15"],
  "Varsha S": ["India", "2026-05-15"],
  "Gururaj B N": ["India", "2026-05-15"],
};

export const APPROX_TENURE_MEMBERS = new Set<string>([
  "Arianne Mae Olino Aquino",
  "Tanya Taroy",
  "Anie Balol Sensi",
  "Merige Dakshayani",
  "Anjali .",
  "A Sachin Kumar",
  "Thanuja .",
  "Mohammed Fazil",
  "Varsha S",
  "Gururaj B N",
]);

/** Team label assigned to a case-assignee name not found in ROSTER -- kept
 * distinct from "Philippines"/"India" so an unrecognized member (e.g. a new
 * hire not yet added to this file) never gets silently misattributed to a
 * real team. Falls outside the LocalTeam ("Philippines" | "India") union
 * selectors.ts uses for team-scoped toggles, so such members are simply
 * absent from those toggle views -- but they still show up everywhere else
 * (roster totals, workload, profile cards) tagged with this label. */
export const UNRECOGNIZED_TEAM = "Unrecognized";

/** Below this many completed cases, a member is excluded from best/worst
 * rankings and intervention call-outs (still gets a full profile card,
 * tagged "Ramping" in the UI) -- keeps a small joiner from being auto-named
 * the worst performer next to a high-volume veteran. */
export const MIN_COMPLETED_FOR_RANKING = 100;
