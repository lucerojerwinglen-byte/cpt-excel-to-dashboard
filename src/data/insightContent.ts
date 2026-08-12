/**
 * Static "Why It Matters" + default "Suggested Action" copy for the per-chart
 * insight drawer (InsightDrawer.tsx), keyed by ChartCard id. This content
 * stays fixed regardless of the active filter (by design) -- each chart's own
 * `insight` string is the live, filter-aware "Key Finding" instead.
 */
export interface InsightContent {
  whyItMatters: string;
  suggestedAction: string;
}

export const INSIGHT_CONTENT: Record<string, InsightContent> = {
  "card-volsla": {
    whyItMatters:
      "Volume and SLA% moving in opposite directions is the clearest early signal that CPT capacity isn't keeping pace with demand -- a rising bar with a falling line is a staffing conversation, not a process one.",
    suggestedAction:
      "Watch for months where the SLA line dips while the volume bar climbs -- that combination, not either signal alone, is the one worth escalating.",
  },
  "card-sladonut": {
    whyItMatters:
      "SLA Achievement Rate is the single number leadership will be asked about most often -- it needs to be trustworthy at a glance, which is why it's computed on Completed cases only, using hold-excluded Actual Completion Minutes.",
    suggestedAction:
      "If this rate ever looks unexpectedly low, check the SLA Performance tab's breach drivers before assuming a process problem -- a spike in cases without a hold applied is a different fix than a genuine slowdown.",
  },
  "card-volume": {
    whyItMatters:
      "A widening gap between Completed and Cancelled volume over time is an early warning sign worth catching before it shows up in the completion-rate KPI.",
    suggestedAction:
      "Worth checking whether a widening gap correlates with a known business event -- if it's seasonal, it's plannable; if it's random, it's a capacity buffer question.",
  },
  "card-category": {
    whyItMatters:
      "CPT is, in practice, overwhelmingly a Move Worker processing team. Every downstream metric is mostly a story about Move Worker specifically.",
    suggestedAction:
      "If there's appetite to improve a metric across the board, target the dominant case type first -- it's the highest-leverage category by a wide margin.",
  },
  "card-department": {
    whyItMatters:
      "A dominant account's scale means any process change, staffing gap, or system issue affecting that single account has an outsized effect on CPT's overall numbers.",
    suggestedAction:
      "Consider whether the top 3-5 accounts warrant a dedicated point of contact, given how much of CPT's total throughput runs through a small number of relationships.",
  },
  "card-site": {
    whyItMatters:
      "Site is a distinct axis from Department -- it's the delivery-center/facility view, useful for staffing and capacity questions that a client-account cut can't answer.",
    suggestedAction:
      "Use Site rather than Department when the question is about delivery-center capacity or staffing, not client-account relationship management.",
  },
  "card-country": {
    whyItMatters:
      "Requests now originate from multiple countries, not just the Philippines -- country-level volume shows how much of CPT's real workload that broader scope represents.",
    suggestedAction:
      "If a non-Philippines country's volume grows, consider whether those requests have meaningfully different characteristics (turnaround, category mix) worth tracking separately.",
  },
  "card-slatrend": {
    whyItMatters:
      "A steady or improving SLA% over time is a sign of a maturing process; a declining trend, especially alongside rising volume, is the earliest sign SLA commitments are at risk.",
    suggestedAction:
      "Set an explicit internal target SLA% (e.g. 95%+ sustained) if recent performance shows it's realistically achievable, and treat any month below it as worth a root-cause look.",
  },
  "card-breachdrivers": {
    whyItMatters:
      "A hold's entire purpose is stopping the SLA clock. If cases with a hold applied still breach at a meaningfully higher rate than cases without one, holds aren't fully protecting the cases that need them.",
    suggestedAction:
      "If the with-hold breach rate is notably higher, investigate whether holds are being logged late relative to when the case actually paused.",
  },
  "card-breachoutliers": {
    whyItMatters:
      "A handful of extreme breaches can pull attention away from the more common, moderate ones -- seeing the worst cases individually is what a percentage alone can't show.",
    suggestedAction:
      "Spot-check the top few outliers for a shared cause (same category, same member, same week) before treating them as independent one-offs.",
  },
  "card-catmatrix": {
    whyItMatters:
      "Categories have wildly different SLA benchmarks (20 minutes for Move Worker vs. 1,560 for Sup-Org Creation) -- a single blended SLA% would hide which specific case type is actually struggling.",
    suggestedAction:
      "Prioritize process attention on whichever category combines high volume with a sub-target SLA% -- that's where a fix moves the most cases.",
  },
  "card-catsla": {
    whyItMatters:
      "Volume and SLA% each tell an incomplete story alone -- a low-SLA category with tiny volume is a footnote, the same low SLA% on the dominant category is a crisis. Plotting them together surfaces which categories are both high-stakes and at-risk, something neither the ranked bar nor the Matrix table shows as directly.",
    suggestedAction:
      "Prioritize any category sitting both to the right (high volume) and below the 95% benchmark line -- that combination is where a fix moves the most cases.",
  },
  "card-catvol": {
    whyItMatters:
      "Category volume mix determines where process investment pays off fastest -- improving a low-volume category's SLA% moves the needle far less than the same improvement on the dominant category.",
    suggestedAction:
      "Weight any category-specific initiative by its share of volume here, not just by how bad its SLA% looks in isolation.",
  },
  "card-cptsla": {
    whyItMatters:
      "SLA% varies by CPT member for reasons that include category mix and tenure, not just individual speed -- ranking members side by side only tells the full story alongside the tenure-normalized profile cards.",
    suggestedAction:
      "Before treating a lower SLA% as a coaching need, check that member's category mix and tenure in the profile cards below -- a newer member on a harder category mix isn't underperforming, they're early.",
  },
  "card-teamtop": {
    whyItMatters:
      "Philippines and India are different-sized, different-tenure teams, so a single cross-team ranking tends to be dominated by whichever team is larger or longer-tenured -- ranking each team separately surfaces a real leader in both.",
    suggestedAction:
      "Use these as recognition talking points, not a cross-team comparison -- an India-team leader's raw numbers aren't directly comparable to a Philippines-team leader's given the tenure and volume gap between the two teams today.",
  },
  "card-cptvoltat": {
    whyItMatters:
      "Volume and speed can trade off against each other -- a member processing the most cases isn't necessarily the fastest per case, and vice versa.",
    suggestedAction:
      "Look for members who are both high-volume and fast -- their approach may be worth documenting as a team-wide best practice.",
  },
  "card-checker": {
    whyItMatters:
      "Approval is a quality gate CPT already performs but has never analyzed. An approver whose approved cases breach SLA more than peers is worth a look -- but as the panel itself notes, category mix and the underlying initiator's work confound the raw number.",
    suggestedAction:
      "Cross-check a high-breach approver's category mix and the initiators they most often approve for before treating the number as a verdict on the approver's own judgment.",
  },
  "card-checkervolume": {
    whyItMatters:
      "Case approval is real, uncompensated workload sitting on top of an approver's own case processing -- a heavily concentrated volume here is a staffing/resilience question, the same way CPT Member Workload is on the Workforce & Capacity tab.",
    suggestedAction:
      "If approval volume is as concentrated as processing volume, consider whether more members should be authorized to approve, rather than routing every case through the same few approvers.",
  },
  "card-cptprofiles": {
    whyItMatters:
      "Individual performance only means something in context -- tenure, team, and category mix all affect the raw numbers, which is why each profile shows cases-per-day-of-tenure alongside lifetime totals.",
    suggestedAction:
      "Use cases-per-day (not lifetime volume) when comparing across very different tenures, especially between the newer India team and the longer-tenured Philippines team.",
  },
  "card-workload": {
    whyItMatters:
      "Heavy concentration among a few CPT members is a resilience risk, not just an interesting distribution. If any of the top handful is out for an extended period, throughput takes an immediate hit. The tenure badge next to each name is there so a newer joiner sitting low on this ranking reads as early rather than underperforming.",
    suggestedAction:
      "Review whether the spread reflects intentional specialization or simply how work has been assigned, and whether redistributing volume adds resilience. Use the Both/Philippines/India toggle to compare a member against their own team rather than the combined ranking.",
  },
  "card-cptdow": {
    whyItMatters:
      "A member whose completion pattern differs sharply from the team norm may be on a different shift or schedule worth knowing about before reading their raw numbers as a performance signal.",
    suggestedAction:
      "Cross-reference an unusual day-of-week pattern with the Completion Time Heatmap before drawing conclusions about that member's pace.",
  },
  "card-complrate": {
    whyItMatters:
      "A steadier, higher completion rate over time is a sign of a maturing process, especially if it holds through a high-volume stretch.",
    suggestedAction:
      "Consider setting an explicit internal target completion rate if recent performance shows it's realistically achievable.",
  },
  "card-status": {
    whyItMatters:
      "Cancelled is the one outcome CPT and its upstream partners can realistically influence -- unlike volume itself, which is largely demand-driven.",
    suggestedAction:
      "Track Cancellation Rate by Department (Volume & Demand tab) to see whether cancellations concentrate in specific accounts worth a direct conversation.",
  },
  "card-canceldept": {
    whyItMatters:
      "A wide spread between the best and worst major accounts on the exact same process usually means the cause is upstream of CPT -- a client-relationship pattern, not a systemic one.",
    suggestedAction:
      "Worth a direct conversation with the account team behind the highest cancellation rate -- understanding why so many of their cases get cancelled could surface a fixable upstream habit.",
  },
  "card-reqheat": {
    whyItMatters:
      "Demand doesn't respect CPT's schedule -- a meaningful share of requests may land when the team's coverage is lightest, which matters for staffing decisions. Caveat: verified against the raw case data that this isn't a timezone issue -- the requester-side submission pattern here just doesn't track a clean human activity curve the way Completion Time does, so read the shape as directional.",
    suggestedAction:
      "Compare against the Completion Time Heatmap -- if request and completion peaks are close in clock time, coverage is already well-aligned to demand. Treat the exact hour labels here as directional, not a precise activity read.",
  },
  "card-tlheat": {
    whyItMatters:
      "This is when cases actually land in CPT's queue after Team Lead / SagiEase approval -- the moment the SLA clock effectively starts being CPT's to own. Caveat: per the source data dictionary, this single field blends two different events (TL's own approval, or the case entering the Sagiease system) rather than one clean approval-activity timestamp.",
    suggestedAction:
      "A concentrated approval-entry window suggests TL approvals are batched rather than continuous -- worth knowing when planning CPT staffing coverage, but treat exact hours as directional given the field mixes two event types.",
  },
  "card-compheat": {
    whyItMatters:
      "This is CPT's actual working window across both teams -- the clearest picture of when the combined Philippines + India team is really active.",
    suggestedAction:
      "Read alongside the Request Time Heatmap -- a close match between request and completion peaks means current coverage is already well-positioned.",
  },
};
