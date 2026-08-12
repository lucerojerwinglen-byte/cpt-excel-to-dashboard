# CPT Excel-to-Dashboard

Vocabulary specific to how this dashboard models CPT team performance, beyond what's derivable from the source Excel export itself.

## Language

**Local Team Toggle**:
A per-chart team control (Both/Philippines/India, or Philippines/India-only for charts where "Both" wouldn't make sense, e.g. `CptDayOfWeekChart`'s per-team timezone basis) that fully owns team scope for that one chart, ignoring the sidebar's global Team filter so the chart's own selection can't be silently constrained or emptied by whatever the sidebar happens to be set to. "Both" means every row regardless of team, including members/approvers with no team match at all (`Unrecognized` CPT members, unmatched approvers) -- those only ever appear under "Both", never under a specific team pick, since attributing them to a team they don't belong to would be fabricated.
_Avoid_: Team filter, sidebar toggle (those refer to the global `FilterBar` Team filter, a different control with different scoping rules)

**Ramping**:
A CPT member whose completed-case count is below `MIN_COMPLETED_FOR_RANKING` (roster.ts) -- excluded from best/worst rankings and coaching call-outs, but still shown everywhere else (profile cards, workload charts) with a "Ramping" badge.
_Avoid_: New, newcomer, low sample -- Ramping is about completed-case volume specifically, not tenure (see Tenure below); the two often correlate but aren't the same signal.

**Tenure**:
Days since a CPT member's roster start date (`ROSTER` in roster.ts), shown as a compact badge (e.g. "~3mo") next to a member's name on charts that rank by volume or quality. A distinct signal from Ramping: a member can have long tenure and still be Ramping (low volume for reasons other than being new), or short tenure and already clear the Ramping threshold.
_Avoid_: Active days (used in conversation, but "tenure" is the term already used in code -- `tenureDays`, `tenureLabel()`)
