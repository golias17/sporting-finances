import { state } from "./state.js";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";

Chart.register(annotationPlugin);

// Premium line shadow glow plugin for dark mode
const lineShadowPlugin = {
  id: "lineShadow",
  beforeDatasetDraw(chart, args) {
    if (args.meta.type === "line") {
      const ctx = chart.ctx;
      ctx.save();
      const isDark = document.body.classList.contains("dark");
      if (isDark) {
        const dataset = chart.data.datasets[args.index];
        ctx.shadowColor = dataset.borderColor || "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
      }
    }
  },
  afterDatasetDraw(chart, args) {
    if (args.meta.type === "line") {
      chart.ctx.restore();
    }
  },
};

Chart.register(lineShadowPlugin);

import {
  fmtMillions,
  fmtPct,
  ZONE_COLORS,
  eventBoxes,
  baseOpts,
  chartRegistry,
  generateAccessibleTable
} from "./chartUtils.js";
export {
  fmtMillions,
  fmtPct,
  ZONE_COLORS,
  eventBoxes,
  baseOpts,
  chartRegistry,
  generateAccessibleTable
};

// state.COLORS and state.baseOpts are initialised by initChartDefaults() in
// chartUtils.js, called once during app boot. Do not assign them here.

export function mkChart(id, config) {
  config.plugins = config.plugins || [];
  if (!config.plugins.includes(annotationPlugin)) {
    config.plugins.push(annotationPlugin);
  }

  let chart = chartRegistry.get(id);
  if (chart) {
    chart.config.data = config.data;
    chart.config.options = config.options;
    chart.update();
  } else {
    chart = new Chart(document.getElementById(id), config);
    chartRegistry.set(id, chart);
  }

  generateAccessibleTable(id, config);
  return chart;
}

// =============================================================
// INDIVIDUAL CHART BUILDERS
// =============================================================

export function chartHero() {
  mkChart("chartHero", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Receitas operacionais" : "Operating revenue",
          data: state.annual.map((d) => d.revenue_operating),
          borderColor: state.COLORS.green,
          backgroundColor: state.COLORS.greenSoft,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: false,
          yAxisID: "y",
        },
        {
          label: state.isPt ? "Resultado líquido" : "Net result",
          data: state.annual.map((d) => d.net_result),
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.goldSoft,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: false,
          yAxisID: "y",
        },
        {
          label: state.isPt ? "Capital próprio" : "Shareholders' equity",
          data: state.annual.map((d) => d.equity),
          borderColor: state.COLORS.info,
          backgroundColor: "rgba(58,114,184,0.1)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: false,
          yAxisID: "y",
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        annotation: { drawTime: 'beforeDatasetsDraw', annotations: eventBoxes([
            "restructure14",
            "alcochete",
            "covid",
            "vmoc1",
            "vmoc2",
            "uspp",
          ]),
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          beginAtZero: false,
          title: {
            display: true,
            text: state.isPt ? "Milhões de EUR" : "EUR (millions)",
          },
        },
      },
    },
  });
}

export function chartNetResult() {
  mkChart("chartNetResult", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Resultado líquido" : "Net result",
          data: state.annual.map((d) => d.net_result),
          backgroundColor: state.annual.map((d) =>
            d.net_result >= 0 ? state.COLORS.posSoft : state.COLORS.negSoft,
          ),
          borderColor: state.annual.map((d) =>
            d.net_result >= 0 ? state.COLORS.pos : state.COLORS.neg,
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
      },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });
}

export function chartEquity() {
  mkChart("chartEquity", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Capital próprio" : "Shareholders' equity",
          data: state.annual.map((d) => d.equity),
          backgroundColor: state.annual.map((d) =>
            d.equity >= 0 ? state.COLORS.posSoft : state.COLORS.negSoft,
          ),
          borderColor: state.annual.map((d) =>
            d.equity >= 0 ? state.COLORS.pos : state.COLORS.neg,
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
      },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });
}

// REVENUE TAB
export function chartRevenue() {
  mkChart("chartRevenue", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Receitas operacionais" : "Operating revenue",
          data: state.annual.map((d) => d.revenue_operating),
          backgroundColor: state.COLORS.green,
          borderRadius: 3,
          order: 1,
        },
        {
          type: "line",
          label: state.isPt ? "Custos com pessoal" : "Personnel Costs",
          data: state.annual.map((d) => Math.abs(d.personnel_costs)),
          borderColor: state.COLORS.neg,
          backgroundColor: "transparent",
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          order: 0,
        },
      ],
    },
    options: state.baseOpts,
  });
}

export function chartRevStreams() {
  const tvComp = state.annual.map((d) => d.rev_tv_comp ?? null);
  const matchday = state.annual.map((d) => d.rev_matchday ?? null);
  const commercial = state.annual.map((d) => d.rev_commercial ?? null);
  const other = state.annual.map((d) => {
    if (d.rev_tv_comp == null) return null;
    const gap =
      d.revenue_operating - d.rev_tv_comp - d.rev_matchday - d.rev_commercial;
    return gap > 1 ? gap : null;
  });

  mkChart("chartRevStreams", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "TV & Competições" : "TV & Competitions",
          data: tvComp,
          backgroundColor: state.COLORS.green,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: state.isPt ? "Bilheteira & Estádio" : "Matchday",
          data: matchday,
          backgroundColor: state.COLORS.info,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: state.isPt ? "Comercial & Patrocínios" : "Commercial",
          data: commercial,
          backgroundColor: state.COLORS.gold,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: state.isPt
            ? "Outras receitas operacionais"
            : "Other operating income",
          data: other,
          backgroundColor: state.COLORS.muted,
          borderRadius: 3,
          stack: "s1",
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: {
          display: true,
          position: "bottom",
          labels: { color: state.COLORS.ink, font: { size: 12 }, padding: 16 },
        },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
            footer: (items) => {
              const total = items.reduce((s, i) => s + i.parsed.y, 0);
              return `Total: ${fmtMillions(total)}`;
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true },
      },
    },
  });
}

export function chartRevVsPayroll() {
  const ratios = state.annual.map(
    (d) => Math.abs(d.personnel_costs) / d.revenue_operating,
  );
  mkChart("chartRevVsPayroll", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Custos com pessoal / Receitas"
            : "Personnel cost / revenue",
          data: ratios.map((r) => r * 100),
          backgroundColor: ratios.map((r) =>
            r > 0.7
              ? state.COLORS.negSoft
              : r > 0.6
                ? state.COLORS.warn
                : state.COLORS.posSoft,
          ),
          borderColor: ratios.map((r) =>
            r > 0.7
              ? state.COLORS.neg
              : r > 0.6
                ? state.COLORS.warn
                : state.COLORS.pos,
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Rácio" : "Ratio"}: ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          ticks: { ...baseOpts.scales.y.ticks, callback: (v) => v + "%" },
          beginAtZero: true,
        },
      },
    },
  });
}

export function chartOpResult() {
  mkChart("chartOpResult", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Operações Recorrentes (excl. passes)"
            : "Recurring (excl. players)",
          data: state.annual.map((d) => d.operating_result_excl_players),
          backgroundColor: state.COLORS.negSoft,
          borderColor: state.COLORS.neg,
          borderWidth: 1,
          stack: "s1",
        },
        {
          label: state.isPt ? "Trading de passes" : "Player trading",
          data: state.annual.map((d) => d.operating_result_players),
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          stack: "s1",
        },
      ],
    },
    options: {
      ...baseOpts,
      scales: {
        ...baseOpts.scales,
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true, beginAtZero: false },
      },
    },
  });
}

// DEBT TAB
export function chartDebt() {
  mkChart("chartDebt", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Financiamentos não correntes (L. Prazo)"
            : "Non-current borrowings",
          data: state.annual.map((d) => d.borrowings_nc),
          backgroundColor: state.COLORS.green,
          stack: "s1",
          order: 1,
        },
        {
          label: state.isPt
            ? "Financiamentos correntes (C. Prazo)"
            : "Current borrowings",
          data: state.annual.map((d) => d.borrowings_c),
          backgroundColor: state.COLORS.greenLight,
          stack: "s1",
          order: 1,
        },
        {
          type: "line",
          label: state.isPt
            ? "Caixa e equivalentes"
            : "Cash on hands; equivalents",
          data: state.annual.map((d) => d.cash),
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.goldSoft,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: false,
          order: 0,
        },
      ],
    },
    options: {
      ...baseOpts,
      scales: {
        ...baseOpts.scales,
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true, beginAtZero: true },
      },
    },
  });
}

export function chartAssetsLiab() {
  mkChart("chartAssetsLiab", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Ativo total" : "Total assets",
          data: state.annual.map((d) => d.total_assets),
          backgroundColor: state.COLORS.green,
          borderRadius: 3,
        },
        {
          label: state.isPt ? "Passivo total" : "Total liabilities",
          data: state.annual.map(
            (d) => d.non_current_liabilities + d.current_liabilities,
          ),
          backgroundColor: state.COLORS.negSoft,
          borderRadius: 3,
        },
      ],
    },
    options: state.baseOpts,
  });
}

export function chartDebtMaturity() {
  const ncShare = state.annual.map(
    (d) => d.borrowings_nc / (d.borrowings_nc + d.borrowings_c),
  );
  mkChart("chartDebtMaturity", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Percentagem de dívida a longo prazo"
            : "Long-term share of debt",
          data: ncShare.map((v) => v * 100),
          borderColor: state.COLORS.green,
          backgroundColor: state.COLORS.greenSoft,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: true,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Longo prazo" : "Long-term"}: ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          ticks: { ...baseOpts.scales.y.ticks, callback: (v) => v + "%" },
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });
}

// SQUAD TAB
export function chartSquadBook() {
  mkChart("chartSquadBook", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Valor contabilístico do plantel (balanço)"
            : "Squad book value (balance sheet)",
          data: [...state.annual.map((d) => d.squad_book_value), null],
          backgroundColor: state.COLORS.green,
          borderRadius: 3,
          order: 2,
        },
        {
          type: "line",
          label: state.isPt
            ? "Valor de mercado do plantel (Transfermarkt)"
            : "Squad market value (Transfermarkt)",
          data: [
            ...state.annual.map((d) => d.squad_market_value),
            state.DATASET.h1_2526.squad_market_value,
          ],
          borderColor: state.COLORS.gold,
          backgroundColor: "rgba(200,169,81,0.18)",
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderColor: state.COLORS.gold,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          spanGaps: true,
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y === null || ctx.parsed.y === undefined)
                return null;
              return ctx.dataset.label + ": " + fmtMillions(ctx.parsed.y);
            },
          },
        },
      },
    },
  });
}

export function chartTransfers() {
  mkChart("chartTransfers", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Receitas de passes de jogadores"
            : "Player transfer income",
          data: state.annual.map((d) => d.player_transfer_income),
          backgroundColor: state.annual.map((d) =>
            d.label === "2023/24"
              ? state.COLORS.goldSoft
              : state.COLORS.posSoft,
          ),
          borderColor: state.annual.map((d) =>
            d.label === "2023/24" ? state.COLORS.gold : state.COLORS.pos,
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: { ...baseOpts.plugins, legend: { display: false } },
    },
  });
}

export function chartNetTrading() {
  const netTrading = state.annual.map(
    (d) =>
      d.player_transfer_income +
      d.player_transfer_cost +
      d.squad_amortization_impairment,
  );
  mkChart("chartNetTrading", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Resultado líquido de trading de jogadores"
            : "Net player trading result",
          data: netTrading,
          backgroundColor: netTrading.map((v) =>
            v >= 0 ? state.COLORS.posSoft : state.COLORS.negSoft,
          ),
          borderColor: netTrading.map((v) =>
            v >= 0 ? state.COLORS.pos : state.COLORS.neg,
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
      },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });
}

// CASH FLOW TAB
export function chartCashFlow() {
  mkChart("chartCashFlow", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Operacional" : "Operating",
          data: state.annual.map((d) => d.cf_operating),
          backgroundColor: state.COLORS.negSoft,
        },
        {
          label: state.isPt
            ? "Investimento (incl. passes)"
            : "Investing (incl. player sales)",
          data: state.annual.map((d) => d.cf_investing),
          backgroundColor: state.COLORS.posSoft,
        },
        {
          label: state.isPt ? "Financiamento" : "Financing",
          data: state.annual.map((d) => d.cf_financing),
          backgroundColor: state.COLORS.infoSoft,
        },
      ],
    },
    options: {
      ...baseOpts,
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });
}

export function chartCash() {
  mkChart("chartCash", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Caixa e equivalentes" : "Cash & equivalents",
          data: state.annual.map((d) => d.cash),
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.goldSoft,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: state.COLORS.chartBg,
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
          fill: true,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: { ...baseOpts.plugins, legend: { display: false } },
    },
  });
}

export function chartAnnualNet() {
  mkChart("chartAnnualNet", {
    type: "bar",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt ? "Resultado líquido" : "Net result",
          data: state.annual.map((d) => d.net_result),
          backgroundColor: state.annual.map((d) =>
            d.net_result >= 0 ? state.COLORS.posSoft : state.COLORS.negSoft,
          ),
          borderColor: state.annual.map((d) =>
            d.net_result >= 0 ? state.COLORS.pos : state.COLORS.neg,
          ),
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: { ...baseOpts.plugins, legend: { display: false } },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });
}

// HEALTH CHECK TAB RATIOS
export function chartPayrollBurden() {
  const ratios = state.annual.map(
    (d) => (Math.abs(d.personnel_costs) / d.revenue_operating) * 100,
  );
  mkChart("chartPayrollBurden", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Custos com pessoal em % da receita"
            : "Wage bill as % of revenue",
          data: ratios, borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            r > 70
              ? state.COLORS.neg
              : r > 60
                ? state.COLORS.warn
                : state.COLORS.pos,
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Custos com pessoal" : "Wage bill"}: ${ctx.parsed.y.toFixed(0)}% ${state.isPt ? "da receita" : "of revenue"}`,
          },
        },
        annotation: { drawTime: 'beforeDatasetsDraw', annotations: {
            redBg: {
              type: "box",
              yMin: 70,
              yMax: 135,
              backgroundColor: ZONE_COLORS.red,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            amberBg: {
              type: "box",
              yMin: 60,
              yMax: 70,
              backgroundColor: ZONE_COLORS.amber,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            greenBg: {
              type: "box",
              yMin: 0,
              yMax: 60,
              backgroundColor: ZONE_COLORS.green,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            line70: {
              type: "line",
              yMin: 70,
              yMax: 70,
              borderColor: state.COLORS.neg,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
            line60: {
              type: "line",
              yMin: 60,
              yMax: 60,
              borderColor: state.COLORS.warn,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          min: 30,
          max: 130,
          ticks: { ...baseOpts.scales.y.ticks, callback: (v) => v + "%" },
        },
      },
    },
  });
}

export function chartTransferReliance() {
  const reliance = state.annual.map((d) => {
    const total = d.revenue_operating + d.player_transfer_income;
    return (d.player_transfer_income / total) * 100;
  });
  mkChart("chartTransferReliance", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Receitas de passes em % das receitas totais"
            : "Transfer income as % of total revenue",
          data: reliance, borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: reliance.map((r) =>
            r > 50
              ? state.COLORS.neg
              : r > 35
                ? state.COLORS.warn
                : state.COLORS.pos,
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Dependência de passes" : "Transfer reliance"}: ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
        annotation: { drawTime: 'beforeDatasetsDraw', annotations: {
            redBg: {
              type: "box",
              yMin: 50,
              yMax: 90,
              backgroundColor: ZONE_COLORS.red,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            amberBg: {
              type: "box",
              yMin: 35,
              yMax: 50,
              backgroundColor: ZONE_COLORS.amber,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            greenBg: {
              type: "box",
              yMin: 0,
              yMax: 35,
              backgroundColor: ZONE_COLORS.green,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            line50: {
              type: "line",
              yMin: 50,
              yMax: 50,
              borderColor: state.COLORS.neg,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
            line35: {
              type: "line",
              yMin: 35,
              yMax: 35,
              borderColor: state.COLORS.warn,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          min: 0,
          max: 80,
          ticks: { ...baseOpts.scales.y.ticks, callback: (v) => v + "%" },
        },
      },
    },
  });
}

export function chartDebtLoad() {
  const netDebtRatio = state.annual.map((d) => {
    const netDebt = d.borrowings_nc + d.borrowings_c - d.cash;
    return netDebt / d.revenue_operating;
  });
  mkChart("chartDebtLoad", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Dívida líquida / receita anual"
            : "Net debt / annual revenue",
          data: netDebtRatio, borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: netDebtRatio.map((r) =>
            r > 2
              ? state.COLORS.neg
              : r > 1
                ? state.COLORS.warn
                : state.COLORS.pos,
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Dívida líquida" : "Net debt"}: ${ctx.parsed.y.toFixed(1)}× ${state.isPt ? "receita anual" : "annual revenue"}`,
          },
        },
        annotation: { drawTime: 'beforeDatasetsDraw', annotations: {
            redBg: {
              type: "box",
              yMin: 2,
              yMax: 14,
              backgroundColor: ZONE_COLORS.red,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            amberBg: {
              type: "box",
              yMin: 1,
              yMax: 2,
              backgroundColor: ZONE_COLORS.amber,
              borderWidth: 0,
              label: {
                display: false,
                content: state.isPt
                  ? "Alerta (1.0-2.0x)"
                  : "Caution (1.0-2.0x)",
                position: { x: "start", y: "center" },
                xAdjust: 10,
                color: state.COLORS.warn,
                font: { family: "Inter", size: 10, weight: "bold" },
                padding: 6,
              },
            },
            greenBg: {
              type: "box",
              yMin: -2,
              yMax: 1,
              backgroundColor: ZONE_COLORS.green,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            line2: {
              type: "line",
              yMin: 2,
              yMax: 2,
              borderColor: state.COLORS.neg,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
            line1: {
              type: "line",
              yMin: 1,
              yMax: 1,
              borderColor: state.COLORS.warn,
              borderWidth: 1.5,
              z: -1, borderDash: [4, 4],
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          beginAtZero: false,
          ticks: {
            ...baseOpts.scales.y.ticks,
            callback: (v) => v.toFixed(1) + "×",
          },
        },
      },
    },
  });
}

export function chartCurrentRatio() {
  const ratios = state.annual.map(
    (d) => d.current_assets / d.current_liabilities,
  );
  mkChart("chartCurrentRatio", {
    type: "line",
    data: {
      labels: state.annual.map((d) => d.label),
      datasets: [
        {
          label: state.isPt
            ? "Ativo de curto prazo / Passivo de curto prazo"
            : "Short-term assets / short-term liabilities",
          data: ratios, borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            r < 0.5
              ? state.COLORS.neg
              : r < 1.0
                ? state.COLORS.warn
                : state.COLORS.pos,
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) =>
              `${state.isPt ? "Rácio de solvência" : "Current ratio"}: ${ctx.parsed.y.toFixed(2)}×`,
          },
        },
        annotation: { drawTime: 'beforeDatasetsDraw', annotations: {
            redBg: {
              type: "box",
              yMin: 0,
              yMax: 0.5,
              backgroundColor: ZONE_COLORS.red,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            amberBg: {
              type: "box",
              yMin: 0.5,
              yMax: 1.0,
              backgroundColor: ZONE_COLORS.amber,
              borderWidth: 0,
              label: {
                display: false,
                content: state.isPt
                  ? "Alerta (0.5-1.0x)"
                  : "Caution (0.5-1.0x)",
                position: { x: "start", y: "center" },
                xAdjust: 10,
                color: state.COLORS.warn,
                font: { family: "Inter", size: 10, weight: "bold" },
                padding: 6,
              },
            },
            greenBg: {
              type: "box",
              yMin: 1.0,
              yMax: 3.5,
              backgroundColor: ZONE_COLORS.green,
              borderWidth: 0,
              label: {
                display: false,
                padding: 6,
              },
            },
            line05: {
              type: "line",
              yMin: 0.5, 
              yMax: 0.5, 
              borderColor: state.COLORS.neg, 
              borderWidth: 1.5, 
              z: -1, borderDash: [4, 4]
            }, 
              line1: { 
                type: "line", 
                yMin: 1.0,
                yMax: 1.0,
                borderColor: state.COLORS.warn,
                borderWidth: 1.5,
                z: -1, borderDash: [4, 4],
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          beginAtZero: true,
          ticks: {
            ...baseOpts.scales.y.ticks,
            callback: (v) => v.toFixed(1) + "×",
          },
        },
      },
    },
  });
}
