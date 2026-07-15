import { state } from "./state.js";
import { renderKpis } from "./kpi.js";
import { fmtMillions } from "./chartUtils.js";
import Chart from "chart.js/auto";

import { calculateHealthSignals } from "./metrics.js";
import { syncStateToUrl } from "./urlSync.js";

// Keep track of sparkline chart instances to destroy them before re-rendering
const sparklineRegistry = {};

// AbortController for the season selector click listener — replaced each time
// initHealthBar is called so we never accumulate duplicate listeners.
let selectorAbortController = null;

// HEALTH BAR  (season-interactive)
// =============================================================
export function initHealthBar() {
  const selector = document.getElementById("seasonSelector");
  selector.innerHTML = state.annual
    .map(
      (a, i) =>
        `<button class="season-pill" data-idx="${i}" aria-pressed="false">${a.label}</button>`,
    )
    .join("");

  // Tear down the previous listener before attaching a fresh one
  if (selectorAbortController) {
    selectorAbortController.abort();
  }
  selectorAbortController = new AbortController();
  selector.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest(".season-pill");
      if (btn) renderHealthBar(parseInt(btn.dataset.idx));
    },
    { signal: selectorAbortController.signal },
  );

  // Default to latest season on first initialization
  if (state.healthBarIdx === null) {
    let initialIdx = -1;
    if (state.urlHealthSeason) {
      initialIdx = state.annual.findIndex(
        (a) => a.label === state.urlHealthSeason,
      );
    }
    state.setHealthBarIdx(
      initialIdx >= 0 ? initialIdx : state.annual.length - 1,
    );
  }
  renderHealthBar(state.healthBarIdx);
}

export function renderHealthBar(idx) {
  if (idx === undefined) idx = state.healthBarIdx;
  state.setHealthBarIdx(idx);

  const d = state.annual[idx];

  // Update active pill
  document
    .querySelectorAll("#seasonSelector .season-pill")
    .forEach((btn, i) => {
      const isActive = i === idx;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  // Title
  document.getElementById("healthBarTitle").textContent = state.isPt
    ? `Saúde Financeira do Clube — ${d.label}`
    : `Club Financial Health — ${d.label}`;

  const signals = calculateHealthSignals(state, idx, fmtMillions);

  const el = document.getElementById("healthSignals");
  const isSameYear = el.dataset.renderedIdx === String(idx);
  el.dataset.renderedIdx = idx;

  const renderContent = () => {
    el.innerHTML = signals
      .map(
        (s) =>
          `<div class="health-signal ${s.status}">
            <div class="sig-header">
              <div class="sig-icon">${s.icon}</div>
              <div class="sig-label">${s.label}</div>
              <div class="status-dot"></div>
            </div>
            <div class="sig-value">${s.value}</div>
            <div class="sig-note">${s.note}</div>
            <div class="sparkline-wrap">
              <canvas id="${s.id}"></canvas>
            </div>
          </div>`,
      )
      .join("");

    // Recompute labels for sparkline x-axis (mirrors histData in metrics.js)
    const histStartIdx = Math.max(0, idx - 4);
    const histLabels = state.annual
      .slice(histStartIdx, idx + 1)
      .map((y) => y.label);

    // Render sparklines
    signals.forEach((s) => {
      if (sparklineRegistry[s.id]) {
        sparklineRegistry[s.id].destroy();
      }

      const ctx = document.getElementById(s.id);
      if (!ctx) return;

      const colorMap = {
        green: state.COLORS.pos,
        amber: state.COLORS.warn,
        red: state.COLORS.neg,
      };
      const color = colorMap[s.status] || state.COLORS.ink;

      sparklineRegistry[s.id] = new Chart(ctx, {
        type: "line",
        data: {
          labels: histLabels,
          datasets: [
            {
              data: s.history,
              borderColor: color,
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          layout: { padding: 0 },
        },
      });
    });

    el.classList.remove("fading");
  };

  if (isSameYear) {
    renderContent();
  } else {
    el.classList.add("fading");
    setTimeout(renderContent, 120);
  }

  // Keep headline KPIs in sync with the selected season
  renderKpis(idx);

  syncStateToUrl();
}

// =============================================================
