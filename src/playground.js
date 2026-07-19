import { state } from "./state.js";
import { styledLineDataset, getBrandColors } from "./chartUtils.js";
import { mkChart } from "./charts.js";
import { syncStateToUrl } from "./urlSync.js";
import { debounce } from "./utils.js";

// Defensive fallback for the (in practice, always-initialized-by-boot)
// case where a chart is drawn before initChartDefaults() has populated
// state.COLORS — derived from the canonical palette so this can't drift
// from the live app's colors the way independently hardcoded hex literals
// used to.
const FALLBACK = getBrandColors(false);

// Looks up the season this tool uses as its fixed 2024/25 reference season
// (BASELINE below — not to be confused with the *computed* "no changes"
// scenario also called "baseline" elsewhere in this file, see
// computeProjection() and DEFAULT_INPUTS). This is a function rather than a
// module-level constant because
// state.DATASET isn't populated yet when this module is first evaluated —
// initApp() in main.js fetches financials.json and calls state.setDataset()
// before setupApp() (and therefore initPlayground()) ever runs.
//
// These fields used to be hand-copied literals frozen at whatever 2024/25's
// numbers were when this file was written. Two of them (cash, total_assets)
// had already drifted from financials.json's real 2024/25 entry — this tool
// was showing a €7.0M cash balance against an actual €15.6M, and total
// assets off by ~€46M. Deriving from state.annual instead means a future
// correction to financials.json's 2024/25 figures (e.g. an audit
// restatement) is picked up automatically, and next season's rollover
// (making 2025/26 the baseline) only requires changing the label below.
function getBaseline() {
  const season = state.annual?.find((s) => s.label === "2024/25");
  if (!season) return null;
  return {
    revenue_operating: season.revenue_operating,
    personnel_costs: season.personnel_costs,
    external_supplies: season.external_supplies,
    da_excl_squad: season.da_excl_squad,
    squad_amortization: season.squad_amortization_impairment,
    player_transfer_cost: season.player_transfer_cost,
    player_transfer_income: season.player_transfer_income, // baseline actual sales
    financial_result: season.financial_result,
    net_result: season.net_result,
    equity: season.equity,
    current_assets: season.current_assets,
    current_liabilities: season.current_liabilities,
    total_assets: season.total_assets,
    cash: season.cash,
  };
}

// Neutral/no-change slider values — matches the Reset button's values.
// Used to compute the "flat continuation" scenario (2025/26 assuming
// 2024/25's performance repeats exactly, with none of the sliders moved),
// which every projected figure is compared against below. Equity and
// Solvency layer a full season's net result on top of the prior season's
// closing balance (see computeProjection()), so — unlike Revenue, Net
// Result and Cash — they don't equal the raw 2024/25 actuals even with
// zero adjustments. Comparing against this computed baseline instead of
// against the raw actuals means Reset always shows "no change" everywhere,
// with no caveat needed for Equity/Solvency.
//
// IMPORTANT: every field here must match the corresponding control's
// initial DOM state (each slider's `value` attribute, and — since it isn't
// necessarily the first <option> — the <select id="uclSelect"> option
// marked `selected` in index.html). If they drift apart, the page loads
// with "proj" (read from the DOM) and "baseline" (read from this object)
// already disagreeing, so every KPI shows a spurious diff on first render
// instead of "no change". uclPrize was bumped from 0 to 47 without updating
// the <select>'s default here — index.html's Round of 16 <option> now
// carries `selected` to match.
const DEFAULT_INPUTS = {
  uclPrize: 47,
  payrollAdj: 0,
  salesTarget: 117,
  purchasesTarget: 30,
  capexAdj: 0,
  debtRepayTarget: 0,
  revGrowthAdj: 0,
};

// Quick-scenario presets. "base" intentionally equals DEFAULT_INPUTS (same
// values as the Reset button) — it exists as a named scenario so the three
// preset buttons read as a coherent Conservative/Base/Optimistic set, not
// because it does anything Reset doesn't already do.
const PRESETS = {
  conservative: {
    uclPrize: 36,
    payrollAdj: 5,
    salesTarget: 80,
    purchasesTarget: 20,
    capexAdj: 5,
    debtRepayTarget: 0,
    revGrowthAdj: -3,
  },
  base: DEFAULT_INPUTS,
  optimistic: {
    uclPrize: 60,
    payrollAdj: 10,
    salesTarget: 140,
    purchasesTarget: 60,
    capexAdj: 0,
    debtRepayTarget: 20,
    revGrowthAdj: 8,
  },
};

// Pure projection model: given the fixed 2024/25 baseline season and a set
// of slider inputs, returns the modeled 2025/26 P&L/balance-sheet figures
// (in EUR thousands, matching financials.json's convention). Extracted so
// the same formulas can be run twice per render — once at DEFAULT_INPUTS
// to get the "no changes" reference scenario, and once at the user's
// current slider positions — instead of the two scenarios drifting apart
// if only one call site were ever updated.
function computeProjection(
  BASELINE,
  { uclPrize, payrollAdj, salesTarget, purchasesTarget, capexAdj, debtRepayTarget, revGrowthAdj },
) {
  // Organic growth (ticket pricing, existing commercial deals) applies to
  // the whole operating revenue base; qualified UCL then adds its prize
  // money plus a flat +€8M Matchday/Commercial spillover on top.
  const revenue =
    BASELINE.revenue_operating * (1 + (revGrowthAdj || 0) / 100) + (uclPrize * 1000) + (uclPrize > 0 ? 8000 : 0);
  const payroll = BASELINE.personnel_costs * (1 + payrollAdj / 100);
  const overhead = BASELINE.external_supplies * (1 + capexAdj / 100);

  // Use exact baseline player transfer income when salesTarget is default 117 to prevent integer rounding discrepancy
  const sales = salesTarget === 117 ? BASELINE.player_transfer_income : salesTarget * 1000;
  // Purchases adjusts amortization rate dynamically (reinvesting triggers 20% amortization over 5-year contracts)
  const amortization = BASELINE.squad_amortization - ((purchasesTarget - 30) * 1000 * 0.20);
  const netTrading = sales + amortization + BASELINE.player_transfer_cost;

  // Deleveraging saves 2% net interest cost (4.5% interest rate minus 2.5% cash yield opportunity cost)
  const interestSavings = debtRepayTarget * 1000 * 0.02;
  const financialResult = BASELINE.financial_result + interestSavings;

  // The modeled P&L above (revenue, payroll, overhead, D&A, player trading,
  // financial result) doesn't decompose the full audited income statement —
  // items like tax aren't modeled individually. Reconcile the zero-slider
  // scenario back to the baseline season's real net result instead of
  // hardcoding that gap as an opaque constant: this stays correct if
  // BASELINE ever points at a different season (e.g. next year's rollover),
  // where the leftover would be a different number.
  const modeledBaselineNet =
    BASELINE.revenue_operating +
    BASELINE.personnel_costs +
    BASELINE.external_supplies +
    BASELINE.da_excl_squad +
    (BASELINE.player_transfer_income + BASELINE.squad_amortization + BASELINE.player_transfer_cost) +
    BASELINE.financial_result;
  const unmodeledCostsAdjustment = BASELINE.net_result - modeledBaselineNet;

  const netResult =
    (revenue + payroll + overhead + BASELINE.da_excl_squad) +
    netTrading +
    financialResult +
    unmodeledCostsAdjustment;

  // 2025/26 closing equity = 2024/25's actual closing equity (the opening
  // balance for the new season) plus the projected season's net result.
  // BASELINE.equity is already the season's closing equity (it comes
  // straight from the audited balance sheet), not an opening balance, so
  // it must NOT be added a second time anywhere else in this function.
  const equity = BASELINE.equity + netResult;

  // Solvency impact (Equity / Total Assets), both calculated at the end of the projected season
  const totalAssets = BASELINE.total_assets + (netResult - BASELINE.net_result) - (debtRepayTarget * 1000);
  const solvency = (equity / totalAssets) * 100;

  // Cash Impact: operating result changes (adding back non-cash amortization delta) minus debt repayment principal outflow minus player purchases reinvestment delta
  const amortizationDelta = BASELINE.squad_amortization - amortization;
  const cash = BASELINE.cash + (netResult - BASELINE.net_result) + amortizationDelta - (debtRepayTarget * 1000) - ((purchasesTarget - 30) * 1000);

  return { revenue, payroll, overhead, sales, amortization, netTrading, financialResult, netResult, equity, totalAssets, solvency, cash };
}

function updateSliderFill(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const percentage = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--green, #0a5d3a) ${percentage}%, var(--rule-2, #e5e5e5) ${percentage}%)`;
}

export function initPlayground() {
  const container = document.getElementById("tab-playground");
  if (!container) return;

  // Bind input controls
  const uclSelect = document.getElementById("uclSelect");
  const payrollSlider = document.getElementById("payrollSlider");
  const salesSlider = document.getElementById("salesSlider");
  const purchasesSlider = document.getElementById("purchasesSlider");
  const capexSlider = document.getElementById("capexSlider");
  const debtRepaySlider = document.getElementById("debtRepaySlider");
  const revGrowthSlider = document.getElementById("revGrowthSlider");
  const btnReset = document.getElementById("btnResetPlayground");
  const presetButtons = document.querySelectorAll("[data-pg-preset]");

  if (
    !uclSelect ||
    !payrollSlider ||
    !salesSlider ||
    !purchasesSlider ||
    !capexSlider ||
    !debtRepaySlider ||
    !revGrowthSlider ||
    !btnReset
  )
    return;

  const rangeSliders = [payrollSlider, salesSlider, purchasesSlider, capexSlider, debtRepaySlider, revGrowthSlider];

  // Sets every control to a given scenario's values (a DEFAULT_INPUTS- or
  // PRESETS-shaped object) — shared by Reset, the preset buttons, and
  // restoring a scenario from the URL, instead of each hand-listing the
  // same 7 assignments.
  const applyInputs = (inputs) => {
    uclSelect.value = String(inputs.uclPrize);
    payrollSlider.value = inputs.payrollAdj;
    salesSlider.value = inputs.salesTarget;
    purchasesSlider.value = inputs.purchasesTarget;
    capexSlider.value = inputs.capexAdj;
    debtRepaySlider.value = inputs.debtRepayTarget;
    revGrowthSlider.value = inputs.revGrowthAdj;
    rangeSliders.forEach(updateSliderFill);
  };

  // Reads the 7 controls' current values off the DOM into an inputs-shaped
  // object — shared by drawPlaygroundCharts() (feeds computeProjection())
  // and updateActivePresetHighlight() (compares against PRESETS) so the two
  // can't drift into reading the controls differently.
  const getCurrentInputs = () => ({
    uclPrize: parseInt(uclSelect.value, 10),
    payrollAdj: parseInt(payrollSlider.value, 10),
    salesTarget: parseInt(salesSlider.value, 10),
    purchasesTarget: parseInt(purchasesSlider.value, 10),
    capexAdj: parseInt(capexSlider.value, 10),
    debtRepayTarget: parseInt(debtRepaySlider.value, 10),
    revGrowthAdj: parseInt(revGrowthSlider.value, 10),
  });

  // Highlights whichever preset button (if any) matches the controls'
  // current values, so a preset reads as "selected" until a slider is
  // dragged away from it — instead of all three buttons always looking
  // equally unselected regardless of what's actually applied.
  const updateActivePresetHighlight = () => {
    const current = getCurrentInputs();
    presetButtons.forEach((btn) => {
      const preset = PRESETS[btn.dataset.pgPreset];
      const matches =
        !!preset && Object.keys(DEFAULT_INPUTS).every((key) => current[key] === preset[key]);
      btn.classList.toggle("active", matches);
      btn.setAttribute("aria-pressed", String(matches));
    });
  };

  // Listeners
  //
  // Range sliders fire "input" continuously while being dragged — often
  // 30-60+ times/second — so recomputing the projection, redrawing both
  // charts (which also rebuilds their accessible data tables via mkChart's
  // generateAccessibleTable()) and writing to URL history on every single
  // tick was real, unnecessary overhead for no visible benefit over
  // collapsing a drag into one update. Same debounce-the-expensive-part
  // pattern transfers.js already uses for its search box: the slider's own
  // fill track (updateSliderFill) stays outside the debounce so dragging
  // still feels instantly responsive; everything derived from the actual
  // projection (KPIs, slider value labels, charts, preset highlight, URL)
  // updates together, just debounced.
  const updateProjHeavy = debounce(() => {
    drawPlaygroundCharts();
    updateActivePresetHighlight();
    syncStateToUrl();
  }, 60);

  const updateProj = () => {
    rangeSliders.forEach(updateSliderFill);
    updateProjHeavy();
  };

  uclSelect.addEventListener("change", updateProj);
  rangeSliders.forEach((slider) => slider.addEventListener("input", updateProj));

  btnReset.addEventListener("click", () => {
    applyInputs(DEFAULT_INPUTS);
    drawPlaygroundCharts();
    updateActivePresetHighlight();
    syncStateToUrl();
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS[btn.dataset.pgPreset];
      if (!preset) return;
      applyInputs(preset);
      drawPlaygroundCharts();
      updateActivePresetHighlight();
      syncStateToUrl();
    });
  });

  // Restore a shared scenario from the URL, if one was encoded — see the
  // "Playground scenario" section of urlSync.js. Values arrive as strings
  // (URLSearchParams only deals in strings); coerced back to numbers here
  // so applyInputs() can hand them straight to the range inputs' values.
  // Only fields that parse to a real number are applied — a partially
  // formed URL (e.g. hand-edited) falls back to DEFAULT_INPUTS for
  // whatever's missing or invalid instead of writing NaN into a slider.
  if (state.urlPlayground) {
    const restored = { ...DEFAULT_INPUTS };
    for (const key of Object.keys(DEFAULT_INPUTS)) {
      const parsed = parseInt(state.urlPlayground[key], 10);
      if (!Number.isNaN(parsed)) restored[key] = parsed;
    }
    applyInputs(restored);
  }

  // First render
  rangeSliders.forEach(updateSliderFill);
  drawPlaygroundCharts();
  updateActivePresetHighlight();
}

export function drawPlaygroundCharts() {
  const BASELINE = getBaseline();
  if (!BASELINE) return; // state.DATASET not ready yet, or "2024/25" isn't in it

  const inputs = {
    uclPrize: parseInt(document.getElementById("uclSelect").value, 10), // in millions
    payrollAdj: parseInt(document.getElementById("payrollSlider").value, 10),
    salesTarget: parseInt(document.getElementById("salesSlider").value, 10), // in millions
    purchasesTarget: parseInt(document.getElementById("purchasesSlider").value, 10), // in millions
    capexAdj: parseInt(document.getElementById("capexSlider").value, 10),
    debtRepayTarget: parseInt(document.getElementById("debtRepaySlider").value, 10), // in millions
    revGrowthAdj: parseInt(document.getElementById("revGrowthSlider").value, 10),
  };

  // Update label text values
  document.getElementById("payrollVal").textContent = (inputs.payrollAdj >= 0 ? "+" : "") + inputs.payrollAdj + "%";
  document.getElementById("salesVal").textContent = inputs.salesTarget + " M€";
  document.getElementById("purchasesVal").textContent = inputs.purchasesTarget + " M€";
  document.getElementById("capexVal").textContent = (inputs.capexAdj >= 0 ? "+" : "") + inputs.capexAdj + "%";
  document.getElementById("debtRepayVal").textContent = inputs.debtRepayTarget + " M€";
  document.getElementById("revGrowthVal").textContent =
    (inputs.revGrowthAdj >= 0 ? "+" : "") + inputs.revGrowthAdj + "%";

  // "baseline" = 2025/26 if nothing is adjusted (2024/25's performance
  // repeats exactly); "proj" = 2025/26 at the user's current slider
  // positions. Every KPI/chart below compares proj against this computed
  // baseline rather than against BASELINE's raw 2024/25 figures, so Reset
  // always lands on "no change" everywhere — see computeProjection()'s
  // equity/solvency comment for why that isn't automatically true if you
  // compare against the raw actuals instead.
  const baseline = computeProjection(BASELINE, DEFAULT_INPUTS);
  const proj = computeProjection(BASELINE, inputs);

  // Render KPIs
  updateKpi("pgCardRev", "pgKpiRev", "pgKpiRevDiff", proj.revenue / 1000, baseline.revenue / 1000);
  updateKpi("pgCardNet", "pgKpiNet", "pgKpiNetDiff", proj.netResult / 1000, baseline.netResult / 1000);
  updateKpi("pgCardEq", "pgKpiEq", "pgKpiEqDiff", proj.equity / 1000, baseline.equity / 1000);
  updateKpi("pgCardCash", "pgKpiCash", "pgKpiCashDiff", proj.cash / 1000, baseline.cash / 1000);

  // Draw Charts
  drawProjectionCharts(baseline, proj);
}

function updateKpi(cardId, valId, diffId, projVal, baseVal) {
  const diffVal = projVal - baseVal;
  document.getElementById(valId).textContent = `€${projVal.toFixed(1)}M`;
  
  const cardEl = document.getElementById(cardId);
  const diffEl = document.getElementById(diffId);
  
  if (cardEl) {
    cardEl.classList.remove("pos", "neg");
  }
  
  if (Math.abs(diffVal) < 0.01) {
    diffEl.textContent = state.isPt ? "sem alteração" : "no change";
    diffEl.className = "change";
  } else {
    const isPos = diffVal > 0;
    const sign = isPos ? "+" : "";
    // "vs baseline" (not "vs actual"): baseVal is the computed no-changes
    // scenario, which for Equity/Solvency already differs from the raw
    // 2024/25 actual by a full season's net result — see computeProjection().
    diffEl.textContent = `${sign}${diffVal.toFixed(1)}M ${state.isPt ? "vs linha de base" : "vs baseline"}`;
    diffEl.className = `change ${isPos ? "pos" : "neg"}`;
    if (cardEl) {
      cardEl.classList.add(isPos ? "pos" : "neg");
    }
  }
}

// Both charts below compare the same two scenarios — "Baseline 2025/26"
// (computeProjection() run at DEFAULT_INPUTS: 2024/25's performance
// repeated with no adjustments) against "Your Projection 2025/26" (the
// user's current slider positions). Sharing these labels keeps that pairing
// visually consistent across both charts, and means an untouched Reset
// always renders two identical bars — nothing to explain, since both bars
// are already projections of the *same* hypothetical season.
function scenarioLabels() {
  return {
    baseline: state.isPt ? "Linha de Base 2025/26 (sem alterações)" : "Baseline 2025/26 (no changes)",
    projected: state.isPt ? "A Sua Projeção 2025/26" : "Your Projection 2025/26",
  };
}

function drawProjectionCharts(baseline, proj) {
  const canvas1Id = "chartPlaygroundNet";
  const canvas2Id = "chartPlaygroundSolvency";
  const { baseline: baselineLabel, projected: projectedLabel } = scenarioLabels();

  const labels = [
    state.isPt ? "Receita" : "Revenue",
    state.isPt ? "Pessoal" : "Payroll",
    state.isPt ? "Trading" : "Trading Net",
    state.isPt ? "Resultado Líq." : "Net Result",
  ];

  // 1. Net results comparison chart
  mkChart(canvas1Id, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: baselineLabel,
          data: [
            baseline.revenue / 1000,
            baseline.payroll / 1000,
            baseline.netTrading / 1000,
            baseline.netResult / 1000,
          ],
          backgroundColor: state.COLORS.mutedSoft || FALLBACK.mutedSoft,
          borderColor: state.COLORS.muted || FALLBACK.muted,
          borderWidth: 1,
        },
        {
          label: projectedLabel,
          data: [
            proj.revenue / 1000,
            proj.payroll / 1000,
            proj.netTrading / 1000,
            proj.netResult / 1000,
          ],
          backgroundColor: state.COLORS.greenSoft || FALLBACK.greenSoft,
          borderColor: state.COLORS.green || FALLBACK.green,
          borderWidth: 1,
        },
      ],
    },
    options: {
      // Merge in the app-wide themed defaults (axis tick color/font, the
      // custom glass-style external tooltip every other chart uses instead
      // of Chart.js's plain default box, bottom legend styling) instead of
      // the bare {} this chart used to build its options from — without
      // this it rendered with unthemed black axis text and a default
      // browser-style tooltip, both broken in dark mode.
      ...state.baseOpts,
      scales: {
        x: { ...state.baseOpts.scales.x },
        y: {
          ...state.baseOpts.scales.y,
          // Override the shared callback: it assumes raw EUR-thousands
          // input (divides by 1000 again), but this chart's data is already
          // in millions.
          ticks: { ...state.baseOpts.scales.y.ticks, callback: (v) => v.toFixed(0) + "M€" },
          beginAtZero: false,
          title: { display: true, text: "M€", color: state.COLORS.muted || FALLBACK.muted },
        },
      },
      plugins: {
        ...state.baseOpts.plugins,
        tooltip: {
          ...state.baseOpts.plugins.tooltip,
          callbacks: {
            ...state.baseOpts.plugins.tooltip.callbacks,
            label: (context) => {
              const val = context.parsed.y;
              if (context.datasetIndex === 0) {
                return `${context.dataset.label}: ${val.toFixed(1)} M€`;
              } else {
                const baselineVal = context.chart.data.datasets[0].data[context.dataIndex];
                const delta = val - baselineVal;
                const sign = delta >= 0 ? "+" : "";
                const deltaStr = Math.abs(delta) < 0.05 ? " (no change)" : ` (${sign}${delta.toFixed(1)} M€)`;
                return `${context.dataset.label}: ${val.toFixed(1)} M€${deltaStr}`;
              }
            }
          }
        }
      }
    },
    plugins: [{
      id: 'barDelta',
      afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        ctx.save();
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';

        const baselineDS = data.datasets[0].data;
        const projDS = data.datasets[1].data;

        chart.getDatasetMeta(1).data.forEach((bar, index) => {
          const baselineVal = baselineDS[index];
          const projVal = projDS[index];
          const delta = projVal - baselineVal;
          if (Math.abs(delta) < 0.05) return;

          const sign = delta > 0 ? "+" : "";
          // Same pos/neg tokens as everywhere else (.kpi .change.pos/.neg,
          // the KPI diff text above) — the old "#0a5d3a"/"#eb5e28" literals
          // weren't dark-mode aware and "#eb5e28" wasn't even in the
          // app's palette.
          const color = delta > 0
            ? (state.COLORS.pos || FALLBACK.pos)
            : (state.COLORS.neg || FALLBACK.neg);
          ctx.fillStyle = color;

          const yPos = bar.y + (projVal >= 0 ? -8 : 12);
          ctx.fillText(`${sign}${delta.toFixed(1)}M`, bar.x, yPos);
        });
        ctx.restore();
      }
    }]
  });

  // 2. Solvency & Equity Chart (Dual Y-Axis)
  mkChart(canvas2Id, {
    type: "bar",
    data: {
      labels: [baselineLabel, projectedLabel],
      datasets: [
        {
          label: state.isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
          data: [baseline.equity / 1000, proj.equity / 1000],
          backgroundColor: state.COLORS.goldSoft || FALLBACK.goldSoft,
          borderColor: state.COLORS.gold || FALLBACK.gold,
          borderWidth: 1.5,
          yAxisID: "y",
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          data: [baseline.solvency, proj.solvency],
          color: state.COLORS.green || FALLBACK.green,
          bg: state.COLORS.greenSoft || FALLBACK.greenSoft,
          extra: {
            type: "line",
            yAxisID: "y1",
            order: 0,
          }
        })
      ],
    },
    options: {
      // Same rationale as chart 1 above: merge in the shared themed
      // defaults (glass tooltip, bottom legend, themed axis ticks/grid)
      // instead of building options from a bare {}. The y grid used to
      // read `state.COLORS.rule`, a key that doesn't exist in the palette
      // (see chartUtils.js's PALETTE) — it was silently always falling
      // back to a hardcoded, non-dark-mode-aware rgba. Using
      // state.baseOpts.scales.y.grid (which updateChartTheme() actually
      // does keep in sync with light/dark mode) fixes that too.
      ...state.baseOpts,
      scales: {
        x: { ...state.baseOpts.scales.x },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: state.isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
            color: state.COLORS.muted || FALLBACK.muted,
          },
          ticks: { ...state.baseOpts.scales.y.ticks, callback: (v) => v.toFixed(0) },
          grid: { ...state.baseOpts.scales.y.grid },
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: state.isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
            color: state.COLORS.muted || FALLBACK.muted,
          },
          min: 0,
          max: Math.max(30, baseline.solvency + 5, proj.solvency + 5),
          ticks: { ...state.baseOpts.scales.y.ticks, callback: (v) => v.toFixed(0) + "%" },
          grid: { drawOnChartArea: false }, // Avoid grid lines overlap
        },
      },
      plugins: {
        ...state.baseOpts.plugins,
        tooltip: {
          ...state.baseOpts.plugins.tooltip,
          callbacks: {
            ...state.baseOpts.plugins.tooltip.callbacks,
            label: (context) => {
              const val = context.parsed.y;
              const suffix = context.datasetIndex === 0 ? " M€" : "%";
              return `${context.dataset.label}: ${val.toFixed(1)}${suffix}`;
            }
          }
        }
      }
    },
  });
}
