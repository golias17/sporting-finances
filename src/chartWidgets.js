import { state } from "./state.js";

// CHART COMPANION WIDGETS — accessible data tables, the shared glass
// tooltip, and the PNG download button every chart in the app gets.
// =============================================================

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
    if (scale.title?.text && String(scale.title.text).includes("%"))
      return true;
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
    const pct =
      isPctChart ||
      (ds?.yAxisID && ds.yAxisID !== "y" && scaleIsPct(ds.yAxisID));
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
