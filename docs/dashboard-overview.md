# CPT Excel-to-Dashboard — Overview

## What this app is

The CPT Excel-to-Dashboard turns the raw Sagiease CPT export (the .xlsx
report) into a visual dashboard. You upload the Excel file, and the app
builds the whole dashboard right there in your browser — charts, KPIs,
everything.

No backend, no install, nothing leaves your machine: the file is read and
processed entirely client-side, in JavaScript, in the browser tab you have
it open in.

For today, the dashboard has already been generated and saved as one
self-contained HTML file — `CPT-Excel-to-Dashboard-2026-08-10.html`. Opening
that file loads straight into the finished dashboard, no upload step
needed.

## The sample dashboard

Built from `Report_04082027_1 (3).xlsx`, generated 2026-08-10.

| Metric | Value |
| --- | --- |
| Cases analyzed | 46,455 |
| Coverage | Jul 23, 2025 – Aug 2, 2026 (~13 months) |
| Completed / Cancelled | 38,789 (83.5%) / 7,666 (16.5%) |
| CPT members | 17 (10 Philippines · 7 India) |
| Departments / Sites | 201 / 90 |
| Data quality | 99.97% of rows reconcile cleanly (12 mismatches out of 46,455) |

The dashboard is organized into 7 tabs, in this order, across the top.
Every chart also has an **Insights** button (Key Finding / Why It Matters
/ Suggested Action) — the one-liners below are the short version of that.

### 1. Executive Overview

The one-page summary — read this one first, everything else in the
dashboard is this page broken down further.

- **KPI row** — 5 headline numbers: Total Cases, SLA Achievement Rate,
  Avg Processing Time, SLA Breached, CPT Members.
- **Executive Performance Scorecard** — 6 standout figures in one strip:
  peak SLA month, lowest SLA month, peak volume month, the single worst
  turnaround-time outlier recorded, total completed cases, and the best
  individual CPT SLA performer.
- **Monthly Volume & SLA Achievement Trend** — bars for case volume,
  a line for SLA Achievement % over the same period, with a dashed
  target line. Weekly/monthly toggle.
- **SLA Compliance** — donut of Met vs. Breached (completed cases only),
  with the % met shown in the center.
- **Case Status Mix** — donut of Completed vs. Cancelled, across every
  case in view. Click a slice to filter the whole dashboard to it.
- **Volume by Site** — bar chart of the top 10 (of 90) delivery-center
  sites by case count.

### 2. Volume & Demand

How much work came in, and where from.

- **Case Volume Trend** — Completed vs. Cancelled over time, as a line
  chart. Daily/weekly/monthly toggle.
- **Volume by Case Category** — bar chart ranking case types by volume.
- **Volume by Department** — top 8 (of 201) departments/accounts by
  volume.
- **Volume by Country** — split by the requesting site's country.
- **Completion Rate Trend** — Completed ÷ Total over time, as a line.
- **Cancellation Rate by Department** — top 15 departments by volume,
  ranked by what share of their cases get cancelled.

### 3. SLA Performance

How well that work was handled.

- **SLA Achievement Trend** — % over time with a target reference line,
  completed cases only.
- **SLA Breach Drivers: Hold vs. No Hold** — compares the breach rate for
  cases that used a "hold" (paused on something outside CPT's control,
  while the SLA clock keeps running) against cases that never paused —
  with a plain-language multiplier callout (e.g. "2.3× more likely to
  breach").
- **Worst SLA Breaches** — a searchable, scrollable list of every
  completed case that breached SLA, worst overage first, with case
  number, category, CPT member, and minutes over benchmark.

### 4. Category Performance

The same performance question, split by case type instead of over time —
useful for spotting a category that's structurally harder than the rest.

- **Category Performance Matrix** — one table row per category: volume,
  SLA met count, SLA %, avg/median turnaround time, benchmark, and a
  status pill (Outstanding / Excellent / Monitor / Focus).
- **Volume Distribution** — a ranked bar (deliberately not a donut —
  one category dominates enough that a donut would collapse the rest
  into unreadable slivers).
- **SLA % by Category** — a bubble chart: volume (log scale) on one
  axis, SLA % on the other, bubble size = volume. Flags any category
  that combines real volume with below-target SLA — the "fix this
  first" view.

### 5. CPT Member Insights

Performance by team member. Real names and hire dates from the CPT
roster appear here, not sample data.

- **SLA Achievement — All CPT Members** — a ranked "lollipop" chart of
  SLA % per member, colored by tier (below target / on target /
  exceeding), members with 10+ completed cases only. Toggle by team.
- **Volume vs. Average Processing Time** — members ranked by completed
  volume, with average minutes shown alongside each bar. Both/Philippines/
  India toggle, and a tenure badge (e.g. "~3mo") next to each name so a
  recent joiner's lower volume reads as early rather than underperforming.
- **Initiator–Approver Quality Signal** ("Checker QC") — the SLA breach
  rate of cases each approver signed off on. Explicitly labeled
  correlational, not a verdict on the approver — case-type mix and the
  original initiator's work both confound it. Both/Philippines/India
  toggle and tenure badge, same as the volume chart above; approvers with
  no team match (an unrecognized name, or a Team Lead who approves without
  processing cases) only appear under "Both."
- **Approver Case Volume** — ranked bar of who approved the most
  completed cases. Same toggle and tenure badge treatment.
- **Top Performers by Team** — 4 mini-stat cards per team (Top SLA
  Achiever, Fastest Avg TAT, Highest Volume, Top Approver). Philippines
  and India are ranked separately so one team's outlier can't overshadow
  the other's.
- **Individual Member Profiles** — a full card per member (all 17):
  completed count, SLA %, avg TAT, tenure, a per-category breakdown
  table, best/worst category tags, and badges (Top SLA / Fastest /
  Highest Volume / "Ramping" for members under the 25-case ranking
  threshold).

### 6. Workforce & Capacity

A step back from individual performance to staffing.

- **CPT Member Workload** — completed cases per member, ranked. Same
  Both/Philippines/India toggle and tenure badge as the CPT Member
  Insights charts above; clicking a bar isolates that member across the
  whole dashboard via the sidebar's CPT member filter.
- **CPT Activity by Day of Week** — a heatmap of what share of each
  member's own completions falls on each weekday (row-normalized, so
  it's shape not volume), plus team totals by day. Philippines/India
  toggle (each on its own local timezone).

### 7. Timing Patterns

Heatmaps of exactly when work arrives, gets approved, and gets
completed — more operational detail than a leadership readout usually
needs, which is why it comes last rather than interrupting the
performance story.

- **Request Time Heatmap** — when new cases are raised (requester-side
  timestamp), by day and hour.
- **SagiEase Entry Time Heatmap** — when cases actually land in CPT's
  queue, after Team Lead approval.
- **Completion Time Heatmap** — when CPT closes out work (Completed and
  Cancelled cases), by day and hour.

## Two things worth knowing while navigating

- Every chart has an **Insights** button that opens it up next to three
  fields: Key Finding, Why It Matters, Suggested Action — the built-in
  explanation for what you're looking at.
- Filters (date range, team, department, etc.) sit at the top of every
  page. Applying one recalculates everything below it, charts and KPIs
  alike.
- Scrolling to the bottom of any page reveals **About This Data** — the
  data quality and definitions panel behind the numbers above.
