// Single source of truth for the "how healthy is this ratio" cutoffs used
// in two places that must agree: the health-check cards + sparklines
// (metrics.js: calculateHealthSignals) and the equivalent zone-annotated
// line charts (charts.js: chartPayrollBurden, chartTransferReliance,
// chartDebtLoad, chartCurrentRatio). Before this file existed, both sides
// hardcoded the same numbers independently — changing a cutoff in one
// place without remembering the other would leave a health card and its
// own chart disagreeing about whether the same season is green or red.
//
// Values are in each ratio's natural unit: payrollRatio and
// transferReliance are fractions of revenue (0.6 = 60%), netDebtRatio and
// currentRatio are multiples (2 = 2x). Consumers that display percentages
// (the charts.js payroll/transfer-reliance charts) scale by 100 at the
// call site — the canonical values here stay in the same unit metrics.js
// already used, since that's the larger/more central consumer.
//
// For payrollRatio, netDebtRatio and transferReliance, higher is worse:
// below `warn` is green, between `warn` and `danger` is amber, at or above
// `danger` is red. currentRatio is inverted — lower is worse.
export const HEALTH_THRESHOLDS = {
  payrollRatio: { warn: 0.6, danger: 0.7 },
  netDebtRatio: { warn: 1, danger: 2 },
  transferReliance: { warn: 0.35, danger: 0.5 },
  currentRatio: { danger: 0.5, warn: 1.0 },
};
