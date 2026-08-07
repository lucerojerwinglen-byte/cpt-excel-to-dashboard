/**
 * SLA Achievement target, confirmed by leadership at 95% -- see ADR 0014.
 * Single shared constant so it can't drift the way it briefly did when
 * CptSlaBarChart and CategorySlaBarChart each hardcoded their own separate
 * `BENCHMARK_PCT = 95` literal.
 */
export const SLA_TARGET_PCT = 95;
