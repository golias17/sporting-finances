import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initComparison } from "../src/compare.js";

describe("compare.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="compareSeasonA"></select>
      <select id="compareSeasonB"></select>
      <span id="cmpHeadA"></span>
      <span id="cmpHeadB"></span>
      <div id="chartCompareRevenue"></div>
      <div id="chartCompareEquity"></div>
      <div id="chartCompareDebt"></div>
      <div id="chartCompareWages"></div>
      <div id="cmpNarrative"></div>
      <div id="comparisonGrid"></div>
    `;

    // Mock state
    state.isPt = false;
    state.DATASET = {
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
        }
      ]
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 1;
    state.baseOpts = { scales: { y: {} } };
    
    // Mock Chart.js which is used inside mkChart internally called by compare.js
    vi.mock("../src/charts.js", async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        mkChart: vi.fn(),
      };
    });
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
    state.isPt = true;
    initComparison();
    
    const narrative = document.getElementById("cmpNarrative").innerHTML;
    expect(narrative).toContain("A receita cresceu 100% — de €30.0M para €60.0M");
    expect(narrative).toContain("O capital próprio passou a ser positivo");
    expect(narrative).toContain("Custos com pessoal: de 50% para 33% da receita.");
  });
});
