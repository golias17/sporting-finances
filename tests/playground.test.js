import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initPlayground } from "../src/playground.js";
import Chart from "chart.js/auto";

// Mock Chart to avoid jsdom canvas issues. Captures each constructed
// chart's config on a static `instances` array so tests can inspect what
// data playground.js actually drew (e.g. the equity/solvency chart's bars)
// without needing a real canvas.
vi.mock("chart.js/auto", () => {
  class Chart {
    constructor(ctx, config) {
      this.config = config;
      Chart.instances.push(this);
    }
    destroy() {}
  }
  Chart.instances = [];
  return { default: Chart };
});

describe("playground.js CFO Simulator", () => {
  beforeEach(() => {
    Chart.instances = [];

    // Setup Mock DOM
    document.body.innerHTML = `
      <section id="tab-playground">
        <select id="uclSelect">
          <option value="0">None</option>
          <option value="40">UCL</option>
        </select>
        
        <span id="payrollVal">0%</span>
        <input type="range" id="payrollSlider" min="-30" max="30" value="0" />
        
        <span id="salesVal">117 M€</span>
        <input type="range" id="salesSlider" min="0" max="150" value="117" />

        <span id="purchasesVal">30 M€</span>
        <input type="range" id="purchasesSlider" min="0" max="100" value="30" />
        
        <span id="capexVal">0%</span>
        <input type="range" id="capexSlider" min="-30" max="30" value="0" />

        <span id="debtRepayVal">0 M€</span>
        <input type="range" id="debtRepaySlider" min="0" max="50" value="0" />
        
        <button id="btnResetPlayground">Reset</button>

        <div class="kpis">
          <div class="kpi" id="pgCardRev">
            <div class="value" id="pgKpiRev">€148.1M</div>
            <div class="change" id="pgKpiRevDiff">no change</div>
          </div>
          <div class="kpi" id="pgCardNet">
            <div class="value" id="pgKpiNet">€20.0M</div>
            <div class="change" id="pgKpiNetDiff">no change</div>
          </div>
          <div class="kpi" id="pgCardEq">
            <div class="value" id="pgKpiEq">€40.9M</div>
            <div class="change" id="pgKpiEqDiff">no change</div>
          </div>
          <div class="kpi" id="pgCardCash">
            <div class="value" id="pgKpiCash">€7.0M</div>
            <div class="change" id="pgKpiCashDiff">no change</div>
          </div>
        </div>

        <canvas id="chartPlaygroundNet"></canvas>
        <canvas id="chartPlaygroundSolvency"></canvas>
      </section>
    `;

    state.isPt = false;
    state.COLORS = {
      greenSoft: "rgba(10, 93, 58, 0.4)",
      green: "#0a5d3a",
      goldSoft: "rgba(176, 137, 35, 0.4)",
      gold: "#b08923",
      chartBg: "#ffffff",
    };

    // playground.js derives its BASELINE from the real "2024/25" season in
    // state.DATASET instead of hardcoded literals — see getBaseline() in
    // src/playground.js. Values here match public/data/financials.json's
    // actual 2024/25 entry (including cash and total_assets, which the old
    // hardcoded BASELINE had gotten stale/wrong on: €7.0M vs the real
    // €15.6M cash, and €374.4M vs the real €420.7M total assets).
    state.DATASET = {
      annual_data: [
        {
          label: "2024/25",
          revenue_operating: 148149,
          personnel_costs: -87736,
          external_supplies: -48196,
          da_excl_squad: -7235,
          squad_amortization_impairment: -50218,
          player_transfer_cost: -14615,
          player_transfer_income: 116830,
          financial_result: -25246,
          net_result: 20023,
          equity: 40928,
          current_assets: 102909,
          current_liabilities: 165071,
          total_assets: 420747,
          cash: 15581,
        },
      ],
    };
  });

  it("should initialize with default values and baseline KPIs, with every KPI reading 'no change'", () => {
    initPlayground();
    expect(document.getElementById("pgKpiRev").textContent).toBe("€148.1M");
    expect(document.getElementById("pgKpiNet").textContent).toBe("€20.0M");
    // pgKpiEq always displays the *projected* (2025/26) closing equity:
    // 2024/25's closing equity (€40.9M) plus a full projected season's net
    // result (€20.0M, reconstructed to match 2024/25's actual result when
    // nothing is adjusted), i.e. €61.0M.
    expect(document.getElementById("pgKpiEq").textContent).toBe("€61.0M");
    // BASELINE.cash comes from financials.json's real 2024/25 entry
    // instead of a stale hardcoded literal (which was €7.0M vs the actual
    // €15.6M) — see getBaseline() in src/playground.js.
    expect(document.getElementById("pgKpiCash").textContent).toBe("€15.6M");

    // Every KPI is compared against a *computed* "no changes" scenario
    // (computeProjection() at DEFAULT_INPUTS), not against the raw 2024/25
    // actuals — so with every slider still at its default, all four must
    // read "no change", including Equity/Solvency, which otherwise differ
    // from the raw actual by a full season's net result even when nothing
    // has been adjusted. See computeProjection()'s comment in
    // src/playground.js for why that distinction matters.
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe("no change");
    expect(document.getElementById("pgKpiNetDiff").textContent).toBe("no change");
    expect(document.getElementById("pgKpiEqDiff").textContent).toBe("no change");
    expect(document.getElementById("pgKpiCashDiff").textContent).toBe("no change");
  });

  it('draws identical "Baseline 2025/26" and "Your Projection 2025/26" equity bars at Reset (no unexplained jump)', () => {
    // Regression test for a UX bug: the equity/solvency chart's reference
    // bar used to be the raw 2024/25 actual equity, while the "Projected"
    // bar always carried a full season's net result on top (2024/25's
    // closing equity being the *opening* balance for the 2025/26
    // projection) — so even with every slider left untouched, the
    // Projected Equity KPI showed an unexplained "+20.0M vs actual" jump.
    // The reference bar is now itself a computed "no changes" projection
    // (computeProjection() at DEFAULT_INPUTS), so at Reset both bars must
    // be identical — the chart needs no caveat to make sense.
    initPlayground();
    const solvencyChart = Chart.instances.find(
      (c) => c.config.data.datasets[0]?.label === "Shareholders' Equity (M€)",
    );
    expect(solvencyChart).toBeDefined();
    const [baselineEquity, projectedEquity] = solvencyChart.config.data.datasets[0].data;
    expect(baselineEquity).toBeCloseTo(60.951, 2);
    expect(projectedEquity).toBeCloseTo(60.951, 2);
    expect(baselineEquity).toBeCloseTo(projectedEquity, 6);
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));

    // Revenue should increase by €40M prize + €8M commercial growth (from €148.1M to €196.1M)
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe("+48.0M vs baseline");

    // Net Result and Equity should also increase by €48M
    expect(document.getElementById("pgKpiNet").textContent).toBe("€68.0M");
    expect(document.getElementById("pgKpiEq").textContent).toBe("€109.0M");
  });

  it("should decrease net result when payroll is increased", () => {
    initPlayground();
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 10; // +10% payroll increase
    payrollSlider.dispatchEvent(new Event("input"));

    // Baseline payroll is -87,736. A 10% increase is +8,773.6 expense, so Net Result decreases
    expect(document.getElementById("pgKpiNet").textContent).not.toBe("€20.0M");
    const netVal = parseFloat(document.getElementById("pgKpiNet").textContent.replace("€", "").replace("M", ""));
    expect(netVal).toBeLessThan(20.0);
  });

  it("should reset variables when reset button is clicked", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");

    document.getElementById("btnResetPlayground").click();
    expect(document.getElementById("pgKpiRev").textContent).toBe("€148.1M");
  });
});
