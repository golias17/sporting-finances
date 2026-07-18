import { state } from "./state.js";
import { getLatestH1Data } from "./metrics.js";
import { HEALTH_THRESHOLDS } from "./healthThresholds.js";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(annotationPlugin);
Chart.register(zoomPlugin);

// Premium line shadow glow plugin for all themes
const lineShadowPlugin = {
  id: "lineShadow",
  beforeDatasetDraw(chart, args) {
    if (args.meta.type === "line") {
      const ctx = chart.ctx;
      ctx.save();
      const dataset = chart.data.datasets[args.index];
      ctx.shadowColor = dataset.borderColor || "rgba(255, 255, 255, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
    }
  },
  afterDatasetDraw(chart, args) {
    if (args.meta.type === "line") {
      chart.ctx.restore();
    }
  },
};

Chart.register(lineShadowPlugin);

// Custom background plugin to draw state.COLORS.chartBg under the chart on image export
const canvasBackgroundPlugin = {
  id: "canvasBackground",
  beforeDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = state.COLORS.chartBg || "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

Chart.register(canvasBackgroundPlugin);

import {
  fmtMillions,
  ZONE_COLORS,
  eventBoxes,
  baseOpts,
  chartRegistry,
  generateAccessibleTable,
  addChartDownloadButton,
} from "./chartUtils.js";
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
  addChartDownloadButton(id);
  return chart;
}

// =============================================================
// SHARED CHART-BUILDING HELPERS
//
// Extracted because the same handful of shapes (a "premium" styled line
// dataset, a bar chart colored green/red by sign, and a threshold-based
// health-ratio line chart with red/amber/green zone annotations) were
// being retyped near-identically across many of the builders below. Each
// helper only assembles the repeated shape — the specific numbers, labels
// and thresholds for each chart still live at its own call site so they
// stay easy to find and change.
// =============================================================

/**
 * Season labels for the x-axis, shared by every chart in this file (each
 * one previously re-typed `state.annual.map((d) => d.label)` itself).
 */
function seasonLabels() {
  return state.annual.map((d) => d.label);
}

/**
 * The recurring "premium" line-dataset style used by chartHero, the cash
 * line in chartDebt, chartCash, chartDebtMaturity and the squad market
 * value line in chartSquadBook: a thick tensioned line with themed points.
 * `pointBorderColor` is only included when explicitly passed — most of
 * these datasets never set it (leaving Chart.js' own default), so the
 * helper omits the key by default rather than guessing a value, to avoid
 * changing any chart's rendered look during this refactor.
 * Extra Chart.js dataset keys (e.g. `type: "line"`, `order`, `yAxisID`)
 * can be passed through via `extra`.
 */
function styledLineDataset({
  label,
  data,
  color,
  bg,
  fill = false,
  spanGaps = false,
  pointBorderColor,
  extra = {},
}) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: bg,
    tension: 0.35,
    borderWidth: 3,
    pointRadius: 4,
    pointBackgroundColor: state.COLORS.chartBg,
    ...(pointBorderColor ? { pointBorderColor } : {}),
    pointBorderWidth: 2,
    pointHoverRadius: 7,
    pointHoverBorderWidth: 3,
    fill,
    spanGaps,
    ...extra,
  };
}

/**
 * Builds a single-series bar chart colored green/red by whether each value
 * is positive or negative — the pattern shared by chartNetResult,
 * chartEquity, chartNetTrading and chartAnnualNet.
 */
function posNegBarChart(id, { labelText, data, borderRadius }) {
  mkChart(id, {
    type: "bar",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: labelText,
          data,
          backgroundColor: data.map((v) =>
            v >= 0 ? state.COLORS.posSoft : state.COLORS.negSoft,
          ),
          borderColor: data.map((v) =>
            v >= 0 ? state.COLORS.pos : state.COLORS.neg,
          ),
          borderWidth: 1,
          ...(borderRadius ? { borderRadius } : {}),
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

/**
 * Picks green/amber/red for a health-ratio point based on two thresholds.
 * By default a higher value is worse (payroll burden, transfer reliance,
 * net debt load); pass `invert: true` for ratios where a *lower* value is
 * worse (current ratio).
 */
function zoneColor(value, low, high, invert = false) {
  if (invert) {
    return value < low
      ? state.COLORS.neg
      : value < high
        ? state.COLORS.warn
        : state.COLORS.pos;
  }
  return value > high
    ? state.COLORS.neg
    : value > low
      ? state.COLORS.warn
      : state.COLORS.pos;
}

/**
 * Assembles the red/amber/green background-box + dashed threshold-line
 * annotation set shared by the four health-ratio line charts. `zones` and
 * `lines` carry each chart's own numbers/colors/labels — this just removes
 * the repeated ~10-line object-literal shape for each box/line.
 */
function zoneAnnotations({ zones, lines }) {
  const annotations = {};
  zones.forEach((z) => {
    annotations[z.key] = {
      type: "box",
      yMin: z.min,
      yMax: z.max,
      backgroundColor: z.color,
      borderWidth: 0,
      label: z.label || { display: false, padding: 6 },
    };
  });
  lines.forEach((l) => {
    annotations[l.key] = {
      type: "line",
      yMin: l.value,
      yMax: l.value,
      borderColor: l.color,
      borderWidth: 1.5,
      z: -1,
      borderDash: [4, 4],
    };
  });
  return annotations;
}

// =============================================================
// INDIVIDUAL CHART BUILDERS
// =============================================================

export function chartHero() {
  mkChart("chartHero", {
    type: "line",
    data: {
      labels: seasonLabels(),
      datasets: [
        styledLineDataset({
          label: state.isPt ? "Receitas operacionais" : "Operating revenue",
          data: state.annual.map((d) => d.revenue_operating),
          color: state.COLORS.green,
          bg: state.COLORS.greenSoft,
          extra: { yAxisID: "y" },
        }),
        styledLineDataset({
          label: state.isPt ? "Resultado líquido" : "Net result",
          data: state.annual.map((d) => d.net_result),
          color: state.COLORS.gold,
          bg: state.COLORS.goldSoft,
          extra: { yAxisID: "y" },
        }),
        styledLineDataset({
          label: state.isPt ? "Capital próprio" : "Shareholders' equity",
          data: state.annual.map((d) => d.equity),
          color: state.COLORS.info,
          bg: "rgba(58,114,184,0.1)",
          extra: { yAxisID: "y" },
        }),
      ],
    },
    options: {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: eventBoxes([
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
  posNegBarChart("chartNetResult", {
    labelText: state.isPt ? "Resultado líquido" : "Net result",
    data: state.annual.map((d) => d.net_result),
  });
}

export function chartEquity() {
  posNegBarChart("chartEquity", {
    labelText: state.isPt ? "Capital próprio" : "Shareholders' equity",
    data: state.annual.map((d) => d.equity),
  });
}

// REVENUE TAB
export function chartRevenue() {
  mkChart("chartRevenue", {
    type: "bar",
    data: {
      labels: seasonLabels(),
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
      labels: seasonLabels(),
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
  // Same canonical cutoffs as the health-check card and chartPayrollBurden —
  // healthThresholds.js exists precisely so these can't drift apart.
  const { warn, danger } = HEALTH_THRESHOLDS.payrollRatio;
  mkChart("chartRevVsPayroll", {
    type: "bar",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Custos com pessoal / Receitas"
            : "Personnel cost / revenue",
          data: ratios.map((r) => r * 100),
          backgroundColor: ratios.map((r) =>
            r > danger
              ? state.COLORS.negSoft
              : r > warn
                ? state.COLORS.warn
                : state.COLORS.posSoft,
          ),
          borderColor: ratios.map((r) =>
            r > danger
              ? state.COLORS.neg
              : r > warn
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
  const recurring = state.annual.map((d) => d.operating_result_excl_players);
  const players = state.annual.map((d) => d.operating_result_players);
  const total = recurring.map((v, i) => v + (players[i] || 0));

  mkChart("chartOpResult", {
    type: "bar",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Operações Recorrentes (excl. passes)"
            : "Recurring (excl. players)",
          data: recurring,
          backgroundColor: state.COLORS.negSoft,
          borderColor: state.COLORS.neg,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        {
          label: state.isPt ? "Trading de passes" : "Player trading",
          data: players,
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        styledLineDataset({
          label: state.isPt ? "Resultado Operacional Total" : "Total Operating Result",
          data: total,
          color: state.COLORS.gold,
          bg: state.COLORS.goldSoft,
          extra: { type: "line", order: 0 },
        }),
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
      labels: seasonLabels(),
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
        styledLineDataset({
          label: state.isPt
            ? "Caixa e equivalentes"
            : "Cash on hands; equivalents",
          data: state.annual.map((d) => d.cash),
          color: state.COLORS.gold,
          bg: state.COLORS.goldSoft,
          extra: { type: "line", order: 0 },
        }),
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
      labels: seasonLabels(),
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
      labels: seasonLabels(),
      datasets: [
        styledLineDataset({
          label: state.isPt
            ? "Percentagem de dívida a longo prazo"
            : "Long-term share of debt",
          data: ncShare.map((v) => v * 100),
          color: state.COLORS.green,
          bg: state.COLORS.greenSoft,
          fill: true,
        }),
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
  // Append an extra "H1" data point (with a matching label) only when a
  // latest-H1 snapshot actually exists in the dataset. Previously the extra
  // data point was always appended to both datasets without a matching
  // labels entry — Chart.js rendered it fine (categorical axes tolerate
  // data.length > labels.length), but generateAccessibleTable() in
  // chartUtils.js zips rows from data.labels, so the H1 point was silently
  // dropped from the screen-reader/data-table view. Keeping labels and data
  // the same length fixes that and gives the H1 point a real axis label
  // instead of a blank trailing category.
  const h1Data = getLatestH1Data(state.DATASET);
  const labels = seasonLabels();
  const bookValues = state.annual.map((d) => d.squad_book_value);
  const marketValues = state.annual.map((d) => d.squad_market_value);
  if (h1Data) {
    labels.push(h1Data.label ?? (state.isPt ? "1º Semestre" : "H1"));
    bookValues.push(null);
    marketValues.push(h1Data.squad_market_value ?? null);
  }

  mkChart("chartSquadBook", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: state.isPt
            ? "Valor contabilístico do plantel (balanço)"
            : "Squad book value (balance sheet)",
          data: bookValues,
          backgroundColor: state.COLORS.green,
          borderRadius: 3,
          order: 2,
        },
        styledLineDataset({
          label: state.isPt
            ? "Valor de mercado do plantel (Transfermarkt)"
            : "Squad market value (Transfermarkt)",
          data: marketValues,
          color: state.COLORS.gold,
          bg: "rgba(200,169,81,0.18)",
          spanGaps: true,
          pointBorderColor: state.COLORS.gold,
          extra: { type: "line", order: 1 },
        }),
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
  // Highlight the all-time record income season in gold. Computed from the
  // full dataset (not the filtered range) so the record doesn't "move" when
  // the user narrows the era filter — and so it updates itself the season a
  // new record lands, instead of being pinned to a hardcoded label.
  const recordLabel = state.fullAnnual.reduce(
    (best, d) =>
      best === null || d.player_transfer_income > best.player_transfer_income
        ? d
        : best,
    null,
  )?.label;
  mkChart("chartTransfers", {
    type: "bar",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Receitas de passes de jogadores"
            : "Player transfer income",
          data: state.annual.map((d) => d.player_transfer_income),
          backgroundColor: state.annual.map((d) =>
            d.label === recordLabel
              ? state.COLORS.goldSoft
              : state.COLORS.posSoft,
          ),
          borderColor: state.annual.map((d) =>
            d.label === recordLabel ? state.COLORS.gold : state.COLORS.pos,
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
  posNegBarChart("chartNetTrading", {
    labelText: state.isPt
      ? "Resultado líquido de trading de jogadores"
      : "Net player trading result",
    data: netTrading,
  });
}

// CASH FLOW TAB
export function chartCashFlow() {
  mkChart("chartCashFlow", {
    type: "bar",
    data: {
      labels: seasonLabels(),
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
      labels: seasonLabels(),
      datasets: [
        styledLineDataset({
          label: state.isPt ? "Caixa e equivalentes" : "Cash & equivalents",
          data: state.annual.map((d) => d.cash),
          color: state.COLORS.gold,
          bg: state.COLORS.goldSoft,
          fill: true,
        }),
      ],
    },
    options: {
      ...baseOpts,
      plugins: { ...baseOpts.plugins, legend: { display: false } },
    },
  });
}

export function chartAnnualNet() {
  posNegBarChart("chartAnnualNet", {
    labelText: state.isPt ? "Resultado líquido" : "Net result",
    data: state.annual.map((d) => d.net_result),
    borderRadius: 3,
  });
}

// HEALTH CHECK TAB RATIOS
export function chartPayrollBurden() {
  const ratios = state.annual.map(
    (d) => (Math.abs(d.personnel_costs) / d.revenue_operating) * 100,
  );
  // HEALTH_THRESHOLDS stores payrollRatio as a fraction (0.6 = 60%) to match
  // metrics.js's calculateHealthSignals(), which uses the same cutoffs for
  // the health-check card right next to this chart — scale to the 0-100
  // percentage this chart displays.
  const warnPct = HEALTH_THRESHOLDS.payrollRatio.warn * 100;
  const dangerPct = HEALTH_THRESHOLDS.payrollRatio.danger * 100;
  mkChart("chartPayrollBurden", {
    type: "line",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Custos com pessoal em % da receita"
            : "Wage bill as % of revenue",
          data: ratios,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            zoneColor(r, warnPct, dangerPct),
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
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              {
                key: "redBg",
                min: dangerPct,
                max: 135,
                color: ZONE_COLORS.red,
              },
              {
                key: "amberBg",
                min: warnPct,
                max: dangerPct,
                color: ZONE_COLORS.amber,
              },
              {
                key: "greenBg",
                min: 0,
                max: warnPct,
                color: ZONE_COLORS.green,
              },
            ],
            lines: [
              { key: "line70", value: dangerPct, color: state.COLORS.neg },
              { key: "line60", value: warnPct, color: state.COLORS.warn },
            ],
          }),
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
  // Same fraction-to-percentage scaling rationale as chartPayrollBurden —
  // HEALTH_THRESHOLDS.transferReliance is shared with metrics.js.
  const warnPct = HEALTH_THRESHOLDS.transferReliance.warn * 100;
  const dangerPct = HEALTH_THRESHOLDS.transferReliance.danger * 100;
  mkChart("chartTransferReliance", {
    type: "line",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Receitas de passes em % das receitas totais"
            : "Transfer income as % of total revenue",
          data: reliance,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: reliance.map((r) =>
            zoneColor(r, warnPct, dangerPct),
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
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: dangerPct, max: 90, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: warnPct,
                max: dangerPct,
                color: ZONE_COLORS.amber,
              },
              {
                key: "greenBg",
                min: 0,
                max: warnPct,
                color: ZONE_COLORS.green,
              },
            ],
            lines: [
              { key: "line50", value: dangerPct, color: state.COLORS.neg },
              { key: "line35", value: warnPct, color: state.COLORS.warn },
            ],
          }),
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
  // HEALTH_THRESHOLDS.netDebtRatio is already in "× revenue" multiples, the
  // same unit this chart displays — no scaling needed, unlike the two
  // percentage-based charts above.
  const { warn, danger } = HEALTH_THRESHOLDS.netDebtRatio;
  const amberLabel = {
    display: false,
    content: state.isPt
      ? `Alerta (${warn.toFixed(1)}-${danger.toFixed(1)}x)`
      : `Caution (${warn.toFixed(1)}-${danger.toFixed(1)}x)`,
    position: { x: "start", y: "center" },
    xAdjust: 10,
    color: state.COLORS.warn,
    font: { family: "Inter", size: 10, weight: "bold" },
    padding: 6,
  };
  mkChart("chartDebtLoad", {
    type: "line",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Dívida líquida / receita anual"
            : "Net debt / annual revenue",
          data: netDebtRatio,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: netDebtRatio.map((r) =>
            zoneColor(r, warn, danger),
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
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: danger, max: 14, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: warn,
                max: danger,
                color: ZONE_COLORS.amber,
                label: amberLabel,
              },
              { key: "greenBg", min: -2, max: warn, color: ZONE_COLORS.green },
            ],
            lines: [
              { key: "line2", value: danger, color: state.COLORS.neg },
              { key: "line1", value: warn, color: state.COLORS.warn },
            ],
          }),
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
  // HEALTH_THRESHOLDS.currentRatio is inverted (lower is worse): `danger` is
  // the low cutoff, `warn` is the high cutoff — same shape metrics.js uses.
  const { danger, warn } = HEALTH_THRESHOLDS.currentRatio;
  const amberLabel = {
    display: false,
    content: state.isPt
      ? `Alerta (${danger.toFixed(1)}-${warn.toFixed(1)}x)`
      : `Caution (${danger.toFixed(1)}-${warn.toFixed(1)}x)`,
    position: { x: "start", y: "center" },
    xAdjust: 10,
    color: state.COLORS.warn,
    font: { family: "Inter", size: 10, weight: "bold" },
    padding: 6,
  };
  mkChart("chartCurrentRatio", {
    type: "line",
    data: {
      labels: seasonLabels(),
      datasets: [
        {
          label: state.isPt
            ? "Ativo de curto prazo / Passivo de curto prazo"
            : "Short-term assets / short-term liabilities",
          data: ratios,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            zoneColor(r, danger, warn, true),
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
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: 0, max: danger, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: danger,
                max: warn,
                color: ZONE_COLORS.amber,
                label: amberLabel,
              },
              { key: "greenBg", min: warn, max: 3.5, color: ZONE_COLORS.green },
            ],
            lines: [
              { key: "line05", value: danger, color: state.COLORS.neg },
              { key: "line1", value: warn, color: state.COLORS.warn },
            ],
          }),
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
