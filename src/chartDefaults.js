import { state } from "./state.js";
import { getBrandColors } from "./chartPalette.js";
import { getPitchMilestone } from "./chartAnnotations.js";
import { externalTooltipHandler } from "./chartWidgets.js";

// CHART DEFAULTS — shared dataset style + the one-time app-wide Chart.js
// options every chart builds on top of.
// =============================================================

/**
 * The recurring "premium" line-dataset style used across the dashboard.
 * Extra Chart.js dataset keys (e.g. `type: "line"`, `order`, `yAxisID`)
 * can be passed through via `extra`.
 */
export function styledLineDataset({
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
 * Initialise state.COLORS and state.baseOpts.
 * Must be called once during app boot (inside setupApp), after the DOM is ready,
 * so that the order of ES module evaluation no longer affects correctness.
 *
 * IMPORTANT: we mutate the existing objects in-place with Object.assign so that
 * any module that captured `const baseOpts = state.baseOpts` at import time still
 * holds a live, populated reference — reassigning state.baseOpts would leave those
 * references pointing at the old empty {}.
 */
export function initChartDefaults() {
  // Light-mode defaults, from the canonical palette in chartPalette.js — see
  // that file's PALETTE comment for why this must stay the single source of
  // truth. updateChartTheme() in themeToggle.js re-applies this same palette
  // (plus the dark-mode variant) once the DOM/theme is known.
  Object.assign(state.COLORS, getBrandColors(false));

  Object.assign(state.baseOpts, {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, font: { size: 11.5 } },
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          footer: (tooltipItems) => {
            const label = tooltipItems[0]?.label;
            if (!label) return "";
            return getPitchMilestone(label);
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: "ctrl",
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 }, color: state.COLORS.muted },
        grid: { display: false },
      },
      y: {
        ticks: {
          font: { size: 11 },
          color: state.COLORS.muted,
          callback: (v) => "€" + (v / 1000).toFixed(0) + "M",
        },
        grid: { color: "rgba(0,0,0,0.05)" },
        beginAtZero: true,
      },
    },
  });
}

// Convenience re-export so callers that spread baseOpts get a live reference.
// This must be accessed after initChartDefaults() has run.
export const baseOpts = state.baseOpts;
