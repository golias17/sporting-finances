import { describe, it, expect } from "vitest";
import { HEALTH_THRESHOLDS } from "../../src/features/healthThresholds.js";

// This file is the single source of truth shared by metrics.js's
// calculateHealthSignals() and charts.js's zone-annotated line charts —
// see the comment at the top of healthThresholds.js. These tests exist to
// catch the exact failure mode that motivated centralizing the values in
// the first place: a threshold edited without noticing its "worse" bound
// no longer sits on the correct side of its "better" bound.
describe("healthThresholds.js", () => {
  it("orders warn below danger for the higher-is-worse ratios", () => {
    expect(HEALTH_THRESHOLDS.payrollRatio.warn).toBeLessThan(
      HEALTH_THRESHOLDS.payrollRatio.danger,
    );
    expect(HEALTH_THRESHOLDS.netDebtRatio.warn).toBeLessThan(
      HEALTH_THRESHOLDS.netDebtRatio.danger,
    );
    expect(HEALTH_THRESHOLDS.transferReliance.warn).toBeLessThan(
      HEALTH_THRESHOLDS.transferReliance.danger,
    );
  });

  it("orders danger below crisis for netDebtRatio's extra tier", () => {
    expect(HEALTH_THRESHOLDS.netDebtRatio.danger).toBeLessThan(
      HEALTH_THRESHOLDS.netDebtRatio.crisis,
    );
  });

  it("orders danger below warn for currentRatio, the one inverted (lower-is-worse) metric", () => {
    expect(HEALTH_THRESHOLDS.currentRatio.danger).toBeLessThan(
      HEALTH_THRESHOLDS.currentRatio.warn,
    );
  });

  it("orders equity's four descending tiers correctly (strong > positive > mild > deep)", () => {
    const { strong, positive, mild, deep } = HEALTH_THRESHOLDS.equity;
    expect(strong).toBeGreaterThan(positive);
    expect(positive).toBeGreaterThan(mild);
    expect(mild).toBeGreaterThan(deep);
  });

  it("orders cash's warn above danger (lower cash is worse)", () => {
    expect(HEALTH_THRESHOLDS.cash.warn).toBeGreaterThan(
      HEALTH_THRESHOLDS.cash.danger,
    );
  });

  it("orders recurringOpProfit's warn above danger (lower profit is worse)", () => {
    expect(HEALTH_THRESHOLDS.recurringOpProfit.warn).toBeGreaterThan(
      HEALTH_THRESHOLDS.recurringOpProfit.danger,
    );
  });

  it("exposes every ratio/metric the app's consumers rely on", () => {
    expect(Object.keys(HEALTH_THRESHOLDS).sort()).toEqual(
      [
        "payrollRatio",
        "netDebtRatio",
        "transferReliance",
        "currentRatio",
        "equity",
        "cash",
        "recurringOpProfit",
      ].sort(),
    );
  });
});
