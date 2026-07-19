import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { state } from "../src/state.js";
import { initPlayground } from "../src/playground.js";
import { chartRegistry } from "../src/chartUtils.js";

// playground.js now builds its two charts via charts.js's mkChart() helper
// (see src/charts.js) instead of hand-rolling `new Chart(...)` — the same
// helper every other chart in the app uses, which is what gives it the
// screen-reader accessible data table and PNG download button for free.
// That means these tests need the *real* Chart.js (mkChart imports the real
// `chart.js/auto` module-level `Chart.register(...)` calls, which a fake
// Chart class without a static `.register()` would break), with jsdom's
// canvas 2D context mocked out — the same setup tests/chart.test.js uses.
describe("playground.js CFO Simulator", () => {
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const mockContext = {
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      closePath: () => {},
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 0, height: 0 }),
      setTransform: () => {},
      resetTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => {},
      createRadialGradient: () => {},
      canvas: null,
    };
    if (global.CanvasRenderingContext2D) {
      Object.setPrototypeOf(mockContext, global.CanvasRenderingContext2D.prototype);
    }
    HTMLCanvasElement.prototype.getContext = function () {
      mockContext.canvas = this;
      return mockContext;
    };
  });

  beforeEach(() => {
    // Destroy (not just drop) any charts left over from the previous test —
    // mkChart() reuses an existing registry entry via chart.update() rather
    // than tearing it down, so simply clearing the Map without destroy()
    // first orphans the old Chart instance's internal resize/mutation
    // observers, which then fire asynchronously against an already-replaced
    // (or, between test files, already-torn-down) DOM.
    chartRegistry.forEach((chart) => chart.destroy());
    chartRegistry.clear();

    // Setup Mock DOM — mirrors index.html's actual playground markup
    // (including the .card/.card-head/.chart-box wrapper structure) closely
    // enough that mkChart()'s generateAccessibleTable()/addChartDownloadButton()
    // can find their expected insertion points.
    document.body.innerHTML = `
      <section id="tab-playground">
        <div class="pg-presets">
          <button data-pg-preset="conservative">Conservative</button>
          <button data-pg-preset="base">Base Case</button>
          <button data-pg-preset="optimistic">Optimistic</button>
        </div>

        <select id="uclSelect">
          <option value="0">None</option>
          <option value="36">League Phase</option>
          <option value="40">UCL</option>
          <option value="47" selected>Round of 16</option>
          <option value="60">Quarter-finals</option>
        </select>

        <span id="revGrowthVal">0%</span>
        <input type="range" id="revGrowthSlider" min="-10" max="15" value="0" />

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

        <div class="card">
          <div class="card-head"><h3>Simulated Financials vs. Baseline</h3></div>
          <div class="chart-box"><canvas id="chartPlaygroundNet"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Equity & Solvency Health</h3></div>
          <div class="chart-box"><canvas id="chartPlaygroundSolvency"></canvas></div>
        </div>
      </section>
    `;

    state.isPt = false;
    state.COLORS = {
      ink: "#1a1a1a",
      muted: "#6a716e",
      rule: "rgba(0, 0, 0, 0.05)",
      greenSoft: "rgba(10, 93, 58, 0.4)",
      green: "#0a5d3a",
      goldSoft: "rgba(176, 137, 35, 0.4)",
      gold: "#b08923",
      pos: "#2e8a55",
      neg: "#b8403a",
      chartBg: "#ffffff",
    };
    // Mirrors the shape initChartDefaults() (chartUtils.js) builds in the
    // real app — playground.js's chart options now spread ...state.baseOpts
    // (for the themed glass tooltip, bottom legend, and axis tick/grid
    // colors every other chart gets) instead of building options from a
    // bare {}, so the mock needs the same scales.x/scales.y/plugins shape.
    state.baseOpts = {
      scales: {
        x: { ticks: { font: { size: 11 }, color: "#6a716e" }, grid: { display: false } },
        y: {
          ticks: { font: { size: 11 }, color: "#6a716e", callback: () => "" },
          grid: { color: "rgba(0,0,0,0.05)" },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } },
        tooltip: { enabled: false, external: () => {}, callbacks: { footer: () => "" } },
      },
    };
    state.urlPlayground = null;

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

  afterEach(() => {
    chartRegistry.forEach((chart) => chart.destroy());
    chartRegistry.clear();
  });

  it("should initialize with default values and baseline KPIs, with every KPI reading 'no change'", () => {
    initPlayground();
    // DEFAULT_INPUTS now assumes a Round of 16 UCL campaign (uclPrize: 47,
    // matching the <select>'s `selected` option — see the comment on
    // DEFAULT_INPUTS in src/playground.js) instead of no European football
    // at all, so the default projection bakes in +€47M prize + €8M
    // commercial spillover on top of the raw 2024/25 actuals.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€203.1M");
    expect(document.getElementById("pgKpiNet").textContent).toBe("€75.0M");
    // pgKpiEq always displays the *projected* (2025/26) closing equity:
    // 2024/25's closing equity (€40.9M) plus a full projected season's net
    // result (€75.0M under the default Round-of-16 assumption), i.e.
    // €116.0M.
    expect(document.getElementById("pgKpiEq").textContent).toBe("€116.0M");
    // BASELINE.cash comes from financials.json's real 2024/25 entry
    // instead of a stale hardcoded literal (which was €7.0M vs the actual
    // €15.6M) — see getBaseline() in src/playground.js.
    expect(document.getElementById("pgKpiCash").textContent).toBe("€70.6M");

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
    const solvencyChart = chartRegistry.get("chartPlaygroundSolvency");
    expect(solvencyChart).toBeDefined();
    expect(solvencyChart.config.data.datasets[0].label).toBe("Shareholders' Equity (M€)");
    const [baselineEquity, projectedEquity] = solvencyChart.config.data.datasets[0].data;
    expect(baselineEquity).toBeCloseTo(115.951, 2);
    expect(projectedEquity).toBeCloseTo(115.951, 2);
    expect(baselineEquity).toBeCloseTo(projectedEquity, 6);
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));

    // Revenue itself only depends on the selected value (€40M prize + €8M
    // commercial growth on top of the €148.1M actual), regardless of what
    // DEFAULT_INPUTS assumes. The diff is what changed: the default
    // baseline now assumes Round of 16 (+€47M+€8M), a bigger UCL run than
    // League Phase/Group Stage (+€40M+€8M), so switching to League Phase
    // reads as a €7M *downgrade* from baseline, not an upgrade.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe("-7.0M vs baseline");

    // Net Result and Equity should also increase by €48M
    expect(document.getElementById("pgKpiNet").textContent).toBe("€68.0M");
    expect(document.getElementById("pgKpiEq").textContent).toBe("€109.0M");
  });

  it("should decrease net result when payroll is increased", () => {
    initPlayground();
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 10; // +10% payroll increase
    payrollSlider.dispatchEvent(new Event("input"));

    // Baseline payroll is -87,736. A 10% increase is +8,773.6 expense, so Net
    // Result decreases relative to the default projection's €75.0M (see
    // DEFAULT_INPUTS's comment in src/playground.js for why 75.0 and not
    // 20.0 — it assumes a Round of 16 UCL run, not no European football).
    expect(document.getElementById("pgKpiNet").textContent).not.toBe("€75.0M");
    const netVal = parseFloat(document.getElementById("pgKpiNet").textContent.replace("€", "").replace("M", ""));
    expect(netVal).toBeLessThan(75.0);
  });

  it("should reset variables when reset button is clicked", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");

    document.getElementById("btnResetPlayground").click();
    // Reset re-applies DEFAULT_INPUTS, which now assumes uclPrize: 47
    // (Round of 16) rather than 0 — see the comment on DEFAULT_INPUTS in
    // src/playground.js.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€203.1M");
  });

  it("should increase projected revenue when organic revenue growth is raised", () => {
    initPlayground();
    const revGrowthSlider = document.getElementById("revGrowthSlider");
    revGrowthSlider.value = 10; // +10% organic growth
    revGrowthSlider.dispatchEvent(new Event("input"));

    // The UCL control is left at its default (Round of 16, +€47M+€8M):
    // (148.149 * 1.10) + 47 + 8 = 217.9639
    expect(document.getElementById("pgKpiRev").textContent).toBe("€218.0M");
    expect(document.getElementById("revGrowthVal").textContent).toBe("+10%");
  });

  it("should apply the Optimistic preset's full slider combination in one click", () => {
    initPlayground();
    document.querySelector('[data-pg-preset="optimistic"]').click();

    expect(document.getElementById("uclSelect").value).toBe("60");
    expect(document.getElementById("payrollSlider").value).toBe("10");
    expect(document.getElementById("salesSlider").value).toBe("140");
    expect(document.getElementById("purchasesSlider").value).toBe("60");
    expect(document.getElementById("capexSlider").value).toBe("0");
    expect(document.getElementById("debtRepaySlider").value).toBe("20");
    expect(document.getElementById("revGrowthSlider").value).toBe("8");
    // Optimistic should be a strict improvement over the do-nothing baseline.
    expect(document.getElementById("pgKpiNetDiff").className).toContain("pos");
  });

  it("should apply the Conservative preset and the Base Case preset should match Reset", () => {
    initPlayground();
    document.querySelector('[data-pg-preset="conservative"]').click();
    expect(document.getElementById("pgKpiNetDiff").className).toContain("neg");

    document.querySelector('[data-pg-preset="base"]').click();
    expect(document.getElementById("pgKpiNetDiff").textContent).toBe("no change");
    expect(document.getElementById("uclSelect").value).toBe("47");
    expect(document.getElementById("revGrowthSlider").value).toBe("0");
  });

  it("highlights the matching preset button and clears it once a slider is moved away", () => {
    initPlayground();
    const baseBtn = document.querySelector('[data-pg-preset="base"]');
    const optimisticBtn = document.querySelector('[data-pg-preset="optimistic"]');
    const conservativeBtn = document.querySelector('[data-pg-preset="conservative"]');

    // Default sliders (Base Case's own values) start out matching "base".
    expect(baseBtn.classList.contains("active")).toBe(true);
    expect(baseBtn.getAttribute("aria-pressed")).toBe("true");
    expect(optimisticBtn.classList.contains("active")).toBe(false);

    optimisticBtn.click();
    expect(optimisticBtn.classList.contains("active")).toBe(true);
    expect(optimisticBtn.getAttribute("aria-pressed")).toBe("true");
    expect(baseBtn.classList.contains("active")).toBe(false);
    expect(conservativeBtn.classList.contains("active")).toBe(false);

    // Dragging any slider away from the Optimistic preset's exact value
    // should drop the highlight — none of the three presets match anymore.
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 25;
    payrollSlider.dispatchEvent(new Event("input"));
    expect(optimisticBtn.classList.contains("active")).toBe(false);
    expect(baseBtn.classList.contains("active")).toBe(false);
    expect(conservativeBtn.classList.contains("active")).toBe(false);

    // Reset should bring the highlight back to "base".
    document.getElementById("btnResetPlayground").click();
    expect(baseBtn.classList.contains("active")).toBe(true);
  });

  it("gives both playground charts a screen-reader data table and a PNG download button, like every other chart", () => {
    // Regression test: playground.js used to hand-roll chartRegistry.set()
    // + `new Chart(...)` instead of going through charts.js's mkChart()
    // helper, so it was the only chart pair in the app missing the
    // accessible-table toggle and download button every other chart gets
    // automatically.
    initPlayground();

    expect(document.getElementById("chartPlaygroundNet-a11y-table")).not.toBeNull();
    expect(document.getElementById("chartPlaygroundNet-table-toggle")).not.toBeNull();
    expect(document.getElementById("chartPlaygroundNet-download-btn")).not.toBeNull();

    expect(document.getElementById("chartPlaygroundSolvency-a11y-table")).not.toBeNull();
    expect(document.getElementById("chartPlaygroundSolvency-table-toggle")).not.toBeNull();
    expect(document.getElementById("chartPlaygroundSolvency-download-btn")).not.toBeNull();
  });

  it("formats the dual-axis equity/solvency accessible table with each column in its own axis's units", () => {
    // Regression test for generateAccessibleTable()'s dataset-aware
    // formatting (chartUtils.js): the Equity column (€M, already in
    // millions here) must not be re-divided by 1000, and the Solvency
    // column (%) must not be mistaken for currency, even though they share
    // one table generated from one dual-axis chart.
    initPlayground();
    const table = document.getElementById("chartPlaygroundSolvency-a11y-table");
    const bodyText = table.querySelector("tbody").textContent;
    expect(bodyText).toContain("€116.0M");
    expect(bodyText).toMatch(/24\.4%/);
  });
});
