import Chart from "chart.js/auto";
import { state } from "./state.js";
import { chartRegistry, styledLineDataset } from "./chartUtils.js";

// Baseline actuals from 2024/25 (in thousands of EUR)
const BASELINE = {
  revenue_operating: 148149,
  personnel_costs: -87736,
  external_supplies: -48196,
  da_excl_squad: -7235,
  squad_amortization: -50218,
  player_transfer_cost: -14615,
  player_transfer_income: 116830, // baseline actual sales
  financial_result: -25246,
  net_result: 20023,
  equity: 40928,
  current_assets: 102909,
  current_liabilities: 165071,
  total_assets: 374400,
  cash: 7008,
};

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

  const projNetResult =
    (projRevenue + projPayroll + projOverhead + BASELINE.da_excl_squad) +
    projNetTrading +
    projFinancialResult - 11710; // balancing adjustment for other operating costs to match audited 2024/25 Net Result of €20.0M

  const projEquity = BASELINE.equity + projNetResult;

  // Solvency impact (Equity / Total Assets) - both base and proj are calculated at the end of the season
  const projTotalAssets = BASELINE.total_assets + (projNetResult - BASELINE.net_result) - (debtRepayTarget * 1000);
  const projSolvency = (projEquity / projTotalAssets) * 100;
  const baseEquity = BASELINE.equity + BASELINE.net_result;
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
          backgroundColor: state.COLORS.greenSoft || "rgba(10, 93, 58, 0.4)",
          borderColor: state.COLORS.green || "#0a5d3a",
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
          data: [(BASELINE.equity + BASELINE.net_result) / 1000, projEquity],
          backgroundColor: state.COLORS.goldSoft || "rgba(176, 137, 35, 0.4)",
          borderColor: state.COLORS.gold || "#b08923",
          borderWidth: 1.5,
          yAxisID: "y",
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          data: [baseSolvency, projSolvency],
          color: state.COLORS.green || "#0a5d3a",
          bg: state.COLORS.greenSoft || "rgba(10, 93, 58, 0.2)",
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
