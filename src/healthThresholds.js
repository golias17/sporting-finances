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
  // `crisis` is a third, note-text-only tier below `danger` (used to
  // distinguish "heavy debt load" from "crisis territory" — the status
  // color itself still just goes red at `danger`).
  netDebtRatio: { warn: 1, danger: 2, crisis: 4 },
  transferReliance: { warn: 0.35, danger: 0.5 },
  currentRatio: { danger: 0.5, warn: 1.0 },

  // The four ratios above also drive the zone-annotated charts in charts.js.
  // The three below are absolute €k cutoffs (this dataset's unit) used only
  // by metrics.js's calculateHealthSignals() health-check cards — there's
  // no matching chart yet, but they're centralized here anyway since they
  // used to be inline numbers duplicated between a signal's `status` color
  // and its `note` text, and had drifted out of sync with each other (see
  // git history: equity's status turned green at 10000 while its note text
  // still called anything below 20000 "just turned positive").
  equity: { strong: 20000, positive: 0, mild: -20000, deep: -50000 },
  cash: { warn: 20000, danger: 5000 },
  recurringOpProfit: { warn: 0, danger: -5000 },
};
