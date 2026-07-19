import Chart from "chart.js/auto";
import { state } from "./state.js";
import { chartRegistry } from "./chartUtils.js";

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
};

export function initPlayground() {
  const container = document.getElementById("tab-playground");
  if (!container) return;

  // Bind input controls
  const uclSelect = document.getElementById("uclSelect");
  const payrollSlider = document.getElementById("payrollSlider");
  const salesSlider = document.getElementById("salesSlider");
  const capexSlider = document.getElementById("capexSlider");
  const btnReset = document.getElementById("btnResetPlayground");

  if (!uclSelect || !payrollSlider || !salesSlider || !capexSlider || !btnReset) return;

  // Listeners
  const updateProj = () => calculateAndRenderProjections();
  uclSelect.addEventListener("change", updateProj);
  payrollSlider.addEventListener("input", updateProj);
  salesSlider.addEventListener("input", updateProj);
  capexSlider.addEventListener("input", updateProj);

  btnReset.addEventListener("click", () => {
    uclSelect.value = "0";
    payrollSlider.value = 0;
    salesSlider.value = 117;
    capexSlider.value = 0;
    calculateAndRenderProjections();
  });

  // First render
  calculateAndRenderProjections();
}

function calculateAndRenderProjections() {
  const uclPrize = parseInt(document.getElementById("uclSelect").value, 10); // in millions
  const payrollAdj = parseInt(document.getElementById("payrollSlider").value, 10);
  const salesTarget = parseInt(document.getElementById("salesSlider").value, 10); // in millions
  const capexAdj = parseInt(document.getElementById("capexSlider").value, 10);

  // Update label text values
  document.getElementById("payrollVal").textContent = (payrollAdj >= 0 ? "+" : "") + payrollAdj + "%";
  document.getElementById("salesVal").textContent = salesTarget + " M€";
  document.getElementById("capexVal").textContent = (capexAdj >= 0 ? "+" : "") + capexAdj + "%";

  // Calculations (in thousands)
  const projRevenue = BASELINE.revenue_operating + (uclPrize * 1000);
  const projPayroll = BASELINE.personnel_costs * (1 + payrollAdj / 100);
  const projOverhead = BASELINE.external_supplies * (1 + capexAdj / 100);
  
  const projSales = salesTarget * 1000; // slider is in millions
  const projNetTrading = projSales + BASELINE.squad_amortization + BASELINE.player_transfer_cost;
  
  const projNetResult =
    (projRevenue + projPayroll + projOverhead + BASELINE.da_excl_squad) +
    projNetTrading +
    BASELINE.financial_result - 11880; // balancing adjustment for other operating costs to match audited 2024/25 Net Result of €20.0M

  const projEquity = BASELINE.equity + projNetResult;

  // Solvency impact (Cash/Current Assets adjust based on net result change)
  const cashImpact = projNetResult - BASELINE.net_result;
  const projCurrentAssets = Math.max(0, BASELINE.current_assets + cashImpact);
  const projCurrentRatio = projCurrentAssets / BASELINE.current_liabilities;
  const baselineCurrentRatio = BASELINE.current_assets / BASELINE.current_liabilities;

  // Render KPIs
  updateKpi("pgCardRev", "pgKpiRev", "pgKpiRevDiff", projRevenue / 1000, BASELINE.revenue_operating / 1000);
  updateKpi("pgCardNet", "pgKpiNet", "pgKpiNetDiff", projNetResult / 1000, BASELINE.net_result / 1000);
  updateKpi("pgCardEq", "pgKpiEq", "pgKpiEqDiff", projEquity / 1000, BASELINE.equity / 1000);

  // Draw Charts
  drawProjectionCharts(
    projRevenue / 1000,
    projPayroll / 1000,
    projNetTrading / 1000,
    projNetResult / 1000,
    projEquity / 1000,
    projCurrentRatio,
    baselineCurrentRatio
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
  projRatio,
  baseRatio
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
    },
  });
  chartRegistry.set(canvas1Id, chart1);

  // 2. Solvency & Equity Chart
  if (chartRegistry.has(canvas2Id)) {
    chartRegistry.get(canvas2Id).destroy();
  }
  const ctx2 = document.getElementById(canvas2Id).getContext("2d");
  const chart2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: [
        state.isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
        state.isPt ? "Rácio Solvabilidade (x)" : "Solvency Ratio (x)",
      ],
      datasets: [
        {
          label: state.isPt ? "Real 2024/25" : "Actual 2024/25",
          data: [BASELINE.equity / 1000, baseRatio],
          backgroundColor: "rgba(106, 113, 110, 0.4)",
          borderColor: "#6a716e",
          borderWidth: 1,
        },
        {
          label: state.isPt ? "Projetado 2025/26" : "Projected 2025/26",
          data: [projEquity, projRatio],
          backgroundColor: state.COLORS.goldSoft || "rgba(176, 137, 35, 0.4)",
          borderColor: state.COLORS.gold || "#b08923",
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
          title: { display: true, text: "Value" },
        },
      },
    },
  });
  chartRegistry.set(canvas2Id, chart2);
}
