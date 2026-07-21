import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../../src/core/state.js";
import { initComparison } from "../../src/features/compare.js";
import { chartRegistry } from "../../src/charts/chartUtils.js";
import { mockChartEnvironment } from "../charts/chartTestUtils.js";

// Uses the real mkChart() (and thus the real chartRegistry) rather than
// mocking it out, so the tests below can confirm renderComparison() actually
// registers its chart under the canvas ID ("compareBarChart") that main.js's
// TAB_CHART_IDS.compare / CHART_DRAWING_FUNCTIONS entries key off of — a
// mismatch there (main.js used to say "chartCompare") silently broke the
// tab's chart-teardown-on-navigate-away behavior with nothing catching it.
mockChartEnvironment();

describe("compare.js", () => {
  beforeEach(() => {
    // Real chartRegistry is shared module state — clear it each test so
    // mkChart() always takes its "create a new Chart against this test's
    // fresh canvas element" branch instead of trying to .update() a Chart
    // instance left over from a previous test's now-removed canvas.
    chartRegistry.clear();

    document.body.innerHTML = `
      <select id="compareSeasonA"></select>
      <select id="compareSeasonB"></select>
      <span id="cmpHeadA"></span>
      <span id="cmpHeadB"></span>
      <canvas id="compareBarChart"></canvas>
      <div id="cmpNarrative"></div>
      <div id="comparisonGrid"></div>
    `;

    // Mock state
    state.setIsPt(false);
    state.setDataset({
      annual_data: [
        {
          label: "2012/13",
          revenue_operating: 30000,
          personnel_costs: -15000,
          equity: -100000,
          borrowings_nc: 50000,
          borrowings_c: 10000,
          cash: 5000,
        },
        {
          label: "2024/25",
          revenue_operating: 60000,
          personnel_costs: -20000,
          equity: 10000,
          borrowings_nc: 40000,
          borrowings_c: 5000,
          cash: 15000,
        },
      ],
    });
    state.baseOpts = { scales: { y: {} } };
    state.setUrlCmpA(null);
    state.setUrlCmpB(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("should initialize the comparison selects with all seasons", () => {
    initComparison();

    const selA = document.getElementById("compareSeasonA");
    const selB = document.getElementById("compareSeasonB");

    expect(selA.options.length).toBe(2);
    expect(selB.options.length).toBe(2);

    expect(selA.options[0].textContent).toBe("2012/13");
    expect(selA.options[1].textContent).toBe("2024/25");

    // By default selA selects the first, selB selects the last
    expect(selA.value).toBe("0");
    expect(selB.value).toBe("1");
  });

  it("should render comparison narrative correctly in English", () => {
    initComparison(); // also calls renderComparison

    const narrative = document.getElementById("cmpNarrative").innerHTML;
    expect(narrative).toContain("Revenue grew 100% — from €30.0M to €60.0M");
    expect(narrative).toContain("Equity crossed zero");
    expect(narrative).toContain("Wage bill: 50% → 33% of revenue.");
  });

  it("should render comparison narrative correctly in Portuguese", () => {
    state.setIsPt(true);
    initComparison();

    const narrative = document.getElementById("cmpNarrative").innerHTML;
    expect(narrative).toContain(
      "A receita cresceu 100% — de €30.0M para €60.0M",
    );
    expect(narrative).toContain("O capital próprio passou a ser positivo");
    expect(narrative).toContain(
      "Custos com pessoal: de 50% para 33% da receita.",
    );
  });

  it("should restore comparison values from URL stashed labels", () => {
    state.setUrlCmpA("2024/25");
    state.setUrlCmpB("2012/13");

    initComparison();

    const selA = document.getElementById("compareSeasonA");
    const selB = document.getElementById("compareSeasonB");
    expect(selA.value).toBe("1"); // Index of 2024/25
    expect(selB.value).toBe("0"); // Index of 2012/13
  });

  it("should render comparison narrative when equity does not cross zero", () => {
    // Both seasons have negative equity
    state.DATASET.annual_data[0].equity = -100000;
    state.DATASET.annual_data[1].equity = -50000;

    // English
    state.setIsPt(false);
    initComparison();
    let narrative = document.getElementById("cmpNarrative").innerHTML;
    expect(narrative).toContain("Equity moved from €−100.0M to €−50.0M");

    // Portuguese
    state.setIsPt(true);
    initComparison();
    narrative = document.getElementById("cmpNarrative").innerHTML;
    expect(narrative).toContain(
      "O capital próprio passou de €−100.0M para €−50.0M",
    );
  });

  it("does nothing (no throw) when the season selects are missing", () => {
    document.body.innerHTML = "";
    expect(() => initComparison()).not.toThrow();
  });

  it("does nothing (no throw) when a comparison output element (e.g. cmpNarrative) is missing", () => {
    document.getElementById("cmpNarrative").remove();
    expect(() => initComparison()).not.toThrow();
    // The grid, which is written after narEl in renderComparison, should
    // never have been reached — confirms this is a genuine early return,
    // not a partially-applied render.
    expect(document.getElementById("comparisonGrid").innerHTML).toBe("");
  });

  // Regression test: main.js's TAB_CHART_IDS.compare used to list a canvas
  // ID ("chartCompare") that renderComparison() never actually builds a
  // chart under — it registers under "compareBarChart" — so
  // destroyInactiveCharts() silently found nothing to tear down whenever the
  // user navigated away from the Compare tab, and the chart instance leaked
  // for the rest of the session. This pins down the real ID so that
  // regression can't reoccur unnoticed.
  it("registers its chart in chartRegistry under the 'compareBarChart' canvas ID", () => {
    initComparison();
    const chart = chartRegistry.get("compareBarChart");
    expect(chart).toBeDefined();
    expect(chartRegistry.get("chartCompare")).toBeUndefined();
  });

  it("destroys and rebuilds the chart under the same ID on a second call (simulating a revisit)", () => {
    initComparison();
    const firstChart = chartRegistry.get("compareBarChart");
    expect(firstChart).toBeDefined();

    // Simulate what main.js's destroyInactiveCharts() does when the user
    // navigates away from the Compare tab, then what runOnce(initComparison)
    // does when they come back.
    firstChart.destroy();
    chartRegistry.delete("compareBarChart");

    expect(() => initComparison()).not.toThrow();
    const secondChart = chartRegistry.get("compareBarChart");
    expect(secondChart).toBeDefined();
  });
});
