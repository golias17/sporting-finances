import Chart from "chart.js/auto";
import { state } from "./state.js";
import { chartRegistry, generateAccessibleTable, addChartDownloadButton, styledLineDataset } from "./chartUtils.js";

function getEraForSeason(season) {
  if (season === "2012/13") return state.isPt ? "Jesualdo/Sá Pinto (12/13)" : "Jesualdo/Sa Pinto (12/13)";
  if (season === "2013/14") return "Leonardo Jardim (13/14)";
  if (season === "2014/15") return "Marco Silva (14/15)";
  if (["2015/16", "2016/17", "2017/18"].includes(season)) return "Jorge Jesus (15/16 - 17/18)";
  if (["2018/19", "2019/20"].includes(season)) return "Keizer / Silas (18/19 - 19/20)";
  return "Rúben Amorim (20/21 - 25/26)";
}

export function drawManagerEras() {
  const canvasId = "chartManagerEras";
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const erasData = {
    "Jesualdo/Sa Pinto (12/13)": { sales: 0, purchases: 0 },
    "Leonardo Jardim (13/14)": { sales: 0, purchases: 0 },
    "Marco Silva (14/15)": { sales: 0, purchases: 0 },
    "Jorge Jesus (15/16 - 17/18)": { sales: 0, purchases: 0 },
    "Keizer / Silas (18/19 - 19/20)": { sales: 0, purchases: 0 },
    "Rúben Amorim (20/21 - 25/26)": { sales: 0, purchases: 0 },
  };

  if (state.isPt) {
    erasData["Jesualdo/Sá Pinto (12/13)"] = { sales: 0, purchases: 0 };
    delete erasData["Jesualdo/Sa Pinto (12/13)"];
  }

  state.TRANSFER_LEDGER.forEach((seasonObj) => {
    const era = getEraForSeason(seasonObj.season);
    if (!erasData[era]) return;

    let salesTotal = 0;
    let purchasesTotal = 0;

    if (seasonObj.sales) {
      seasonObj.sales.forEach((p) => salesTotal += p.fee || 0);
    }
    if (seasonObj.purchases) {
      seasonObj.purchases.forEach((p) => purchasesTotal += p.fee || 0);
    }

    erasData[era].sales += salesTotal;
    erasData[era].purchases += purchasesTotal;
  });

  const labels = Object.keys(erasData);
  const sales = labels.map(l => erasData[l].sales);
  const purchases = labels.map(l => erasData[l].purchases);
  const netSpend = labels.map(l => erasData[l].sales - erasData[l].purchases);

  if (chartRegistry.has(canvasId)) {
    chartRegistry.get(canvasId).destroy();
  }

  const ctx = canvas.getContext("2d");
  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: state.isPt ? "Vendas (M€)" : "Sales (M€)",
          data: sales,
          backgroundColor: state.COLORS.pos || "#2e8a55",
          borderRadius: 4,
          order: 1,
        },
        {
          label: state.isPt ? "Compras (M€)" : "Purchases (M€)",
          data: purchases,
          backgroundColor: state.COLORS.neg || "#b8403a",
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Ganho Líquido (M€)" : "Net Earnings (M€)",
          data: netSpend,
          color: state.COLORS.gold || "#b08923",
          bg: state.COLORS.goldSoft || "rgba(176,137,35,0.4)",
          extra: { type: "line", order: 0 }
        })
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: state.COLORS.ink || "#111814",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
          }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw.toFixed(1)} M€`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: state.COLORS.muted || "#6a716e",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
          },
          grid: { color: state.COLORS.rule || "rgba(0, 0, 0, 0.05)" }
        },
        y: {
          ticks: {
            color: state.COLORS.muted || "#6a716e",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
            callback: value => value + " M€",
          },
          grid: { color: state.COLORS.rule || "rgba(0, 0, 0, 0.05)" }
        }
      }
    }
  };

  const chart = new Chart(ctx, config);
  chartRegistry.set(canvasId, chart);

  generateAccessibleTable(canvasId, config);
  addChartDownloadButton(canvasId);
}

export function drawCommissions() {
  const canvasId = "chartCommissions";
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const seasons = state.TRANSFER_LEDGER.map(s => s.season);
  const salesCommissions = [];
  const purchasesCommissions = [];

  state.TRANSFER_LEDGER.forEach((seasonObj) => {
    let salesComm = 0;
    let purchasesComm = 0;

    if (seasonObj.sales) {
      seasonObj.sales.forEach((p) => salesComm += p.commission || 0);
    }
    if (seasonObj.purchases) {
      seasonObj.purchases.forEach((p) => purchasesComm += p.commission || 0);
    }

    salesCommissions.push(salesComm);
    purchasesCommissions.push(purchasesComm);
  });

  if (chartRegistry.has(canvasId)) {
    chartRegistry.get(canvasId).destroy();
  }

  const ctx = canvas.getContext("2d");
  const config = {
    type: "bar",
    data: {
      labels: seasons,
      datasets: [
        {
          label: state.isPt ? "Comissões em Vendas" : "Sales Commissions",
          data: salesCommissions,
          backgroundColor: state.COLORS.pos || "#2e8a55",
          stack: "Stack 0",
        },
        {
          label: state.isPt ? "Comissões em Compras" : "Acquisition Commissions",
          data: purchasesCommissions,
          backgroundColor: state.COLORS.neg || "#b8403a",
          stack: "Stack 0",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: state.COLORS.ink || "#111814",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
          }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw.toFixed(1)} M€`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: state.COLORS.muted || "#6a716e",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
          },
          grid: { color: state.COLORS.rule || "rgba(0, 0, 0, 0.05)" }
        },
        y: {
          stacked: true,
          ticks: {
            color: state.COLORS.muted || "#6a716e",
            font: { family: state.COLORS.fontFamily || "sans-serif" },
            callback: value => value + " M€",
          },
          grid: { color: state.COLORS.rule || "rgba(0, 0, 0, 0.05)" }
        }
      }
    }
  };

  const chart = new Chart(ctx, config);
  chartRegistry.set(canvasId, chart);

  generateAccessibleTable(canvasId, config);
  addChartDownloadButton(canvasId);
}
