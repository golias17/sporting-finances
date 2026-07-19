import { state } from "./state.js";
import { renderKpis } from "./kpi.js";
import { fmtMillions } from "./chartUtils.js";
import Chart from "chart.js/auto";

import { calculateHealthSignals } from "./metrics.js";
import { syncStateToUrl } from "./urlSync.js";

// Keep track of sparkline chart instances to destroy them before re-rendering.
//
// Deliberately a separate registry from chartUtils.js's shared chartRegistry
// / charts.js's mkChart() rather than folding these in, even though every
// other chart in the app goes through mkChart(): mkChart() unconditionally
// calls generateAccessibleTable(), which — for canvases not wrapped in the
// .card/.card-head structure the rest of the app uses (these sparklines sit
// inside a small .sparkline-wrap next to their own text value/note, one of
// several per health signal, with dynamically generated IDs) — would still
// inject a hidden data table plus a "View raw table data" toggle button
// right next to each tiny sparkline. That's a real UX regression (a stray
// button cluttering 8 small decorative cards) for very little accessibility
// gain, since the adjacent .sig-value/.sig-note text already conveys the
// substantive number to screen readers. This registry's own destroy-before-
// rebuild handling (below, in renderContent) already covers the one thing
// the shared registry would otherwise provide. The canvases do still carry
// role="img"/aria-label (see renderContent) so they aren't silent to
// assistive tech.
const sparklineRegistry = {};

// AbortControllers for each season-selector's click listener — replaced each
// time its owning init function is called so we never accumulate duplicate
// listeners.
let selectorAbortController = null;
let kpiSelectorAbortController = null;

// Tracks which season index the health signals/sparklines were last actually
// drawn for. Used by refreshHealthBarIfStale() to detect when the KPI-strip
// selector changed the season while the Health tab was hidden.
let lastRenderedIdx = null;

function buildSeasonPillsHtml() {
  return state.annual
    .map(
      (a, i) =>
        `<button class="season-pill" data-idx="${i}" aria-pressed="false">${a.label}</button>`,
    )
    .join("");
}

// Every .season-selector on the page (the Health tab's own, and the
// KPI-strip one on Overview) shares the same underlying season index, so
// both need their active pill kept in sync regardless of which one the user
// actually clicked. Each selector must be walked independently — treating
// every .season-pill across both containers as one flat, combined list (as
// this used to) breaks as soon as both selectors have pills: the second
// selector's pills sit at a DOM-order offset from the first, so "index i in
// the combined list" no longer lines up with "index i within this selector",
// and the Health tab's own pill could end up never matching idx at all.
function updateActivePills(idx) {
  document.querySelectorAll(".season-selector").forEach((selector) => {
    selector.querySelectorAll(".season-pill").forEach((btn, i) => {
      const isActive = i === idx;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  });
}

function pickInitialIdx() {
  let initialIdx = -1;
  if (state.urlHealthSeason) {
    initialIdx = state.annual.findIndex(
      (a) => a.label === state.urlHealthSeason,
    );
  }
  return initialIdx >= 0 ? initialIdx : state.annual.length - 1;
}

// HEALTH BAR  (season-interactive)
// =============================================================
export function initHealthBar() {
  const selector = document.getElementById("seasonSelector");
  selector.innerHTML = buildSeasonPillsHtml();

  // Tear down the previous listener before attaching a fresh one
  if (selectorAbortController) {
    selectorAbortController.abort();
  }
  selectorAbortController = new AbortController();
  selector.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest(".season-pill");
      if (btn) renderHealthBar(parseInt(btn.dataset.idx, 10));
    },
    { signal: selectorAbortController.signal },
  );

  // Default to latest season on first initialization
  if (state.healthBarIdx === null) {
    state.setHealthBarIdx(pickInitialIdx());
  }
  renderHealthBar(state.healthBarIdx);
}

// Wires the lightweight season selector in the Overview KPI strip. It shares
// state.healthBarIdx with the Health tab's own selector but deliberately
// never touches the health-signal sparklines — those canvases live inside
// the Health tab-panel, which is display:none whenever Overview is active,
// and Chart.js sizes a new instance off the canvas's current layout box, so
// building one while hidden would leave it stuck at 0×0. Instead this just
// updates the shared index, the KPI values, and every selector's active
// pill (safe even while the Health tab is hidden); refreshHealthBarIfStale()
// catches the Health tab's own content up next time it's actually shown.
function updateKpiBarTitle(idx) {
  const el = document.getElementById("kpiBarTitle");
  if (!el) return;
  const d = state.annual[idx];
  el.textContent = state.isPt
    ? `Visão Geral do Clube — ${d.label}`
    : `Club Overview — ${d.label}`;
}

export function initKpiSeasonSelector() {
  const selector = document.getElementById("kpiSeasonSelector");
  if (!selector) return;
  selector.innerHTML = buildSeasonPillsHtml();

  if (kpiSelectorAbortController) {
    kpiSelectorAbortController.abort();
  }
  kpiSelectorAbortController = new AbortController();
  selector.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest(".season-pill");
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx, 10);
      state.setHealthBarIdx(idx);
      updateActivePills(idx);
      renderKpis(idx);
      updateKpiBarTitle(idx);
      syncStateToUrl();
    },
    { signal: kpiSelectorAbortController.signal },
  );

  if (state.healthBarIdx === null) {
    state.setHealthBarIdx(pickInitialIdx());
  }
  updateActivePills(state.healthBarIdx);
  renderKpis(state.healthBarIdx);
  updateKpiBarTitle(state.healthBarIdx);
}

// Called every time the Health tab is activated. initHealthBar() only ever
// fully runs once (gated by state.renderedCharts in main.js), so if the
// season changed via the KPI-strip selector while the Health tab was
// hidden, its signals/sparklines would otherwise stay stale indefinitely.
export function refreshHealthBarIfStale() {
  if (lastRenderedIdx === null) return; // initHealthBar hasn't run yet — it'll render fresh when it does
  if (state.healthBarIdx !== lastRenderedIdx) {
    renderHealthBar(state.healthBarIdx);
  }
}

// Not exported — only called internally (initHealthBar and the season-pill
// click handler). Nothing outside this file imports it.
function renderHealthBar(idx) {
  if (idx === undefined) idx = state.healthBarIdx;
  state.setHealthBarIdx(idx);
  lastRenderedIdx = idx;

  const d = state.annual[idx];

  updateActivePills(idx);

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
              <canvas
                id="${s.id}"
                role="img"
                aria-label="${state.isPt ? `Tendência de ${s.label}` : `${s.label} trend`}"
              ></canvas>
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

  // Keep headline KPIs (and their bar title) in sync with the selected season
  renderKpis(idx);
  updateKpiBarTitle(idx);

  syncStateToUrl();
}

// =============================================================
