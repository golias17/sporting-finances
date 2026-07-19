import Chart from "chart.js/auto";
import { state } from "./state.js";
import { chartRegistry, styledLineDataset, getBrandColors } from "./chartUtils.js";

// Defensive fallback for the (in practice, always-initialized-by-boot)
// case where a chart is drawn before initChartDefaults() has populated
// state.COLORS — derived from the canonical palette so this can't drift
// from the live app's colors the way independently hardcoded hex literals
// used to.
const FALLBACK = getBrandColors(false);

// Looks up the season this tool uses as its fixed "Actual 2024/25"
// baseline. This is a function rather than a module-level constant because
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
  const btnReset = document.getElementById("btnResetPlayground");

  if (!uclSelect || !payrollSlider || !salesSlider || !purchasesSlider || !capexSlider || !debtRepaySlider || !btnReset) return;

  // Listeners
  const updateProj = () => {
    updateSliderFill(payrollSlider);
    updateSliderFill(salesSlider);
    updateSliderFill(purchasesSlider);
    updateSliderFill(capexSlider);
    updateSliderFill(debtRepaySlider);
    drawPlaygroundCharts();
  };

  uclSelect.addEventListener("change", updateProj);
  payrollSlider.addEventListener("input", updateProj);
  salesSlider.addEventListener("input", updateProj);
  purchasesSlider.addEventListener("input", updateProj);
  capexSlider.addEventListener("input", updateProj);
  debtRepaySlider.addEventListener("input", updateProj);

  btnReset.addEventListener("click", () => {
    uclSelect.value = "0";
    payrollSlider.value = 0;
    salesSlider.value = 117;
    purchasesSlider.value = 30;
    capexSlider.value = 0;
    debtRepaySlider.value = 0;

    updateSliderFill(payrollSlider);
    updateSliderFill(salesSlider);
    updateSliderFill(purchasesSlider);
    updateSliderFill(capexSlider);
    updateSliderFill(debtRepaySlider);

    drawPlaygroundCharts();
  });

  // First render
  updateSliderFill(payrollSlider);
  updateSliderFill(salesSlider);
  updateSliderFill(purchasesSlider);
  updateSliderFill(capexSlider);
  updateSliderFill(debtRepaySlider);
  drawPlaygroundCharts();
}

export function drawPlaygroundCharts() {
  const BASELINE = getBaseline();
  if (!BASELINE) return; // state.DATASET not ready yet, or "2024/25" isn't in it

  const uclPrize = parseInt(document.getElementById("uclSelect").value, 10); // in millions
  const payrollAdj = parseInt(document.getElementById("payrollSlider").value, 10);
  const salesTarget = parseInt(document.getElementById("salesSlider").value, 10); // in millions
  const purchasesTarget = parseInt(document.getElementById("purchasesSlider").value, 10); // in millions
  const capexAdj = parseInt(document.getElementById("capexSlider").value, 10);
  const debtRepayTarget = parseInt(document.getElementById("debtRepaySlider").value, 10); // in millions

  // Update label text values
  document.getElementById("payrollVal").textContent = (payrollAdj >= 0 ? "+" : "") + payrollAdj + "%";
  document.getElementById("salesVal").textContent = salesTarget + " M€";
  document.getElementById("purchasesVal").textContent = purchasesTarget + " M€";
  document.getElementById("capexVal").textContent = (capexAdj >= 0 ? "+" : "") + capexAdj + "%";
  document.getElementById("debtRepayVal").textContent = debtRepayTarget + " M€";

  // Calculations (in thousands)
  // Qualified UCL boosts Matchday + Commercial by +€8M as well
  const projRevenue = BASELINE.revenue_operating + (uclPrize * 1000) + (uclPrize > 0 ? 8000 : 0);
  const projPayroll = BASELINE.personnel_costs * (1 + payrollAdj / 100);
  const projOverhead = BASELINE.external_supplies * (1 + capexAdj / 100);
  
  // Use exact baseline player transfer income when salesTarget is default 117 to prevent integer rounding discrepancy
  const projSales = salesTarget === 117 ? BASELINE.player_transfer_income : salesTarget * 1000;
  // Purchases adjusts amortization rate dynamically (reinvesting triggers 20% amortization over 5-year contracts)
  const projAmortization = BASELINE.squad_amortization - ((purchasesTarget - 30) * 1000 * 0.20);
  const projNetTrading = projSales + projAmortization + BASELINE.player_transfer_cost;
  
  // Deleveraging saves 2% net interest cost (4.5% interest rate minus 2.5% cash yield opportunity cost)
  const interestSavings = debtRepayTarget * 1000 * 0.02;
  const projFinancialResult = BASELINE.financial_result + interestSavings;

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

  const projNetResult =
    (projRevenue + projPayroll + projOverhead + BASELINE.da_excl_squad) +
    projNetTrading +
    projFinancialResult +
    unmodeledCostsAdjustment;

  const projEquity = BASELINE.equity + projNetResult;

  // Solvency impact (Equity / Total Assets) - both base and proj are calculated at the end of the season
  const projTotalAssets = BASELINE.total_assets + (projNetResult - BASELINE.net_result) - (debtRepayTarget * 1000);
  const projSolvency = (projEquity / projTotalAssets) * 100;
  // BASELINE.equity is already the season's closing equity (it comes
  // straight from the audited balance sheet), not an opening balance — it
  // must NOT have BASELINE.net_result added again here. (It previously was,
  // which overstated the "Actual 2024/25" equity bar and solvency ratio by
  // exactly one season's net result.)
  const baseEquity = BASELINE.equity;
  const baseSolvency = (baseEquity / BASELINE.total_assets) * 100;

  // Cash Impact: operating result changes (adding back non-cash amortization delta) minus debt repayment principal outflow minus player purchases reinvestment delta
  const amortizationDelta = BASELINE.squad_amortization - projAmortization;
  const projCash = BASELINE.cash + (projNetResult - BASELINE.net_result) + amortizationDelta - (debtRepayTarget * 1000) - ((purchasesTarget - 30) * 1000);

  // Render KPIs
  updateKpi("pgCardRev", "pgKpiRev", "pgKpiRevDiff", projRevenue / 1000, BASELINE.revenue_operating / 1000);
  updateKpi("pgCardNet", "pgKpiNet", "pgKpiNetDiff", projNetResult / 1000, BASELINE.net_result / 1000);
  updateKpi("pgCardEq", "pgKpiEq", "pgKpiEqDiff", projEquity / 1000, baseEquity / 1000);
  updateKpi("pgCardCash", "pgKpiCash", "pgKpiCashDiff", projCash / 1000, BASELINE.cash / 1000);

  // Draw Charts
  drawProjectionCharts(
    BASELINE,
    baseEquity,
    projRevenue / 1000,
    projPayroll / 1000,
    projNetTrading / 1000,
    projNetResult / 1000,
    projEquity / 1000,
    projSolvency,
    baseSolvency
  );
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
    diffEl.textContent = `${sign}${diffVal.toFixed(1)}M vs actual`;
    diffEl.className = `change ${isPos ? "pos" : "neg"}`;
    if (cardEl) {
      cardEl.classList.add(isPos ? "pos" : "neg");
    }
  }
}

function drawProjectionCharts(
  BASELINE,
  baseEquity,
  projRevenue,
  projPayroll,
  projTrading,
  projNetResult,
  projEquity,
  projSolvency,
  baseSolvency
) {
  const canvas1Id = "chartPlaygroundNet";
  const canvas2Id = "chartPlaygroundSolvency";

  const labels = [
    state.isPt ? "Receita" : "Revenue",
    state.isPt ? "Pessoal" : "Payroll",
    state.isPt ? "Trading" : "Trading Net",
    state.isPt ? "Resultado Líq." : "Net Result",
  ];

  // 1. Net results comparison chart
  if (chartRegistry.has(canvas1Id)) {
    chartRegistry.get(canvas1Id).destroy();
  }
  const ctx1 = document.getElementById(canvas1Id).getContext("2d");
  const chart1 = new Chart(ctx1, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: state.isPt ? "Real 2024/25" : "Actual 2024/25",
          data: [
            BASELINE.revenue_operating / 1000,
            BASELINE.personnel_costs / 1000,
            (BASELINE.player_transfer_income + BASELINE.squad_amortization + BASELINE.player_transfer_cost) / 1000,
            BASELINE.net_result / 1000,
          ],
          backgroundColor: "rgba(106, 113, 110, 0.4)",
          borderColor: "#6a716e",
          borderWidth: 1,
        },
        {
          label: state.isPt ? "Projetado 2025/26" : "Projected 2025/26",
          data: [projRevenue, projPayroll, projTrading, projNetResult],
          backgroundColor: state.COLORS.greenSoft || FALLBACK.greenSoft,
          borderColor: state.COLORS.green || FALLBACK.green,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: "M€" },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              if (context.datasetIndex === 0) {
                return `${context.dataset.label}: ${val.toFixed(1)} M€`;
              } else {
                const actualVal = context.chart.data.datasets[0].data[context.dataIndex];
                const delta = val - actualVal;
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
        
        const actualDS = data.datasets[0].data;
        const projDS = data.datasets[1].data;
        
        chart.getDatasetMeta(1).data.forEach((bar, index) => {
          const actualVal = actualDS[index];
          const projVal = projDS[index];
          const delta = projVal - actualVal;
          if (Math.abs(delta) < 0.05) return;
          
          const sign = delta > 0 ? "+" : "";
          const color = delta > 0 ? "#0a5d3a" : "#eb5e28";
          ctx.fillStyle = color;
          
          const yPos = bar.y + (projVal >= 0 ? -8 : 12);
          ctx.fillText(`${sign}${delta.toFixed(1)}M`, bar.x, yPos);
        });
        ctx.restore();
      }
    }]
  });
  chartRegistry.set(canvas1Id, chart1);

  // 2. Solvency & Equity Chart (Dual Y-Axis)
  if (chartRegistry.has(canvas2Id)) {
    chartRegistry.get(canvas2Id).destroy();
  }
  const ctx2 = document.getElementById(canvas2Id).getContext("2d");
  const chart2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: [
        state.isPt ? "Real 2024/25" : "Actual 2024/25",
        state.isPt ? "Projetado 2025/26" : "Projected 2025/26",
      ],
      datasets: [
        {
          label: state.isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
          data: [baseEquity / 1000, projEquity],
          backgroundColor: state.COLORS.goldSoft || FALLBACK.goldSoft,
          borderColor: state.COLORS.gold || FALLBACK.gold,
          borderWidth: 1.5,
          yAxisID: "y",
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          data: [baseSolvency, projSolvency],
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
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: state.isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
          },
          grid: { color: state.COLORS.rule || "rgba(0, 0, 0, 0.05)" }
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: state.isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          },
          min: 0,
          max: Math.max(30, baseSolvency + 5, projSolvency + 5),
          grid: { drawOnChartArea: false }, // Avoid grid lines overlap
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
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
  chartRegistry.set(canvas2Id, chart2);
}
