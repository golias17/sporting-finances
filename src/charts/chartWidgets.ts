import { state } from "../core/state.js";
import type { Chart } from "chart.js";

interface TooltipContext {
  chart: Chart;
  tooltip: {
    opacity: number;
    title: string[];
    body: Array<{ lines: string[] }>;
    labelColors: Array<{ backgroundColor?: string; borderColor?: string }>;
    footer: string[];
    caretX: number;
    caretY: number;
  };
}

// CHART COMPANION WIDGETS
// =============================================================

export function externalTooltipHandler(context: TooltipContext) {
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
      .map((t: string) => `<div class="glass-tooltip-title">${t}</div>`)
      .join("");

    let bodyHtml = '<div class="glass-tooltip-body">';
    tooltip.body.forEach((bodyItem: { lines: string[] }, i: number) => {
      const colors = tooltip.labelColors[i] || {};
      const color = colors.backgroundColor || colors.borderColor || "#ccc";

      bodyItem.lines.forEach((line: string) => {
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
      tooltip.footer.forEach((ft: string) => {
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
