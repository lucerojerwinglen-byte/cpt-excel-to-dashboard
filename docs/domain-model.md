# CPT Excel-to-Dashboard — Domain Model

Ubiquitous language and terminology decisions for this dashboard, pinned
down during grilling sessions so future work doesn't re-litigate them.
Update this file whenever a new term is coined or an existing one is
redefined — don't let definitions drift back into tribal knowledge.

## Case lifecycle

- **Case** — one row in the Sagiease export; one unit of CPT work,
  identified by `CaseNo`.
- **Status** — a case is either `Completed` or `Cancelled`. This is the
  *entire* status universe in the source data — there is no "In Progress"
  or other intermediate state exposed to this dashboard.
- **Total Cases** — `Completed + Cancelled` for a given period/bucket.
  Distinct from "Completed cases" alone. Used wherever a chart wants
  overall case-volume rather than only successfully closed volume.
  (Decided 2026-09-16: extend the existing `CompletionRateTrendChart`
  with a Total Cases series rather than build a parallel chart.)
- **Total Production Count** — synonym for Total Cases, but scoped to a
  specific CPT member (or team) over a day/month, i.e. "how much work did
  this person put out." `Total Production Count = Completed + Cancelled`
  for that member/period.

## Date fields

- **TaskStartDate** — the date/time a CPT member actually began working a
  case. Real column in the Sagiease export (confirmed present, zero
  blanks across a full sample export), sitting alongside `TaskEndDate`
  (already ingested as `endTs`). Not yet wired into `DashboardCols` as of
  2026-09-16.
- **RequestRaisedDate** — the date the request was raised/submitted, i.e.
  the case's queue-entry time. Ingested today as `reqTs`; this is what the
  global date-range filter currently filters on.
- Decision (2026-09-16): the app's single global date-range filter
  switches from `RequestRaisedDate` to `TaskStartDate` everywhere — not
  offered as a toggle between the two. "When was this actually worked"
  beats "when was this requested" as the filtering lens for this
  dashboard's purposes.

## TAT ("Turnaround Time") — disambiguated

The codebase used "TAT" ambiguously before this session. Two distinct
things share the name:

- **TAT target / SLA benchmark** (`tatMinutes`) — the fixed number of
  minutes a category is allowed before it breaches SLA. Comes straight
  from the Excel `TATInMinutes` column, effectively constant per
  category.
- **Actual TAT / avg completion time** (`avgActualMinutes`) — the mean of
  `ActualSeconds / 60` for completed cases. This is what "Avg TAT" already
  meant in the existing "Fastest Avg TAT" leaderboard metric, even though
  the label doesn't say "actual."
- Decision (2026-09-16): going forward, "Average TAT" (per module/overall,
  in the new Production & Utilization tab) means **actual completion
  time**, matching the leaderboard's existing (if unlabeled) convention.
  Don't reintroduce the SLA-target meaning under a bare "TAT" label without
  qualifying it explicitly as "target" or "benchmark."

## Module = Category

- **Module** (as used in the "Average TAT per module" request) has no
  separate existence in the data — there is no `module` column anywhere.
  It maps 1:1 onto the existing **Category** dimension (the case
  type/reason, already used throughout the Category Performance section).
  Treat "per module" and "per category" as synonyms; prefer "Category" in
  code/schema, "module" only if that's the label stakeholders expect in
  the UI.

## Broadpath

- **Broadpath** — a subcontractor/vendor, not a team, site, or department.
  Identified by `COMPANY_NAME == "BROADPATH GLOBAL SERVICES INC."` in the
  raw export. `COMPANY_NAME` also holds several `SAGILITY *` legal-entity
  variants (and a `"NULL"` sentinel) but those are collapsed into "the
  rest" for Broadpath-vs-not purposes — no separate handling needed for
  them today.
  `COMPANY_NAME` is currently read only to count blanks for the data-QA
  reconciliation step (`transformExcel.ts`); it is not stored in
  `DashboardCols` and not filterable as of 2026-09-16.
- Decision (2026-09-16): Broadpath gets its own dedicated nav tab (not a
  comparison panel folded into an existing section), scoped to Broadpath
  rows only — modeled as a mini Executive Overview (same KPI/scorecard
  pattern: Total Cases, Completion Rate, SLA %, Avg TAT) computed
  exclusively from Broadpath rows. Placed immediately after Executive
  Overview in the nav.

## "Top Performer" — two distinct computations, now reconciled

- **Team leaderboard** (`teamLeaderboards` / `TeamTopPerformers.tsx`) —
  four *per-team* (Philippines vs. India, ranked separately) metrics: Top
  SLA Achiever, Fastest Avg TAT, Highest Volume, Top Approver.
- **Executive scorecard** (`ScorecardData.bestCptSla`) — a separate,
  *global* (not team-split) best-SLA pick surfaced on the Executive
  Overview.
- Decision (2026-09-16): both computations move from single-winner
  (first-in-array wins ties) to full multi-winner tie support — if 15
  members tie at 100% SLA, all 15 are shown, wrapping as needed rather
  than being capped or collapsed to a count.
- The card title "Top Performers by Team" becomes **"CPT PERFORMER
  DASHBOARD"** (exact string, all-caps, per explicit instruction —
  intentionally breaking from this app's usual title-case convention for
  card titles).

## Initiator / Approver

- **Initiator** — the CPT member who processed the case.
- **Approver** — the CPT member who approves the case (often, not always,
  a different person from the initiator).
- The "Initiator–Approver Quality Signal" panel (breach rate by approver)
  is **removed** (decided 2026-09-16) — not merely renamed or
  de-duplicated. Its confound caveat text was echoed across three files
  (`CheckerQcPanel.tsx`, `insightContent.ts`, `observations.ts`); removal
  should follow the panel through all three, not just delete the card.
  `topApprover` in the team leaderboard is an unrelated, independent
  metric (ranked by `volumeChecked`) and is unaffected by this removal.

## Production & Utilization (new section)

- **Production & Utilization** — name chosen for the new nav tab over
  bare "Utilization" or "Production" because it covers both concepts
  requested: raw output count and relative share of work. Placed
  immediately after "Workforce & Capacity" in the nav.
- **Utilization %** (per CPT member) — there is no shift/capacity/target-
  hours data in this dataset (`roster.ts` only has team + start date), so
  a classic utilization definition (worked time ÷ scheduled time) is not
  computable. Redefined as a **volume share**: a member's Total
  Production Count divided by their *own team's* (Philippines or India,
  matching the existing per-team leaderboard split — not the combined
  org total) Total Production Count for the same day/month.
- Per-employee view shows **both** the raw Total Production Count and the
  volume-share %, side by side — not one or the other.
- Default granularity is **monthly**, one row per employee, with a toggle
  to drill into daily — avoids an unreadable employee×day matrix by
  default.
- **Average TAT per module** and **Average TAT overall** in this tab are
  team/org-wide summary cards (respecting existing filters), separate
  from the per-employee production table — not broken out per individual
  employee.

## Top Performer (new nav tab, decided 2026-09-16)

A leader-facing scorecard, separate from every other read-only chart in
this dashboard, that identifies one Top Performer per site (PH, IND) per
calendar month from a weighted combination of Volume, Quality, SLA, and
Leaves.

- **Placement**: new nav tab "Top Performer", right after "Production &
  Utilization".
- **Layout**: always renders both a "PH Top Performer" and an "IND Top
  Performer" table side by side, regardless of the global Team filter —
  the whole point is comparing sites, so narrowing Team elsewhere must
  not collapse this view to one table.
- **Data source, per parameter**:
  - **Volumes** — auto-pulled from the uploaded Excel: `totalAssigned`
    (Completed + Cancelled) per member for whatever period is currently
    set in the global date-range filter. Not manual entry.
  - **SLA** — auto-pulled: `slaPct` per member for the same period. Not
    manual entry.
  - **Quality** — pure manual input (0–100% slider). No source anywhere
    in the Sagiease export.
  - **Leaves** — pure manual input (Yes/No toggle). No source anywhere in
    the Sagiease export. Yes disqualifies that member from winning that
    month, but doesn't hide their row or block their Score from
    computing/displaying.
- **Period**: reuses the existing global date-range filter rather than a
  dedicated month picker. Manual entries are keyed by the **calendar
  month of the filter's start date** — leaders are expected to filter to
  one full calendar month while using this tab; a non-month range just
  gets keyed to whichever month it starts in. With no date filter set,
  the tab shows a "select a month" prompt and inputs stay disabled (there's
  no single start date to key against).
- **Volume normalization**: within each site, for the selected month, the
  member with the highest Volumes scores 100%; everyone else on that site
  scores their Volumes as a percentage of that top member's Volumes.
  Re-derived every month rather than pinned to a fixed target/quota.
- **Score** = Volume (1/3, normalized as above) + Quality (1/3) + SLA
  (1/3, treated as 0 if the member has no completed cases). Equal
  thirds — no stated business reason yet to weight one parameter over
  another. Leaves is a gate, not a weighted input. Score is shown as a
  visible column (not hidden internal math).
- **Verdict** per row: "TBD" until that member's own Quality is entered
  (or if they have zero cases that month, forced TBD unless also on
  Leave, in which case "No"); "No" if on Leave (regardless of Quality);
  otherwise "TBD" until **every** eligible (has cases, not on Leave)
  member on that site has Quality entered — the site's winner is never
  picked on partial data — then "No"/winner (trophy) once resolved. Ties
  at the winning Score reuse this app's existing multi-winner tie
  pattern (`tiedTop` in `selectors.ts`), so more than one trophy can show
  if scores tie exactly.
- **Persistence**: this app has no backend — manual Quality/Leaves
  entries auto-save to the leader's own browser via `localStorage`
  (`TopPerformerStore.tsx`). No export/import (omitted, decided
  2026-09-16) — entries are single-browser only and do not travel with
  the uploaded Excel file or the standalone HTML export.
- **Excluded members** (decided 2026-09-16): Anie Balol Sensi, Arianne
  Mae Olino Aquino, and Tanya Taroy are transferred to other work, so
  they're excluded from Top Performer scoring specifically
  (`TOP_PERFORMER_EXCLUDED_MEMBERS` in `topPerformer.ts`). They still
  appear everywhere else in the dashboard (roster totals, profile cards,
  Production & Utilization, etc.) — this exclusion is scoped to this one
  tab's calculation, not a roster-wide removal.
