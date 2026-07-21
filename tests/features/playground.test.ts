import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { state } from "../../src/core/state.js";
import {
  initPlayground,
  drawPlaygroundCharts,
} from "../../src/features/playground.js";
import { chartRegistry } from "../../src/charts/chartUtils.js";
import { mockChartEnvironment } from "../charts/chartTestUtils.js";
import * as urlSync from "../../src/utils/urlSync.js";

// playground.js now builds its two charts via charts.js's mkChart() helper
// (see src/charts.js) instead of hand-rolling `new Chart(...)` — the same
// helper every other chart in the app uses, which is what gives it the
// screen-reader accessible data table and PNG download button for free.
// That means these tests need the *real* Chart.js (mkChart imports the real
// `chart.js/auto` module-level `Chart.register(...)` calls, which a fake
// Chart class without a static `.register()` would break), with jsdom's
// canvas 2D context mocked out — see chartTestUtils.js.
describe("playground.js CFO Simulator", () => {
  beforeAll(() => {
    mockChartEnvironment();
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
        <button id="btnPinScenario" aria-pressed="false">
          <span id="btnPinScenarioLabel">Pin This Scenario</span>
        </button>
        <div class="pg-pin-readout" id="pgPinReadout"></div>

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
            <div class="pg-zone" id="pgKpiEqZone"></div>
          </div>
          <div class="kpi" id="pgCardCash">
            <div class="value" id="pgKpiCash">€7.0M</div>
            <div class="change" id="pgKpiCashDiff">no change</div>
            <div class="pg-zone" id="pgKpiCashZone"></div>
          </div>
        </div>

        <div class="pg-verdict" id="pgVerdict"></div>

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

    state.setIsPt(false);
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
        x: {
          ticks: { font: { size: 11 }, color: "#6a716e" },
          grid: { display: false },
        },
        y: {
          ticks: { font: { size: 11 }, color: "#6a716e", callback: () => "" },
          grid: { color: "rgba(0,0,0,0.05)" },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { size: 11.5 } },
        },
        tooltip: {
          enabled: false,
          external: () => {},
          callbacks: { footer: () => "" },
        },
      },
    };
    state.setUrlPlayground(null);
    state.setPinnedPlaygroundInputs(null);

    // playground.js derives its BASELINE from the real "2024/25" season in
    // state.DATASET instead of hardcoded literals — see getBaseline() in
    // src/playground.js. Values here match public/data/financials.json's
    // actual 2024/25 entry (including cash and total_assets, which the old
    // hardcoded BASELINE had gotten stale/wrong on: €7.0M vs the real
    // €15.6M cash, and €374.4M vs the real €420.7M total assets).
    state.setDataset({
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
    });
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
    // commercial spillover on top of the raw 2024/25 actuals, minus a 15%
    // UCL bonus/logistics cost charged against payroll (see
    // UCL_BONUS_COST_RATE in src/playground.js — €47M * 15% = €7.05M).
    expect(document.getElementById("pgKpiRev").textContent).toBe("€203.1M");
    expect(document.getElementById("pgKpiNet").textContent).toBe("€68.0M");
    // pgKpiEq always displays the *projected* (2025/26) closing equity:
    // 2024/25's closing equity (€40.9M) plus a full projected season's net
    // result (€68.0M under the default Round-of-16 assumption net of the
    // UCL bonus cost), i.e. €108.9M.
    expect(document.getElementById("pgKpiEq").textContent).toBe("€108.9M");
    // BASELINE.cash comes from financials.json's real 2024/25 entry
    // instead of a stale hardcoded literal (which was €7.0M vs the actual
    // €15.6M) — see getBaseline() in src/playground.js.
    expect(document.getElementById("pgKpiCash").textContent).toBe("€63.5M");

    // Every KPI is compared against a *computed* "no changes" scenario
    // (computeProjection() at DEFAULT_INPUTS), not against the raw 2024/25
    // actuals — so with every slider still at its default, all four must
    // read "no change", including Equity/Solvency, which otherwise differ
    // from the raw actual by a full season's net result even when nothing
    // has been adjusted. See computeProjection()'s comment in
    // src/playground.js for why that distinction matters.
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe(
      "no change",
    );
    expect(document.getElementById("pgKpiNetDiff").textContent).toBe(
      "no change",
    );
    expect(document.getElementById("pgKpiEqDiff").textContent).toBe(
      "no change",
    );
    expect(document.getElementById("pgKpiCashDiff").textContent).toBe(
      "no change",
    );
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
    expect(solvencyChart.config.data.datasets[0].label).toBe(
      "Shareholders' Equity (M€)",
    );
    const [baselineEquity, projectedEquity] =
      solvencyChart.config.data.datasets[0].data;
    expect(baselineEquity).toBeCloseTo(108.901, 2);
    expect(projectedEquity).toBeCloseTo(108.901, 2);
    expect(baselineEquity).toBeCloseTo(projectedEquity, 6);
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", () => {
    // updateProj's expensive work (recompute + redraw + URL sync) is
    // debounced (see playground.js) so dragging a slider doesn't redo it on
    // every "input" tick — advance fake timers past the debounce delay to
    // let it fire.
    vi.useFakeTimers();
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));
    vi.runAllTimers();
    vi.useRealTimers();

    // Revenue itself only depends on the selected value (€40M prize + €8M
    // commercial growth on top of the €148.1M actual), regardless of what
    // DEFAULT_INPUTS assumes. The diff is what changed: the default
    // baseline now assumes Round of 16 (+€47M+€8M), a bigger UCL run than
    // League Phase/Group Stage (+€40M+€8M), so switching to League Phase
    // reads as a €7M *downgrade* from baseline, not an upgrade.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe(
      "-7.0M vs baseline",
    );

    // Net Result and Equity drop by less than the €7M revenue swing: the
    // UCL bonus cost (see UCL_BONUS_COST_RATE in src/playground.js) also
    // shrinks with the smaller prize (15% of €40M vs 15% of €47M is €1.05M
    // less payroll cost), partially offsetting the lower prize money, so
    // the net drop is ~€6M rather than the full €7M.
    expect(document.getElementById("pgKpiNet").textContent).toBe("€62.0M");
    expect(document.getElementById("pgKpiEq").textContent).toBe("€103.0M");
  });

  it("should decrease net result when payroll is increased", () => {
    vi.useFakeTimers();
    initPlayground();
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 10; // +10% payroll increase
    payrollSlider.dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

    // Baseline payroll is -87,736. A 10% increase is +8,773.6 expense, so Net
    // Result decreases relative to the default projection's €68.0M (see
    // DEFAULT_INPUTS's comment in src/playground.js for why not 20.0 — it
    // assumes a Round of 16 UCL run, not no European football; the €68.0M
    // rather than €75.0M also nets out the UCL bonus cost — see
    // UCL_BONUS_COST_RATE).
    expect(document.getElementById("pgKpiNet").textContent).not.toBe("€68.0M");
    const netVal = parseFloat(
      document
        .getElementById("pgKpiNet")
        .textContent.replace("€", "")
        .replace("M", ""),
    );
    expect(netVal).toBeLessThan(68.0);
  });

  it("should reset variables when reset button is clicked", () => {
    vi.useFakeTimers();
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));
    vi.runAllTimers();
    vi.useRealTimers();
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");

    // Reset's own click handler isn't debounced (only the slider/select
    // "input"/"change" path is), so no timer advance needed here.
    document.getElementById("btnResetPlayground").click();
    // Reset re-applies DEFAULT_INPUTS, which now assumes uclPrize: 47
    // (Round of 16) rather than 0 — see the comment on DEFAULT_INPUTS in
    // src/playground.js.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€203.1M");
  });

  it("should increase projected revenue when organic revenue growth is raised", () => {
    vi.useFakeTimers();
    initPlayground();
    const revGrowthSlider = document.getElementById("revGrowthSlider");
    revGrowthSlider.value = 10; // +10% organic growth
    revGrowthSlider.dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

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
    expect(document.getElementById("pgKpiNetDiff").textContent).toBe(
      "no change",
    );
    expect(document.getElementById("uclSelect").value).toBe("47");
    expect(document.getElementById("revGrowthSlider").value).toBe("0");
  });

  it("highlights the matching preset button and clears it once a slider is moved away", () => {
    initPlayground();
    const baseBtn = document.querySelector('[data-pg-preset="base"]');
    const optimisticBtn = document.querySelector(
      '[data-pg-preset="optimistic"]',
    );
    const conservativeBtn = document.querySelector(
      '[data-pg-preset="conservative"]',
    );

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
    // (updateActivePresetHighlight is part of updateProj's debounced work —
    // see playground.js — so advance fake timers past the delay.)
    vi.useFakeTimers();
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 25;
    payrollSlider.dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();
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

    expect(
      document.getElementById("chartPlaygroundNet-a11y-table"),
    ).not.toBeNull();
    expect(
      document.getElementById("chartPlaygroundNet-table-toggle"),
    ).not.toBeNull();
    expect(
      document.getElementById("chartPlaygroundNet-download-btn"),
    ).not.toBeNull();

    expect(
      document.getElementById("chartPlaygroundSolvency-a11y-table"),
    ).not.toBeNull();
    expect(
      document.getElementById("chartPlaygroundSolvency-table-toggle"),
    ).not.toBeNull();
    expect(
      document.getElementById("chartPlaygroundSolvency-download-btn"),
    ).not.toBeNull();
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
    expect(bodyText).toContain("€108.9M");
    expect(bodyText).toMatch(/23\.2%/);
  });

  it("does not accumulate duplicate listeners when called a second time (e.g. a language switch)", () => {
    // Regression test: main.js's language-switch handler clears
    // state.renderedCharts and re-activates the current tab, which
    // re-invokes initPlayground() via runOnce() since its guard was just
    // cleared — a legitimate, necessary call for every OTHER tab's setup
    // function (see initComparison()'s own AbortController in compare.js
    // for the established pattern). Before initPlayground() adopted the
    // same pattern, this silently doubled every listener (uclSelect,
    // sliders, reset, presets) on the first language switch made after
    // visiting the tab, and kept compounding on every switch after that.
    vi.useFakeTimers();
    const spy = vi
      .spyOn(urlSync, "syncStateToUrl")
      .mockImplementation(() => {});
    initPlayground();
    initPlayground(); // simulates the language-switch re-init
    document.getElementById("btnResetPlayground").click();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    vi.useRealTimers();
  });

  it("shows a green health zone on Equity and Cash when the baseline scenario is comfortably healthy", () => {
    // Regression test for equityZoneInfo()/cashZoneInfo() in playground.js:
    // the KPI cards' pos/neg coloring only says whether the projection beats
    // the baseline, not whether the absolute figure is actually healthy.
    // At DEFAULT_INPUTS, projected equity (€108.9M) and cash (€63.5M) both
    // clear HEALTH_THRESHOLDS' "strong"/"warn" cutoffs, so both zones should
    // read green — the same threshold source the Health Check tab uses.
    initPlayground();
    const eqZone = document.getElementById("pgKpiEqZone");
    const cashZone = document.getElementById("pgKpiCashZone");
    expect(eqZone.querySelector(".zone-dot.g")).not.toBeNull();
    expect(eqZone.textContent).toMatch(/solid|sólido/i);
    expect(cashZone.querySelector(".zone-dot.g")).not.toBeNull();
    expect(cashZone.textContent).toMatch(/comfortable|confortável/i);
  });

  it("shows a red health zone and a self-funding warning when a scenario drives cash and equity negative", () => {
    // No European football, payroll/overhead pushed to their maxima, no
    // player sales, maximum reinvestment in purchases, and maximum debt
    // repayment funded from a cash pile that isn't there — a scenario that
    // isn't internally coherent. Verified via a standalone computation
    // (see the PR/commit description) that this drives both cash and
    // equity negative.
    vi.useFakeTimers();
    initPlayground();
    document.getElementById("uclSelect").value = "0";
    document.getElementById("uclSelect").dispatchEvent(new Event("change"));
    document.getElementById("payrollSlider").value = 30;
    document.getElementById("payrollSlider").dispatchEvent(new Event("input"));
    document.getElementById("salesSlider").value = 0;
    document.getElementById("salesSlider").dispatchEvent(new Event("input"));
    document.getElementById("purchasesSlider").value = 100;
    document
      .getElementById("purchasesSlider")
      .dispatchEvent(new Event("input"));
    document.getElementById("capexSlider").value = 30;
    document.getElementById("capexSlider").dispatchEvent(new Event("input"));
    document.getElementById("debtRepaySlider").value = 50;
    document
      .getElementById("debtRepaySlider")
      .dispatchEvent(new Event("input"));
    document.getElementById("revGrowthSlider").value = -10;
    document
      .getElementById("revGrowthSlider")
      .dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

    const cashZone = document.getElementById("pgKpiCashZone");
    const eqZone = document.getElementById("pgKpiEqZone");
    expect(cashZone.querySelector(".zone-dot.r")).not.toBeNull();
    expect(eqZone.querySelector(".zone-dot.r")).not.toBeNull();

    const verdict = document.getElementById("pgVerdict");
    expect(verdict.classList.contains("warn")).toBe(true);
    expect(verdict.textContent).toMatch(/warning|atenção/i);
    expect(verdict.textContent).toMatch(/self-funding|autossustentável/i);
  });

  it("renders an auto-generated verdict describing net result and equity vs. the baseline", () => {
    vi.useFakeTimers();
    initPlayground();
    const revGrowthSlider = document.getElementById("revGrowthSlider");
    revGrowthSlider.value = 10;
    revGrowthSlider.dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

    const verdict = document.getElementById("pgVerdict");
    expect(verdict.style.display).toBe("block");
    expect(verdict.classList.contains("warn")).toBe(false);
    expect(verdict.textContent).toMatch(/improves net result/i);
    expect(verdict.textContent).toContain("equity");
  });

  it("renders the zone tags, verdict and chart labels in Portuguese when state.isPt is true", () => {
    state.setIsPt(true);
    initPlayground();

    const eqZone = document.getElementById("pgKpiEqZone");
    expect(eqZone.textContent).toMatch(/sólido/i);
    const verdict = document.getElementById("pgVerdict");
    expect(verdict.textContent).toMatch(/linha de base/i);

    const netChart = chartRegistry.get("chartPlaygroundNet");
    expect(netChart.config.data.labels).toEqual([
      "Receita",
      "Pessoal",
      "Custos Op.",
      "Result. Financeiro",
      "Trading",
      "Resultado Líq.",
    ]);
  });

  it("includes Overhead and Financial Result as their own columns in the Simulated Financials chart", () => {
    // Regression test: Ordinary Overhead Change and Debt Deleveraging each
    // have their own slider but, before this, neither had a visible bar in
    // this chart — only their downstream effect on Net Result was shown.
    initPlayground();
    const netChart = chartRegistry.get("chartPlaygroundNet");
    expect(netChart.config.data.labels).toEqual([
      "Revenue",
      "Payroll",
      "Overhead",
      "Financial Result",
      "Trading Net",
      "Net Result",
    ]);
    expect(netChart.config.data.datasets[0].data.length).toBe(6);
    expect(netChart.config.data.datasets[1].data.length).toBe(6);
  });

  describe("pin scenario", () => {
    it("has no third dataset/category on either chart until something is pinned", () => {
      initPlayground();
      const netChart = chartRegistry.get("chartPlaygroundNet");
      const solvencyChart = chartRegistry.get("chartPlaygroundSolvency");
      expect(netChart.config.data.datasets.length).toBe(2);
      expect(solvencyChart.config.data.labels.length).toBe(2);
      expect(
        document.getElementById("btnPinScenario").getAttribute("aria-pressed"),
      ).toBe("false");
      expect(document.getElementById("pgPinReadout").style.display).toBe(
        "none",
      );
    });

    it("pins the current scenario as a third dataset on the Simulated Financials chart and a third category on the Equity/Solvency chart", () => {
      initPlayground();
      document.querySelector('[data-pg-preset="optimistic"]').click();
      document.getElementById("btnPinScenario").click();

      const btnPin = document.getElementById("btnPinScenario");
      expect(btnPin.getAttribute("aria-pressed")).toBe("true");
      expect(document.getElementById("btnPinScenarioLabel").textContent).toBe(
        "Unpin Scenario",
      );

      const netChart = chartRegistry.get("chartPlaygroundNet");
      expect(netChart.config.data.datasets.length).toBe(3);
      expect(netChart.config.data.datasets[2].label).toBe("Pinned Scenario");
      // Optimistic scenario's Net Result column (index 5), computed
      // independently — see the pgcalc2.mjs verification used while
      // building this feature.
      expect(netChart.config.data.datasets[2].data[5]).toBeCloseTo(99.671, 2);

      const solvencyChart = chartRegistry.get("chartPlaygroundSolvency");
      expect(solvencyChart.config.data.labels).toEqual([
        "Baseline 2025/26 (no changes)",
        "Your Projection 2025/26",
        "Pinned Scenario",
      ]);
      expect(solvencyChart.config.data.datasets[0].data[2]).toBeCloseTo(
        140.599,
        2,
      );
      expect(solvencyChart.config.data.datasets[1].data[2]).toBeCloseTo(
        29.267,
        2,
      );
    });

    it("shows the pinned scenario's headline figures in the readout", () => {
      initPlayground();
      document.querySelector('[data-pg-preset="optimistic"]').click();
      document.getElementById("btnPinScenario").click();

      const readout = document.getElementById("pgPinReadout");
      expect(readout.style.display).toBe("flex");
      expect(readout.textContent).toContain("€99.7M");
      expect(readout.textContent).toContain("€140.6M");
    });

    it("keeps the pinned scenario frozen while the live scenario keeps changing", () => {
      vi.useFakeTimers();
      initPlayground();
      // Pin at the default ("no changes") scenario.
      document.getElementById("btnPinScenario").click();

      // Now push the live scenario away from default.
      const payrollSlider = document.getElementById("payrollSlider");
      payrollSlider.value = 25;
      payrollSlider.dispatchEvent(new Event("input"));
      vi.runAllTimers();
      vi.useRealTimers();

      const netChart = chartRegistry.get("chartPlaygroundNet");
      // Pinned (index 2) still reads the original €68.0M baseline Net
      // Result, unaffected by the payroll slider moved after pinning.
      expect(netChart.config.data.datasets[2].data[5]).toBeCloseTo(68.0, 1);
      // The live Projection (index 1) has moved away from it.
      expect(netChart.config.data.datasets[1].data[5]).not.toBeCloseTo(68.0, 1);
    });

    it("unpins on a second click, removing the third dataset/category and restoring the button label", () => {
      initPlayground();
      document.getElementById("btnPinScenario").click();
      document.getElementById("btnPinScenario").click();

      expect(
        document.getElementById("btnPinScenario").getAttribute("aria-pressed"),
      ).toBe("false");
      expect(document.getElementById("btnPinScenarioLabel").textContent).toBe(
        "Pin This Scenario",
      );
      expect(document.getElementById("pgPinReadout").style.display).toBe(
        "none",
      );

      const netChart = chartRegistry.get("chartPlaygroundNet");
      expect(netChart.config.data.datasets.length).toBe(2);
      const solvencyChart = chartRegistry.get("chartPlaygroundSolvency");
      expect(solvencyChart.config.data.labels.length).toBe(2);
    });

    it("renders the pin button label and readout in Portuguese when state.isPt is true", () => {
      state.setIsPt(true);
      initPlayground();
      document.getElementById("btnPinScenario").click();

      expect(document.getElementById("btnPinScenarioLabel").textContent).toBe(
        "Remover Fixação",
      );
      expect(document.getElementById("pgPinReadout").textContent).toMatch(
        /Fixado/,
      );

      const solvencyChart = chartRegistry.get("chartPlaygroundSolvency");
      expect(solvencyChart.config.data.labels[2]).toBe("Cenário Fixado");
    });
  });

  it("does nothing (no throw) when #tab-playground is missing from the page", () => {
    document.body.innerHTML = "";
    expect(() => initPlayground()).not.toThrow();
  });

  it("does nothing (no throw) when a slider control is missing from the page", () => {
    document.getElementById("payrollSlider").remove();
    expect(() => initPlayground()).not.toThrow();
    // Guarded before any KPI text was written.
    expect(document.getElementById("pgKpiRev").textContent).toBe("€148.1M");
  });

  it("drawPlaygroundCharts() no-ops (no throw) when a value label element is missing", () => {
    initPlayground();
    document.getElementById("salesVal").remove();
    expect(() => drawPlaygroundCharts()).not.toThrow();
  });

  it("restores a shared scenario from state.urlPlayground on init, coercing strings and falling back to defaults for invalid/missing values", () => {
    // Values arrive as strings (URLSearchParams), and a hand-edited or
    // partial URL can carry an invalid or missing field for any key — see
    // the comment above this block in src/playground.js. purchasesTarget
    // here is unparseable and capexAdj is entirely absent, both of which
    // must fall back to DEFAULT_INPUTS rather than writing NaN into a
    // slider.
    state.setUrlPlayground({
      uclPrize: "40",
      payrollAdj: "10",
      salesTarget: "90",
      purchasesTarget: "not-a-number",
      debtRepayTarget: "5",
      revGrowthAdj: "-3",
    });
    initPlayground();

    expect(document.getElementById("uclSelect").value).toBe("40");
    expect(document.getElementById("payrollSlider").value).toBe("10");
    expect(document.getElementById("salesSlider").value).toBe("90");
    expect(document.getElementById("purchasesSlider").value).toBe("30"); // DEFAULT_INPUTS fallback
    expect(document.getElementById("capexSlider").value).toBe("0"); // DEFAULT_INPUTS fallback (missing key)
    expect(document.getElementById("debtRepaySlider").value).toBe("5");
    expect(document.getElementById("revGrowthSlider").value).toBe("-3");
  });

  it("shows an amber health zone on Equity when the projection is positive but below the strong threshold", () => {
    // Scenario computed against this file's mock BASELINE (equity €40.9M)
    // to land projected equity at ~€18.9M — inside HEALTH_THRESHOLDS.equity's
    // (positive=0, strong=20000] amber band, unlike the existing green
    // (comfortably healthy) and red (insolvent) zone tests.
    vi.useFakeTimers();
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "0";
    uclSelect.dispatchEvent(new Event("change"));
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 6;
    payrollSlider.dispatchEvent(new Event("input"));
    const salesSlider = document.getElementById("salesSlider");
    salesSlider.value = 80;
    salesSlider.dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

    const eqZone = document.getElementById("pgKpiEqZone");
    expect(eqZone.querySelector(".zone-dot.a")).not.toBeNull();
    expect(eqZone.textContent).toMatch(/thin buffer/i);
  });

  it("renders the self-funding warning in Portuguese when a scenario drives cash negative and state.isPt is true", () => {
    // Same scenario as the English red-zone test above, but with isPt set
    // first — the earlier test never ran with isPt true, so buildVerdict()'s
    // Portuguese cashNegative branch (a distinct string, not just a
    // translated copy of the English one) never executed.
    state.setIsPt(true);
    vi.useFakeTimers();
    initPlayground();
    document.getElementById("uclSelect").value = "0";
    document.getElementById("uclSelect").dispatchEvent(new Event("change"));
    document.getElementById("payrollSlider").value = 30;
    document.getElementById("payrollSlider").dispatchEvent(new Event("input"));
    document.getElementById("salesSlider").value = 0;
    document.getElementById("salesSlider").dispatchEvent(new Event("input"));
    document.getElementById("purchasesSlider").value = 100;
    document
      .getElementById("purchasesSlider")
      .dispatchEvent(new Event("input"));
    document.getElementById("capexSlider").value = 30;
    document.getElementById("capexSlider").dispatchEvent(new Event("input"));
    document.getElementById("debtRepaySlider").value = 50;
    document
      .getElementById("debtRepaySlider")
      .dispatchEvent(new Event("input"));
    document.getElementById("revGrowthSlider").value = -10;
    document
      .getElementById("revGrowthSlider")
      .dispatchEvent(new Event("input"));
    vi.runAllTimers();
    vi.useRealTimers();

    const verdict = document.getElementById("pgVerdict");
    expect(verdict.classList.contains("warn")).toBe(true);
    expect(verdict.textContent).toMatch(/Atenção/);
    expect(verdict.textContent).toMatch(/autossustentável/);
  });

  // The Simulated Financials chart's tooltip label callback and its
  // "barDelta" render plugin (draws a "+X.XM"/"-X.XM" label above/below
  // each Projected bar) are only ever invoked by Chart.js's own draw/
  // interaction pipeline — a real tooltip needs a simulated hover, and a
  // real draw pass isn't guaranteed to run against jsdom's mocked canvas.
  // Retrieved directly off the built chart (jspdf-autotable-style pattern
  // used elsewhere for un-exported inline callbacks) and invoked with
  // controlled inputs so every branch (skip-if-negligible, positive delta,
  // negative delta, and the two label formats) is exercised deterministically.
  describe("chartPlaygroundNet — tooltip and barDelta plugin callbacks", () => {
    it("formats the baseline dataset's tooltip label plainly, and the projected dataset's with a delta suffix", () => {
      initPlayground();
      const chart = chartRegistry.get("chartPlaygroundNet");
      const label = chart.config.options.plugins.tooltip.callbacks.label;

      expect(
        label({
          parsed: { y: 68.5 },
          dataset: { label: "Baseline 2025/26 (no changes)" },
          datasetIndex: 0,
        }),
      ).toBe("Baseline 2025/26 (no changes): 68.5 M€");

      expect(
        label({
          parsed: { y: 75.2 },
          dataset: { label: "Your Projection 2025/26" },
          datasetIndex: 1,
          dataIndex: 0,
          chart: { data: { datasets: [{ data: [68.5] }] } },
        }),
      ).toBe("Your Projection 2025/26: 75.2 M€ (+6.7 M€)");

      // A negligible (<0.05) delta reads as "no change" rather than a
      // near-zero decimal like "(+0.0 M€)".
      expect(
        label({
          parsed: { y: 68.52 },
          dataset: { label: "Your Projection 2025/26" },
          datasetIndex: 1,
          dataIndex: 0,
          chart: { data: { datasets: [{ data: [68.5] }] } },
        }),
      ).toBe("Your Projection 2025/26: 68.5 M€ (no change)");
    });

    it("draws a delta label above/below each bar with the matching pos/neg color, skipping negligible deltas", () => {
      initPlayground();
      const chart = chartRegistry.get("chartPlaygroundNet");
      const barDelta = chart.config._config.plugins.find(
        (p) => p.id === "barDelta",
      );
      expect(barDelta).toBeDefined();

      const fillTextCalls = [];
      const fakeCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillText: vi.fn((text, x, y) => {
          fillTextCalls.push({ text, x, y, color: fakeCtx.fillStyle });
        }),
      };
      const fakeChart = {
        ctx: fakeCtx,
        data: {
          datasets: [
            { data: [100, 50, -20] }, // baseline
            { data: [100.02, 71, -42] }, // projected
          ],
        },
        getDatasetMeta: () => ({
          data: [
            { x: 10, y: 5 },
            { x: 30, y: 15 },
            { x: 50, y: -5 },
          ],
        }),
      };

      barDelta.afterDatasetsDraw(fakeChart);

      expect(fakeCtx.save).toHaveBeenCalledTimes(1);
      expect(fakeCtx.restore).toHaveBeenCalledTimes(1);
      // Index 0's delta (0.02) is below the noise floor — no label drawn.
      expect(fillTextCalls).toHaveLength(2);
      // Index 1: +21 delta, projVal (71) >= 0 -> label drawn above the bar.
      expect(fillTextCalls[0]).toMatchObject({
        text: "+21.0M",
        x: 30,
        y: 7, // bar.y (15) - 8
        color: state.COLORS.pos,
      });
      // Index 2: -22 delta, projVal (-42) < 0 -> label drawn below the bar.
      expect(fillTextCalls[1]).toMatchObject({
        text: "-22.0M",
        x: 50,
        y: 7, // bar.y (-5) + 12
        color: state.COLORS.neg,
      });
    });
  });

  it("formats the Equity/Solvency chart's tooltip label in M€ for the bar dataset and % for the solvency line", () => {
    initPlayground();
    const chart = chartRegistry.get("chartPlaygroundSolvency");
    const label = chart.config.options.plugins.tooltip.callbacks.label;

    expect(
      label({
        parsed: { y: 108.9 },
        dataset: { label: "Shareholders' Equity (M€)" },
        datasetIndex: 0,
      }),
    ).toBe("Shareholders' Equity (M€): 108.9 M€");

    expect(
      label({
        parsed: { y: 25.9 },
        dataset: { label: "Solvency Ratio (%)" },
        datasetIndex: 1,
      }),
    ).toBe("Solvency Ratio (%): 25.9%");
  });
});
