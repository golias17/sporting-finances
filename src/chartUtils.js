import { state } from "./state.js";

// =============================================================
// HELPERS & CONSTANTS FOR CHARTS
// =============================================================

export const fmtMillions = (v) => {
  if (v === null || v === undefined) return "—";
  return "€" + (v < 0 ? "−" : "") + Math.abs(v / 1000).toFixed(1) + "M";
};

// =============================================================
// CANONICAL COLOR PALETTE
//
// Single source of truth for the app's brand/status colors, in both light
// and dark mode. These used to be hand-duplicated across initChartDefaults()
// below, updateChartTheme() in main.js, the hardcoded fallback literals in
// squadAnalytics.js/playground.js, and an entirely separate RGB-array copy
// in pdfGenerator.js for the PDF export — copies that had already drifted
// out of sync with each other (the PDF's gold and "negative" colors were
// stale values from before the app's palette was last tuned). Every
// consumer now derives from getBrandColors()/getZoneColors() so there is
// exactly one place to edit a color.
//
// Light-mode values match _variables.css's :root block exactly (--ink,
// --muted, --gold, --neg, --warn, --info, --pos, --green). Dark-mode
// green/gold/info are intentionally brighter than their CSS variables
// (which don't define dark-mode overrides for those three): a chart line
// needs more contrast against a near-black canvas than a button or badge
// does against a translucent dark surface, so dimming these to match CSS
// would hurt legibility. Dark-mode ink/muted/pos/neg/warn do have CSS
// overrides (body.dark in _variables.css) and match those exactly.
//
// mutedSoft is dimmer than the other *Soft tokens (0.35/0.2 opacity vs their
// 0.7/0.35) — it's used for catch-all "other" categories that should recede
// behind the real data series, not compete with them at the same visual
// weight the way posSoft/negSoft/infoSoft/goldSoft do for meaningful values.
const PALETTE = {
  light: {
    ink: "#111814",
    muted: "#6a716e",
    mutedSoft: "rgba(106,113,110,0.35)",
    chartBg: "#ffffff",
    green: "#0a5d3a",
    greenLight: "#2e9e6c",
    greenSoft: "rgba(10,93,58,0.15)",
    // gold/pos/warn were darkened to their current values in a WCAG AA
    // contrast pass (see _variables.css's matching comment) that touched
    // --gold/--pos/--warn there but missed updating this palette to match
    // — exactly the "drifted out of sync" failure mode this comment block
    // warns about above, just a new instance of it. Chart lines/bars and
    // the PDF export (both derived from this file, not CSS) were rendering
    // the old, contrast-failing colors while CSS-driven UI text had
    // already moved to the compliant ones.
    gold: "#8b6c1c",
    goldSoft: "rgba(139,108,28,0.4)",
    pos: "#2a7f4e",
    posSoft: "rgba(42,127,78,0.7)",
    neg: "#b8403a",
    negSoft: "rgba(184,64,58,0.7)",
    warn: "#956817",
    info: "#2c5b8a",
    infoSoft: "rgba(44,91,138,0.7)",
    lineBorder: "rgba(0, 0, 0, 0.12)",
  },
  dark: {
    ink: "#eaeaea",
    muted: "#8c938f",
    mutedSoft: "rgba(140,147,143,0.2)",
    chartBg: "#121513",
    green: "#2e9e6c",
    greenLight: "#3de080",
    greenSoft: "rgba(46, 158, 105, 0.2)",
    gold: "#ffd54f",
    goldSoft: "rgba(255, 213, 79, 0.25)",
    pos: "#3de080",
    posSoft: "rgba(61, 224, 128, 0.35)",
    neg: "#ff6b6b",
    negSoft: "rgba(255, 107, 107, 0.35)",
    warn: "#ffb300",
    info: "#52a3ff",
    infoSoft: "rgba(82, 163, 255, 0.35)",
    lineBorder: "rgba(255, 255, 255, 0.3)",
  },
};

// Low-opacity zone backgrounds for the health-ratio charts. Light-mode
// values match the --neg/--warn/--pos CSS variables above, just translucent.
const ZONE_PALETTE = {
  light: {
    red: "rgba(184,64,58,0.07)",
    amber: "rgba(201,140,31,0.08)",
    green: "rgba(46,138,85,0.06)",
  },
  dark: {
    red: "rgba(255, 107, 107, 0.15)",
    amber: "rgba(255, 179, 0, 0.15)",
    green: "rgba(61, 224, 128, 0.08)",
  },
};

export function getBrandColors(isDark) {
  return { ...PALETTE[isDark ? "dark" : "light"] };
}

export function getZoneColors(isDark) {
  return { ...ZONE_PALETTE[isDark ? "dark" : "light"] };
}

// Converts a "#rrggbb" hex string to a jsPDF-style [r, g, b] array. Used by
// pdfGenerator.js so the PDF export's colors stay derived from the same
// canonical hex values instead of a hand-copied RGB triple.
export function hexToRgbArray(hex) {
  const int = parseInt(hex.replace("#", ""), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

// Exported as a mutable object (rather than reassigned) because consumers
// import this exact reference and expect in-place updates from
// updateChartTheme() to be visible without re-importing.
export const ZONE_COLORS = getZoneColors(false);

// Static data, hoisted to module scope rather than built inside
// getPitchMilestone() below — that function is wired into every chart's
// shared tooltip footer callback (state.baseOpts.plugins.tooltip.callbacks.footer
// in initChartDefaults()), so it used to re-allocate this entire 14-entry
// bilingual object on every single tooltip update while a user hovers any
// chart in the app, for no reason since none of it depends on the call's
// arguments.
const PITCH_MILESTONES = {
  "2012/13": {
    en: "⚽ Pitch: 7th place in Primeira Liga (worst in club history).",
    pt: "⚽ Campo: 7º lugar na Primeira Liga (pior na história do clube)."
  },
  "2013/14": {
    en: "⚽ Pitch: Leonardo Jardim leads team to 2nd place & UCL qualification.",
    pt: "⚽ Campo: Leonardo Jardim lidera equipa ao 2º lugar e qualificação UCL."
  },
  "2014/15": {
    en: "⚽ Pitch: Marco Silva wins Taça de Portugal.",
    pt: "⚽ Campo: Marco Silva vence Taça de Portugal."
  },
  "2015/16": {
    en: "⚽ Pitch: Jorge Jesus arrives. Record 86 points, finished 2nd.",
    pt: "⚽ Campo: Jorge Jesus chega. Recorde de 86 pontos, terminou em 2º."
  },
  "2016/17": {
    en: "⚽ Pitch: 3rd place finish, qualified for UCL group stage.",
    pt: "⚽ Campo: Termina em 3º lugar, qualificação para a fase de grupos UCL."
  },
  "2017/18": {
    en: "⚽ Pitch: Alcochete academy attack. Taça de Portugal runners-up.",
    pt: "⚽ Campo: Ataque à academia de Alcochete. Finalista vencido da Taça."
  },
  "2018/19": {
    en: "⚽ Pitch: Marcel Keizer wins Taça de Portugal & Taça da Liga.",
    pt: "⚽ Campo: Marcel Keizer vence Taça de Portugal e Taça da Liga."
  },
  "2019/20": {
    en: "⚽ Pitch: Rúben Amorim appointed in March for record €10M fee.",
    pt: "⚽ Campo: Rúben Amorim contratado em Março por €10M (recorde)."
  },
  "2020/21": {
    en: "⚽ Pitch: Champions! First Primeira Liga title in 19 years.",
    pt: "⚽ Campo: Campeões! 1º título da Primeira Liga em 19 anos."
  },
  "2021/22": {
    en: "⚽ Pitch: UCL Round of 16 qualification; won Taça da Liga.",
    pt: "⚽ Campo: Oitavos-de-final da UCL; vence Taça da Liga."
  },
  "2022/23": {
    en: "⚽ Pitch: 4th place finish; Europa League quarter-finalists.",
    pt: "⚽ Campo: Termina em 4º lugar; Quartos-de-final da Liga Europa."
  },
  "2023/24": {
    en: "⚽ Pitch: Champions! 20th Primeira Liga title (Gyökeres 29 goals).",
    pt: "⚽ Campo: Campeões! 20º título da Primeira Liga (Gyökeres 29 golos)."
  },
  "2024/25": {
    en: "⚽ Pitch: Amorim departs for Man Utd; João Pereira appointed.",
    pt: "⚽ Campo: Amorim sai para o Man Utd; João Pereira contratado."
  },
  "2025/26": {
    en: "⚽ Pitch: Title contention under João Pereira.",
    pt: "⚽ Campo: Na luta pelo título sob o comando de João Pereira."
  }
};

export function getPitchMilestone(season) {
  let cleanSeason = season;
  if (season.includes("H1") || season.includes("Semestre") || season.includes("2025/26")) {
    cleanSeason = "2025/26";
  }

  const milestone = PITCH_MILESTONES[cleanSeason];
  if (!milestone) return "";

  return state.isPt ? milestone.pt : milestone.en;
}

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
  // Light-mode defaults, from the canonical palette above — see the
  // PALETTE comment for why this must stay the single source of truth.
  // updateChartTheme() in main.js re-applies this same palette (plus the
  // dark-mode variant) once the DOM/theme is known.
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
          }
        }
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

  // Whether a given scale (by ID, e.g. "y" or "y1") is a percentage axis —
  // checked via its title text or tick-formatting callback, so dual-axis
  // combo charts (e.g. the Playground's Equity €M + Solvency % chart) can
  // be detected per-axis instead of only via a single chart-wide guess.
  const scaleIsPct = (scaleId) => {
    const scale = config.options?.scales?.[scaleId];
    if (!scale) return false;
    if (scale.title?.text && String(scale.title.text).includes("%")) return true;
    if (scale.ticks?.callback) {
      try {
        return scale.ticks.callback(50).toString().includes("%");
      } catch {
        return false;
      }
    }
    return false;
  };

  // Determine if this is a percentage or ratio chart based on canvas ID or y-axis config
  const isPctChart =
    canvasId.toLowerCase().includes("ratio") ||
    canvasId.toLowerCase().includes("pct") ||
    canvasId.toLowerCase().includes("health") ||
    scaleIsPct("y");

  const isAlreadyInMillions =
    canvasId.toLowerCase().includes("managereras") ||
    canvasId.toLowerCase().includes("commissions") ||
    canvasId.toLowerCase().includes("playground");

  // `ds` (the dataset this value belongs to) is optional so existing call
  // sites that don't pass it keep the prior chart-wide behavior; passing it
  // lets a dataset pinned to a non-default axis (yAxisID: "y1") be formatted
  // by that axis's own units instead of the chart's primary "y" axis.
  const formatter = (v, ds) => {
    if (v === null || v === undefined) return "—";
    const pct = isPctChart || (ds?.yAxisID && ds.yAxisID !== "y" && scaleIsPct(ds.yAxisID));
    if (pct) {
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
            const fmt = formatter(v, ds);
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
