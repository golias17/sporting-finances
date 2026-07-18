import { state } from "./state.js";

// =============================================================
// HELPERS & CONSTANTS FOR CHARTS
// =============================================================

export const fmtMillions = (v) => {
  if (v === null || v === undefined) return "—";
  return "€" + (v < 0 ? "−" : "") + Math.abs(v / 1000).toFixed(1) + "M";
};

// Base colors here match the light-mode --neg/--warn/--pos CSS variables in
// _variables.css (see initChartDefaults() below for why that alignment
// matters), just at low opacity for use as chart zone backgrounds.
export const ZONE_COLORS = {
  red: "rgba(184,64,58,0.07)",
  amber: "rgba(201,140,31,0.08)",
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
  // These light-mode defaults are the same colors as _variables.css's
  // :root block (--green, --gold, --pos, --neg, --warn, --info, --ink,
  // --muted). They used to be a separate, slightly-off palette (e.g. gold
  // #c8a951 here vs --gold #b08923 in CSS) — chart lines and legends
  // wouldn't quite match the color of the badges, buttons and text right
  // next to them. Keep these two definitions in sync; see also
  // updateChartTheme() in main.js, which applies the same values (plus the
  // dark-mode variants) once the DOM/theme is known.
  Object.assign(state.COLORS, {
    green: "#0a5d3a",
    greenLight: "#2e9e6c",
    greenSoft: "rgba(10,93,58,0.15)",
    gold: "#b08923",
    goldSoft: "rgba(176,137,35,0.4)",
    pos: "#2e8a55",
    neg: "#b8403a",
    negSoft: "rgba(184,64,58,0.7)",
    posSoft: "rgba(46,138,85,0.7)",
    warn: "#c98c1f",
    info: "#2c5b8a",
    infoSoft: "rgba(44,91,138,0.7)",
    ink: "#111814",
    muted: "#6a716e",
    chartBg: "#ffffff",
    lineBorder: "rgba(0, 0, 0, 0.12)",
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
        enabled: false,
        external: externalTooltipHandler,
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
  // Event markers have a fixed season (e.g. "2014/15") regardless of the
  // active global era filter. The chart's x-axis only has categories for
  // whatever state.annual currently covers, so a marker outside that range
  // has nowhere valid to anchor to — the annotation plugin was clamping it
  // to the nearest edge instead, making it look like it belonged to
  // whichever season happened to be first/last. Drop it instead.
  const visibleSeasons = state.annual
    ? new Set(state.annual.map((d) => d.label))
    : null;
  eventKeys.forEach((k) => {
    const e = eventAnnotations[k];
    if (!e) return;
    if (visibleSeasons && !visibleSeasons.has(e.x)) return;
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
  let wrapper = null;

  if (!table) {
    wrapper = document.createElement("div");
    wrapper.id = tableId + "-wrap";
    wrapper.className = "table-wrap scroll-x sr-only";

    table = document.createElement("table");
    table.id = tableId;
    table.className = "data";

    wrapper.appendChild(table);
    canvas.parentNode.insertBefore(wrapper, canvas.nextSibling);
  } else {
    wrapper = document.getElementById(tableId + "-wrap");
  }

  // Create table toggle button for sighted screen reader accessibility
  // It is placed OUTSIDE the chart-box container (in the card) directly after it to prevent layout collisions.
  const btnId = canvasId + "-table-toggle";
  let toggleBtn = document.getElementById(btnId);
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.id = btnId;
    toggleBtn.className = "table-toggle-btn";

    const container = canvas.parentNode;
    if (
      container &&
      container.classList &&
      container.classList.contains("chart-box")
    ) {
      container.parentNode.insertBefore(toggleBtn, container.nextSibling);
    } else {
      canvas.parentNode.insertBefore(toggleBtn, canvas.nextSibling);
    }
  }

  const isHidden = wrapper.classList.contains("sr-only");
  // Synchronize canvas visibility with table visibility (canvas is hidden if table is shown)
  canvas.classList.toggle("hidden", !isHidden);

  toggleBtn.setAttribute("aria-controls", tableId + "-wrap");
  toggleBtn.setAttribute("aria-expanded", isHidden ? "false" : "true");

  const getBtnText = (hidden) => {
    return hidden
      ? state.isPt
        ? "Ver dados em tabela"
        : "View raw table data"
      : state.isPt
        ? "Ocultar tabela"
        : "Hide table data";
  };

  const tableIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle; transition: transform 0.2s ease;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>`;

  toggleBtn.innerHTML = tableIcon + `<span>${getBtnText(isHidden)}</span>`;

  toggleBtn.onclick = () => {
    const hidden = wrapper.classList.toggle("sr-only");
    canvas.classList.toggle("hidden", !hidden);
    toggleBtn.setAttribute("aria-expanded", hidden ? "false" : "true");
    toggleBtn.innerHTML = tableIcon + `<span>${getBtnText(hidden)}</span>`;
  };

  const { data } = config;
  if (!data || !data.labels || !data.datasets) return;

  // Determine if this is a percentage or ratio chart based on canvas ID or y-axis config
  const isPctChart =
    canvasId.toLowerCase().includes("ratio") ||
    canvasId.toLowerCase().includes("pct") ||
    canvasId.toLowerCase().includes("health") ||
    (config.options?.scales?.y?.ticks?.callback &&
      config.options.scales.y.ticks.callback(50).toString().includes("%"));

  const isAlreadyInMillions =
    canvasId.toLowerCase().includes("managereras") ||
    canvasId.toLowerCase().includes("commissions");

  const formatter = (v) => {
    if (v === null || v === undefined) return "—";
    if (isPctChart) {
      return typeof v === "number" ? `${v.toFixed(1)}%` : `${v}%`;
    }
    // Default to currency formatting for thousands values (standard in this SAD report)
    if (typeof v === "number") {
      const sign = v < 0 ? "−" : "";
      const val = isAlreadyInMillions ? Math.abs(v) : Math.abs(v) / 1000;
      return `€${sign}${val.toFixed(1)}M`;
    }
    return v;
  };

  const cellClass = (v) => {
    if (typeof v === "number" && v < 0) return ' class="neg"';
    if (
      typeof v === "number" &&
      v > 0 &&
      (canvasId.toLowerCase().includes("netresult") ||
        canvasId.toLowerCase().includes("profit"))
    ) {
      return ' class="pos"';
    }
    return "";
  };

  // "Year" column header is localised to match the app language.
  const yearHeader = state.isPt ? "Época" : "Year";
  const thead = `<thead><tr><th>${yearHeader}</th>${data.datasets.map((ds) => `<th>${ds.label || "Value"}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${data.labels
    .map(
      (lbl, i) =>
        `<tr><td>${lbl}</td>${data.datasets
          .map((ds) => {
            const v = ds.data[i];
            const fmt = formatter(v);
            const cls = cellClass(v);
            return `<td${cls}>${fmt}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("")}</tbody>`;

  const captionText = state.isPt
    ? `Tabela de dados do gráfico ${canvasId}`
    : `Data table for chart ${canvasId}`;
  table.innerHTML = `<caption>${captionText}</caption>${thead}${tbody}`;
}

export function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  let tooltipEl = document.getElementById("chartjs-tooltip");

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = "chartjs-tooltip";
    tooltipEl.className = "glass-tooltip hidden";
    document.body.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.classList.add("hidden");
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const titleHtml = titleLines
      .map((t) => `<div class="glass-tooltip-title">${t}</div>`)
      .join("");

    let bodyHtml = '<div class="glass-tooltip-body">';
    tooltip.body.forEach((bodyItem, i) => {
      const colors = tooltip.labelColors[i] || {};
      const color = colors.backgroundColor || colors.borderColor || "#ccc";

      bodyItem.lines.forEach((line) => {
        let label = line;
        let value = "";
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          label = line.slice(0, colonIdx).trim();
          value = line.slice(colonIdx + 1).trim();
        }

        if (value) {
          bodyHtml += `
            <div class="glass-tooltip-row">
              <span class="glass-tooltip-color" style="background-color: ${color}"></span>
              <span class="glass-tooltip-text">${label}: <strong>${value}</strong></span>
            </div>
          `;
        } else {
          bodyHtml += `
            <div class="glass-tooltip-row">
              <span class="glass-tooltip-color" style="background-color: ${color}"></span>
              <span class="glass-tooltip-text"><strong>${label}</strong></span>
            </div>
          `;
        }
      });
    });
    bodyHtml += "</div>";

    if (tooltip.footer && tooltip.footer.length > 0) {
      let footerHtml = '<div class="glass-tooltip-footer">';
      tooltip.footer.forEach((ft) => {
        footerHtml += `<div class="glass-tooltip-footer-line">${ft}</div>`;
      });
      footerHtml += "</div>";
      bodyHtml += footerHtml;
    }

    tooltipEl.innerHTML = titleHtml + bodyHtml;
  }

  const canvasRect = chart.canvas.getBoundingClientRect();
  tooltipEl.classList.remove("hidden");

  // Position tooltip relative to page scroll and viewport coordinates of the canvas
  const tooltipX = canvasRect.left + window.scrollX + tooltip.caretX;
  const tooltipY = canvasRect.top + window.scrollY + tooltip.caretY;

  tooltipEl.style.left = tooltipX + "px";
  tooltipEl.style.top = tooltipY - 12 + "px";
}

export function addChartDownloadButton(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const card = canvas.closest(".card");
  if (!card) return;

  const cardHead = card.querySelector(".card-head");
  if (!cardHead) return;

  const btnId = canvasId + "-download-btn";
  if (document.getElementById(btnId)) {
    // Update labels if already existing on language switches
    const btn = document.getElementById(btnId);
    btn.setAttribute(
      "aria-label",
      state.isPt
        ? "Descarregar gráfico como imagem"
        : "Download chart as image",
    );
    btn.title = state.isPt
      ? "Descarregar gráfico como imagem PNG"
      : "Download chart as PNG image";
    return;
  }

  const btn = document.createElement("button");
  btn.id = btnId;
  btn.className = "chart-download-btn";
  btn.setAttribute(
    "aria-label",
    state.isPt ? "Descarregar gráfico como imagem" : "Download chart as image",
  );
  btn.title = state.isPt
    ? "Descarregar gráfico como imagem PNG"
    : "Download chart as PNG image";

  const downloadIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
  btn.innerHTML = downloadIcon + `<span>PNG</span>`;

  btn.onclick = () => {
    const chart = chartRegistry.get(canvasId);
    if (!chart) return;

    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${canvasId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tag = cardHead.querySelector(".tag");
  if (tag) {
    tag.parentNode.insertBefore(btn, tag.nextSibling);
  } else {
    cardHead.appendChild(btn);
  }
}
