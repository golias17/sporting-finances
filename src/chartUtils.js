import { state } from "./state.js";

// =============================================================
// HELPERS & CONSTANTS FOR CHARTS
// =============================================================

export const fmtMillions = (v) => {
  if (v === null || v === undefined) return "—";
  return "€" + (v < 0 ? "−" : "") + Math.abs(v / 1000).toFixed(1) + "M";
};

export const fmtPct = (v) =>
  v === null || v === undefined ? "—" : (v * 100).toFixed(0) + "%";

export const ZONE_COLORS = {
  red: "rgba(198,64,79,0.07)",
  amber: "rgba(217,156,43,0.08)",
  green: "rgba(46,138,85,0.06)",
};

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
  Object.assign(state.COLORS, {
    green: "#0a5d3a",
    greenLight: "#2e9e6c",
    greenSoft: "rgba(10,93,58,0.15)",
    gold: "#c8a951",
    goldSoft: "rgba(200,169,81,0.4)",
    pos: "#2e8a55",
    neg: "#c6404f",
    negSoft: "rgba(198,64,79,0.7)",
    posSoft: "rgba(46,138,85,0.7)",
    warn: "#d99c2b",
    info: "#3a72b8",
    infoSoft: "rgba(58,114,184,0.7)",
    ink: "#18221d",
    muted: "#5a6a62",
  });

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
        backgroundColor: "rgba(250, 248, 243, 0.95)",
        titleColor: "#14181a",
        bodyColor: "#2c3437",
        borderColor: "#e6e1d4",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        titleFont: { family: "Inter", size: 12, weight: "bold" },
        bodyFont: { family: "Inter", size: 12 },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
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

export function getEventAnnotations() {
  return {
    restructure14: {
      x: "2014/15",
      label: state.isPt ? "Reestruturação 2014" : "2014 Capital Restructuring",
      color: state.COLORS.info,
    },
    alcochete: {
      x: "2017/18",
      label: state.isPt ? "Alcochete 2018" : "2018 Alcochete",
      color: state.COLORS.neg,
    },
    covid: { x: "2020/21", label: "COVID", color: state.COLORS.warn },
    vmoc1: {
      x: "2022/23",
      label: state.isPt ? "Conversão VMOC €83,6M" : "€83.6M VMOC conversion",
      color: state.COLORS.green,
    },
    vmoc2: {
      x: "2023/24",
      label: state.isPt ? "Conversão VMOC €51,4M" : "€51.4M VMOC conversion",
      color: state.COLORS.green,
    },
    uspp: {
      x: "2024/25",
      label: state.isPt
        ? "→ Out 2025: USPP de €225M"
        : "→ Oct 2025: €225M USPP",
      color: state.COLORS.green,
    },
  };
}

export function eventBoxes(eventKeys) {
  const annos = {};
  const eventAnnotations = getEventAnnotations();
  eventKeys.forEach((k) => {
    const e = eventAnnotations[k];
    if (!e) return;
    annos["e_" + k] = {
      type: "line",
      xMin: e.x,
      xMax: e.x,
      borderColor: e.color,
      borderWidth: 1.5,
      z: -1,
      borderDash: [4, 4],
      label: {
        display: true,
        content: e.label,
        position: "start",
        backgroundColor: e.color,
        color: "#fff",
        font: { size: 10, weight: "600" },
        padding: 4,
        rotation: -90,
        yAdjust: 0,
      },
    };
  });
  return annos;
}

// Convenience re-export so callers that spread baseOpts get a live reference.
// This must be accessed after initChartDefaults() has run.
export const baseOpts = state.baseOpts;

// Registry of all Chart instances keyed by canvas ID.
export const chartRegistry = new Map();

export function generateAccessibleTable(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const tableId = canvasId + "-a11y-table";
  let table = document.getElementById(tableId);
  if (!table) {
    table = document.createElement("table");
    table.id = tableId;
    table.className = "sr-only";
    canvas.parentNode.insertBefore(table, canvas.nextSibling);
  }

  const { data } = config;
  if (!data || !data.labels || !data.datasets) return;

  // "Year" column header is localised to match the app language.
  const yearHeader = state.isPt ? "Época" : "Year";
  const thead = `<thead><tr><th>${yearHeader}</th>${data.datasets.map((ds) => `<th>${ds.label || "Value"}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${data.labels
    .map(
      (lbl, i) =>
        `<tr><td>${lbl}</td>${data.datasets
          .map((ds) => {
            const v = ds.data[i];
            const fmt =
              v !== null && v !== undefined
                ? typeof v === "number"
                  ? v.toFixed(2)
                  : v
                : "N/A";
            return `<td>${fmt}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("")}</tbody>`;

  table.innerHTML = `<caption>Data table for chart ${canvasId}</caption>${thead}${tbody}`;
}
