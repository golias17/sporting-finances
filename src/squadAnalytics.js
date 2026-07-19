import { state } from "./state.js";
import { styledLineDataset, getBrandColors } from "./chartUtils.js";
import { mkChart } from "./charts.js";

// Defensive fallback for the (in practice, always-initialized-by-boot)
// case where a chart is drawn before initChartDefaults() has populated
// state.COLORS — derived from the canonical palette so this can't drift
// from the live app's colors the way independently hardcoded hex literals
// used to.
const FALLBACK = getBrandColors(false);

// Season -> manager era lookup. Sporting had three head coaches during
// 2024/25 alone (Amorim left for Man Utd in Nov 2024, João Pereira was
// interim for 8 matches, Rui Borges took over 26 Dec 2024), so that season
// is bucketed as a transition year rather than attributed to one manager.
// The last entry is an open-ended fallback and MUST be updated once Rui
// Borges' tenure ends (confirmed still in charge as of April 2026, with
// reports of a contract extension through 2028/29).
// Only the first entry carries a `pt` override — not an oversight. Every
// other label is a manager's proper name (Jorge Jesus, Rúben Amorim, Rui
// Borges...), which is spelled identically in Portuguese and English
// throughout the rest of the app (see storySteps.js, translations.json);
// getEraForSeason()'s `state.isPt && entry.pt ? entry.pt : entry.en`
// fallback already handles that correctly without duplicating the string.
const MANAGER_ERAS = [
  { seasons: ["2012/13"], en: "Jesualdo/Sa Pinto (12/13)", pt: "Jesualdo/Sá Pinto (12/13)" },
  { seasons: ["2013/14"], en: "Leonardo Jardim (13/14)" },
  { seasons: ["2014/15"], en: "Marco Silva (14/15)" },
  { seasons: ["2015/16", "2016/17", "2017/18"], en: "Jorge Jesus (15/16 - 17/18)" },
  { seasons: ["2018/19", "2019/20"], en: "Keizer / Silas (18/19 - 19/20)" },
  { seasons: ["2020/21", "2021/22", "2022/23", "2023/24"], en: "Rúben Amorim (20/21 - 23/24)" },
  { seasons: ["2024/25"], en: "Amorim / Pereira / Borges (24/25)" },
  { seasons: [], en: "Rui Borges (25/26 - )", isFallback: true },
];

export function getEraForSeason(season) {
  const entry = MANAGER_ERAS.find((e) => e.seasons.includes(season)) || MANAGER_ERAS[MANAGER_ERAS.length - 1];
  return state.isPt && entry.pt ? entry.pt : entry.en;
}

function getAllEraLabels() {
  return MANAGER_ERAS.map((e) => (state.isPt && e.pt ? e.pt : e.en));
}

// Shared plugins/scales options for this file's two bar+line transfer
// charts (drawManagerEras, drawCommissions) — same legend/tooltip styling
// and M€-suffixed axis ticks in both, only `stacked` differs.
//
// This used to build its options from scratch and read state.COLORS.fontFamily
// / state.COLORS.rule — neither of which exists in chartUtils.js's PALETTE, so
// every render silently fell back to a hardcoded "sans-serif"/light-mode-only
// grid color (while also spamming the COLORS Proxy's "accessed before
// initChartDefaults()" console.warn) and, since these charts hand-rolled
// Chart.js's plain default tooltip instead of the app-wide glass tooltip,
// looked inconsistent with every other chart. Spreading ...state.baseOpts
// (same fix already applied to playground.js's charts — see its comment
// there) fixes all three: themed dark-mode-aware ticks/grid, the shared
// glass tooltip, and no more bogus color lookups.
function transferChartOptions({ stacked = false } = {}) {
  return {
    ...state.baseOpts,
    plugins: {
      ...state.baseOpts.plugins,
      legend: {
        display: true,
        position: "bottom",
        labels: { color: state.COLORS.ink || FALLBACK.ink, font: { size: 12 }, padding: 16 },
      },
      tooltip: {
        ...state.baseOpts.plugins.tooltip,
        callbacks: {
          ...state.baseOpts.plugins.tooltip.callbacks,
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toFixed(1)} M€`;
          }
        }
      }
    },
    scales: {
      x: { ...state.baseOpts.scales.x, stacked },
      y: {
        ...state.baseOpts.scales.y,
        stacked,
        // Override the shared callback: it assumes raw EUR-thousands input
        // (divides by 1000 again), but this file's data is already in M€.
        ticks: { ...state.baseOpts.scales.y.ticks, callback: (value) => value + " M€" },
      }
    }
  };
}

export function drawManagerEras() {
  const canvasId = "chartManagerEras";
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const erasData = {};
  getAllEraLabels().forEach((label) => {
    erasData[label] = { sales: 0, purchases: 0 };
  });

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

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: state.isPt ? "Vendas (M€)" : "Sales (M€)",
          data: sales,
          backgroundColor: state.COLORS.posSoft || FALLBACK.posSoft,
          borderColor: state.COLORS.pos || FALLBACK.pos,
          borderWidth: 1,
          borderRadius: 4,
          order: 1,
        },
        {
          label: state.isPt ? "Compras (M€)" : "Purchases (M€)",
          data: purchases,
          backgroundColor: state.COLORS.negSoft || FALLBACK.negSoft,
          borderColor: state.COLORS.neg || FALLBACK.neg,
          borderWidth: 1,
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Ganho Líquido (M€)" : "Net Earnings (M€)",
          data: netSpend,
          color: state.COLORS.gold || FALLBACK.gold,
          bg: state.COLORS.goldSoft || FALLBACK.goldSoft,
          extra: { type: "line", order: 0 }
        })
      ]
    },
    options: transferChartOptions(),
  };

  mkChart(canvasId, config);
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

  const config = {
    type: "bar",
    data: {
      labels: seasons,
      datasets: [
        {
          label: state.isPt ? "Comissões em Vendas" : "Sales Commissions",
          data: salesCommissions,
          backgroundColor: state.COLORS.posSoft || FALLBACK.posSoft,
          borderColor: state.COLORS.pos || FALLBACK.pos,
          borderWidth: 1,
          stack: "Stack 0",
        },
        {
          label: state.isPt ? "Comissões em Compras" : "Acquisition Commissions",
          data: purchasesCommissions,
          backgroundColor: state.COLORS.negSoft || FALLBACK.negSoft,
          borderColor: state.COLORS.neg || FALLBACK.neg,
          borderWidth: 1,
          stack: "Stack 0",
        }
      ]
    },
    options: transferChartOptions({ stacked: true }),
  };

  mkChart(canvasId, config);
}
